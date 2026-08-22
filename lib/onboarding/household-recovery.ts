"use server";

import { consumeRateLimit } from "@/lib/auth/rate-limit";
import {
  getPasswordResetTokenSecretSource,
  signPasswordResetToken,
} from "@/lib/auth/password-reset-token";
import {
  describeEmailSendConfig,
  sendOnboardingEmail,
} from "@/lib/email/resend-client";
import { getDefaultAppUrl } from "@/lib/email/templates";
import { createAdminClient } from "@/lib/supabase/admin";
import { findAuthUserIdByEmail } from "@/lib/onboarding/parent-master-lookup";
import { loadProfileByUsername } from "@/lib/onboarding/sign-in-supabase";
import { normalizeEmailAddress } from "@/lib/validation/email";

export type PasswordRecoveryFailureReason =
  | "token_secret_missing"
  | "resend_not_configured"
  | "resend_from_rejected"
  | "resend_rejected"
  | "unexpected";

export type HouseholdRecoveryResult =
  | { accepted: true; recipientEmail: string }
  | { accepted: false; error: string; reason?: PasswordRecoveryFailureReason };

function logPasswordRecoveryFailure(details: Record<string, unknown>) {
  console.error("[password-recovery]", {
    ...details,
    tokenSecretSource: getPasswordResetTokenSecretSource(),
    email: describeEmailSendConfig(),
    appUrlConfigured: Boolean(process.env.NEXT_PUBLIC_APP_URL?.trim()),
  });
}

function classifyResendFailure(sendError: string): {
  reason: PasswordRecoveryFailureReason;
  error: string;
} {
  const lower = sendError.toLowerCase();
  if (sendError === "Email service is not configured.") {
    return {
      reason: "resend_not_configured",
      error: "Could not send a recovery email. Email service is not configured.",
    };
  }
  if (
    lower.includes("domain is not verified") ||
    lower.includes("invalid `from`") ||
    lower.includes("invalid from")
  ) {
    return {
      reason: "resend_from_rejected",
      error: "Could not send a recovery email. The sender address is not verified.",
    };
  }
  return {
    reason: "resend_rejected",
    error: "Could not send a recovery email. Try again shortly.",
  };
}

function failureMessage(error: unknown): string {
  return error instanceof Error ? error.message : "unknown";
}

type ResetTarget = {
  userId: string;
  username: string;
  label: string;
  kind: "parent" | "child";
};

type ResolvedReset = {
  target: ResetTarget;
  recipientEmail: string;
};

type AdminClient = ReturnType<typeof createAdminClient>;

/**
 * Resolves exactly one account and emails one reset link.
 * Always looks like success when the request is well-formed so the UI never
 * discloses whether an account exists.
 */
export async function requestHouseholdPasswordRecovery(input: {
  email?: string;
  username?: string;
}): Promise<HouseholdRecoveryResult> {
  const requestedEmail = normalizeEmailAddress(input.email ?? "");
  const requestedUsername = input.username?.trim() ?? "";

  if (input.email?.trim() && !requestedEmail) {
    return { accepted: false, error: "Enter a valid email address." };
  }
  if (!requestedEmail && !requestedUsername) {
    return {
      accepted: false,
      error: "Enter the email for that login, or a username that identifies one account.",
    };
  }

  const rateKey = requestedEmail
    ? `household-recovery:${requestedEmail}`
    : `household-recovery:user:${requestedUsername.toLowerCase()}`;
  const limit = consumeRateLimit(rateKey, 3, 15 * 60_000);
  if (!limit.allowed) {
    return {
      accepted: false,
      error: "Too many recovery emails for this address. Try again in a few minutes.",
    };
  }

  let admin: AdminClient;
  try {
    admin = createAdminClient();
  } catch {
    return { accepted: true, recipientEmail: requestedEmail ?? "" };
  }

  try {
    const resolved = await resolveOneResetTarget(admin, {
      email: requestedEmail,
      username: requestedUsername,
    });

    if (!resolved) {
      return { accepted: true, recipientEmail: requestedEmail ?? "" };
    }

    console.info("[password-recovery] reset target", {
      userId: resolved.target.userId,
      kind: resolved.target.kind,
    });

    const createdAt = new Date().toISOString();
    let token: string;
    try {
      token = signPasswordResetToken({
        userId: resolved.target.userId,
        username: resolved.target.username,
        createdAt,
      });
    } catch (error) {
      const tokenSecretSource = getPasswordResetTokenSecretSource();
      const reason: PasswordRecoveryFailureReason =
        tokenSecretSource === "missing" ? "token_secret_missing" : "unexpected";
      logPasswordRecoveryFailure({
        reason,
        stage: "sign_reset_token",
        targetCount: 1,
        message: failureMessage(error),
      });
      return {
        accepted: false,
        reason,
        error:
          reason === "token_secret_missing"
            ? "Could not send a recovery email. Reset-token secret is not configured."
            : "Could not send a recovery email. Try again shortly.",
      };
    }

    const sendResult = await sendOnboardingEmail({
      type: "CREDENTIAL_RECOVERY",
      recipientEmail: resolved.recipientEmail,
      data: {
        label: resolved.target.label,
        token,
        kind: resolved.target.kind,
      },
      appUrl: getDefaultAppUrl(),
    });

    if (!sendResult.success) {
      const classified = classifyResendFailure(sendResult.error);
      logPasswordRecoveryFailure({
        reason: classified.reason,
        stage: "resend_send",
        targetCount: 1,
        resendError: sendResult.error,
      });
      return {
        accepted: false,
        reason: classified.reason,
        error: classified.error,
      };
    }

    return { accepted: true, recipientEmail: requestedEmail ?? "" };
  } catch (error) {
    logPasswordRecoveryFailure({
      reason: "unexpected",
      stage: "household_recovery",
      message: failureMessage(error),
    });
    return {
      accepted: false,
      reason: "unexpected",
      error: "Could not send a recovery email. Try again shortly.",
    };
  }
}

