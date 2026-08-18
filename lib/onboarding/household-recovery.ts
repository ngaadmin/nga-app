"use server";

import { consumeRateLimit } from "@/lib/auth/rate-limit";
import {
  signPasswordResetToken,
} from "@/lib/auth/password-reset-token";
import { sendOnboardingEmail } from "@/lib/email/resend-client";
import { getDefaultAppUrl } from "@/lib/email/templates";
import { createAdminClient } from "@/lib/supabase/admin";
import { findAuthUserIdByEmail } from "@/lib/onboarding/parent-master-lookup";
import { normalizeEmailAddress } from "@/lib/validation/email";

export type HouseholdRecoveryResult =
  | { accepted: true; recipientEmail: string }
  | { accepted: false; error: string };

type ResetTarget = {
  userId: string;
  username: string;
  label: string;
  kind: "parent" | "child";
};

/**
 * Email-based household recovery. Always looks like success when the address
 * is valid so the UI never discloses whether an account exists.
 *
 * Does not change any password. Sends one email with a reset link per profile.
 */
export async function requestHouseholdPasswordRecovery(
  email: string,
  options?: { onlyUsername?: string },
): Promise<HouseholdRecoveryResult> {
  const recipientEmail = normalizeEmailAddress(email);
  if (!recipientEmail) {
    return { accepted: false, error: "Enter a valid email address." };
  }

  const limit = consumeRateLimit(
    `household-recovery:${recipientEmail}`,
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
    return { accepted: true, recipientEmail };
  }

  const onlyUsername = options?.onlyUsername?.trim();
  const targets: ResetTarget[] = [];
  const seenIds = new Set<string>();

  async function addTarget(target: ResetTarget | null) {
    if (!target || seenIds.has(target.userId)) return;
    seenIds.add(target.userId);
    targets.push(target);
  }

  if (onlyUsername) {
    await addTarget(
      await loadLinkedChildTarget(admin, onlyUsername, recipientEmail),
    );
  } else {
    const authUserId = await findAuthUserIdByEmail(recipientEmail);
    if (authUserId) {
      const { data: profile } = await admin
        .from("profiles")
        .select("id, username, account_role, birth_year")
        .eq("id", authUserId)
        .maybeSingle();

      if (profile?.account_role === "parent_master") {
        await addTarget({
          userId: profile.id,
          username: profile.username?.trim() || recipientEmail,
          label: recipientEmail,
          kind: "parent",
        });

        const childIds = await listHouseholdChildIds(
          admin,
          profile.id,
          recipientEmail,
        );
        for (const childId of childIds) {
          await addTarget(await loadChildTarget(admin, childId));
        }
      } else if (profile?.account_role === "child" && profile.username) {
        await addTarget({
          userId: profile.id,
          username: profile.username.trim(),
          label: profile.username.trim(),
          kind: "child",
        });
      }
    }

    const childIds = await listChildIdsByParentEmail(admin, recipientEmail);
    for (const childId of childIds) {
      await addTarget(await loadChildTarget(admin, childId));
    }
  }

  if (targets.length === 0) {
    return { accepted: true, recipientEmail };
  }

  const createdAt = new Date().toISOString();
  const resets = targets.map((target) => ({
    label: target.label,
    token: signPasswordResetToken({
      userId: target.userId,
      username: target.username,
      createdAt,
    }),
    kind: target.kind,
  }));

  await sendOnboardingEmail({
    type: "CREDENTIAL_RECOVERY",
    recipientEmail,
    data: { resets },
    appUrl: getDefaultAppUrl(),
  });

  return { accepted: true, recipientEmail };
}

/**
 * Emails learner usernames linked to this parent/household address.
 * Parents log in with email, so this is for child usernames.
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
    return { accepted: true, recipientEmail };
  }

  const linkedUsernames: string[] = [];
  const parentId = await findAuthUserIdByEmail(recipientEmail);
  if (parentId) {
    const childIds = await listHouseholdChildIds(admin, parentId, recipientEmail);
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

  await sendOnboardingEmail({
    type: "USERNAME_RECOVERY",
    recipientEmail,
    data: {
      username: unique[0]!,
      linkedUsernames: unique,
    },
  });

  return { accepted: true, recipientEmail };
}

async function listHouseholdChildIds(
  admin: ReturnType<typeof createAdminClient>,
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
  admin: ReturnType<typeof createAdminClient>,
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

async function loadLinkedChildTarget(
  admin: ReturnType<typeof createAdminClient>,
  username: string,
  parentEmail: string,
): Promise<ResetTarget | null> {
  const { data: child } = await admin
    .from("profiles")
    .select("id, username, account_role, birth_year")
    .eq("username", username)
    .maybeSingle();
  if (!child?.id || child.account_role !== "child" || !child.username?.trim()) {
    return null;
  }

  const parentId = await findAuthUserIdByEmail(parentEmail);
  const linkedIds = parentId
    ? await listHouseholdChildIds(admin, parentId, parentEmail)
    : await listChildIdsByParentEmail(admin, parentEmail);
  if (!linkedIds.includes(child.id)) {
    return null;
  }

  return loadChildTarget(admin, child.id);
}

async function loadChildTarget(
  admin: ReturnType<typeof createAdminClient>,
  childId: string,
): Promise<ResetTarget | null> {
  const { data: child } = await admin
    .from("profiles")
    .select("id, username, account_role, birth_year")
    .eq("id", childId)
    .maybeSingle();
  if (!child?.id || child.account_role !== "child" || !child.username?.trim()) {
    return null;
  }
  const username = child.username.trim();
  return {
    userId: child.id,
    username,
    label: username,
    kind: "child",
  };
}