/**
 * Emails the username(s) linked to this address.
 * Pathfinder / Maverick: the learner username on that Auth email.
 * Parent / Explorer household: linked child usernames.
 */
export async function requestHouseholdUsernameRecovery(
  email: string,
): Promise<HouseholdRecoveryResult> {
  const recipientEmail = normalizeEmailAddress(email);
  if (!recipientEmail) {
    return { accepted: false, error: "Enter a valid email address." };
  }

  const limit = consumeRateLimit(
    `household-username:${recipientEmail}`,
    3,
    15 * 60_000,
  );
  if (!limit.allowed) {
    return {
      accepted: false,
      error: "Too many recovery emails for this address. Try again in a few minutes.",
    };
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return {
      accepted: false,
      error: "Could not send a recovery email. Try again shortly.",
    };
  }

  const userId = await findAuthUserIdByEmail(recipientEmail);
  let ownUsername: string | null = null;
  let ownRole: string | null = null;
  if (userId) {
    const { data: profile } = await admin
      .from("profiles")
      .select("username, account_role")
      .eq("id", userId)
      .maybeSingle();
    ownUsername = profile?.username?.trim() || null;
    ownRole = profile?.account_role ?? null;
  }

  if (ownRole === "child" && ownUsername) {
    const sendResult = await sendOnboardingEmail({
      type: "USERNAME_RECOVERY",
      recipientEmail,
      data: { username: ownUsername },
    });
    if (!sendResult.success) {
      const classified = classifyResendFailure(
        sendResult.error || "Email send failed.",
      );
      return {
        accepted: false,
        reason: classified.reason,
        error: classified.error,
      };
    }
    return { accepted: true, recipientEmail };
  }

  const linkedUsernames: string[] = [];
  if (userId) {
    const childIds = await listHouseholdChildIds(admin, userId, recipientEmail);
    for (const childId of childIds) {
      const { data: child } = await admin
        .from("profiles")
        .select("username, account_role")
        .eq("id", childId)
        .maybeSingle();
      if (child?.account_role === "child" && child.username?.trim()) {
        linkedUsernames.push(child.username.trim());
      }
    }
  }

  if (linkedUsernames.length === 0) {
    const childIds = await listChildIdsByParentEmail(admin, recipientEmail);
    for (const childId of childIds) {
      const { data: child } = await admin
        .from("profiles")
        .select("username, account_role")
        .eq("id", childId)
        .maybeSingle();
      if (child?.account_role === "child" && child.username?.trim()) {
        linkedUsernames.push(child.username.trim());
      }
    }
  }

  const unique = [...new Set(linkedUsernames)];
  if (unique.length === 0) {
    return { accepted: true, recipientEmail };
  }

  const sendResult = await sendOnboardingEmail({
    type: "USERNAME_RECOVERY",
    recipientEmail,
    data: {
      username: unique[0]!,
      linkedUsernames: unique,
    },
  });
  if (!sendResult.success) {
    const classified = classifyResendFailure(
      sendResult.error || "Email send failed.",
    );
    return {
      accepted: false,
      reason: classified.reason,
      error: classified.error,
    };
  }

  return { accepted: true, recipientEmail };
}

async function listHouseholdChildIds(
  admin: AdminClient,
  parentId: string,
  parentEmail: string,
): Promise<string[]> {
  const ids = new Set<string>();
  const { data: links } = await admin
    .from("parent_child")
    .select("child_id")
    .eq("parent_id", parentId);
  for (const row of links ?? []) {
    if (row.child_id) ids.add(row.child_id);
  }
  for (const childId of await listChildIdsByParentEmail(admin, parentEmail)) {
    ids.add(childId);
  }
  return [...ids];
}

async function listChildIdsByParentEmail(
  admin: AdminClient,
  parentEmail: string,
): Promise<string[]> {
  const { data: rows } = await admin
    .from("consent_requests")
    .select("child_id")
    .eq("parent_email", parentEmail);
  const ids = new Set<string>();
  for (const row of rows ?? []) {
    if (row.child_id) ids.add(row.child_id);
  }
  return [...ids];
}

async function resolveOneResetTarget(
  admin: AdminClient,
  input: { email?: string; username: string },
): Promise<ResolvedReset | null> {
  const email = input.email;
  const username = input.username;

  if (username) {
    const profile = await loadProfileByUsername(admin, username);
    if (!profile) return null;

    if (profile.account_role === "child") {
      const target = toChildTarget(profile);
      if (!target) return null;
      const authEmail = await loadAuthEmail(admin, profile.id);
      const parentEmail = await loadChildRecoveryEmail(admin, profile.id);

      if (email) {
        if (authEmail === email || parentEmail === email) {
          return { target, recipientEmail: email };
        }
        return null;
      }

      if (parentEmail) {
        return { target, recipientEmail: parentEmail };
      }
      if (authEmail && !authEmail.endsWith(".invalid")) {
        return { target, recipientEmail: authEmail };
      }
      return null;
    }

    if (profile.account_role === "parent_master") {
      const authEmail = await loadAuthEmail(admin, profile.id);
      if (!authEmail) return null;
      if (email && authEmail !== email) return null;
      return {
        target: {
          userId: profile.id,
          username: profile.username?.trim() || authEmail,
          label: authEmail,
          kind: "parent",
        },
        recipientEmail: authEmail,
      };
    }

    return null;
  }

  if (!email) return null;

  const authUserId = await findAuthUserIdByEmail(email);
  if (!authUserId) return null;
  const profile = await loadProfileById(admin, authUserId);
  if (!profile) return null;

  if (profile.account_role === "parent_master") {
    return {
      target: {
        userId: profile.id,
        username: profile.username?.trim() || email,
        label: email,
        kind: "parent",
      },
      recipientEmail: email,
    };
  }

  if (profile.account_role === "child") {
    const target = toChildTarget(profile);
    return target ? { target, recipientEmail: email } : null;
  }

  return null;
}

type ProfileRow = {
  id: string;
  username: string | null;
  account_role: string | null;
};

async function loadProfileById(
  admin: AdminClient,
  userId: string,
): Promise<ProfileRow | null> {
  const { data } = await admin
    .from("profiles")
    .select("id, username, account_role")
    .eq("id", userId)
    .maybeSingle();
  if (!data?.id) return null;
  return data;
}

async function loadAuthEmail(
  admin: AdminClient,
  userId: string,
): Promise<string | null> {
  const { data, error } = await admin.auth.admin.getUserById(userId);
  const email = data.user?.email?.trim().toLowerCase();
  if (error || !email) return null;
  return email;
}

async function loadChildRecoveryEmail(
  admin: AdminClient,
  childId: string,
): Promise<string | null> {
  const { data: consent } = await admin
    .from("consent_requests")
    .select("parent_email")
    .eq("child_id", childId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const fromConsent = normalizeEmailAddress(
    typeof consent?.parent_email === "string" ? consent.parent_email : "",
  );
  if (fromConsent) return fromConsent;

  const { data: link } = await admin
    .from("parent_child")
    .select("parent_id")
    .eq("child_id", childId)
    .limit(1)
    .maybeSingle();
  if (!link?.parent_id) return null;
  return loadAuthEmail(admin, link.parent_id);
}

function toChildTarget(profile: ProfileRow): ResetTarget | null {
  const username = profile.username?.trim();
  if (profile.account_role !== "child" || !profile.id || !username) {
    return null;
  }
  return {
    userId: profile.id,
    username,
    label: username,
    kind: "child",
  };
}
