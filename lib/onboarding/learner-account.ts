"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { EMAIL_PATTERN } from "@/lib/validation/email";

export type LearnerAccountSnapshot = {
  userId: string;
  username: string;
  birthYear: number | null;
  accountRole: "child" | "parent_master";
  accountStatus: "pending_consent" | "active";
  consentApprovedAt: string | null;
  parentEmail: string | null;
  learnerEmail: string | null;
};

export type LearnerConsentStatus = {
  userId: string;
  username: string;
  accountStatus: "pending_consent" | "active";
  consentApprovedAt: string | null;
};

const GENERIC_SIGN_IN_ERROR =
  "Those details don't match a saved profile. Try again, or jump back in with the free app.";

/**
 * Profile for the signed-in Supabase user, including the latest guardian email
 * from consent_requests when the row itself does not store it.
 */
export async function lookupCurrentLearnerAccount(): Promise<LearnerAccountSnapshot | null> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user?.id) return null;

  return loadLearnerAccountById(user.id, user.email ?? null);
}

/**
 * Consent lifecycle for a username. Used by the child's device after signup
 * when a local session already knows who they are.
 */
export async function lookupLearnerConsentStatus(
  username: string,
): Promise<LearnerConsentStatus | null> {
  const trimmed = username.trim();
  if (!trimmed) return null;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select("id, username, account_status, consent_approved_at")
    .eq("username", trimmed)
    .maybeSingle();

  if (error || !data?.id || !data.username) return null;
  if (
    data.account_status !== "pending_consent" &&
    data.account_status !== "active"
  ) {
    return null;
  }

  return {
    userId: data.id,
    username: data.username,
    accountStatus: data.account_status,
    consentApprovedAt: data.consent_approved_at ?? null,
  };
}

/**
 * Sign in with username or email + password against Supabase Auth.
 * Explorers use a placeholder inbox, so username is resolved to that address.
 */
export async function signInSupabaseLearner(input: {
  identifier: string;
  password: string;
}): Promise<
  | { success: true; account: LearnerAccountSnapshot }
  | { success: false; error: string }
> {
  const identifier = input.identifier.trim();
  const password = input.password;
  if (!identifier || password.length < 6) {
    return { success: false, error: GENERIC_SIGN_IN_ERROR };
  }

  let authEmail: string | null = null;
  let userId: string | null = null;

  if (EMAIL_PATTERN.test(identifier.toLowerCase())) {
    authEmail = identifier.toLowerCase();
  } else {
    const resolved = await resolveAuthEmailByUsername(identifier);
    if (!resolved) {
      return { success: false, error: GENERIC_SIGN_IN_ERROR };
    }
    authEmail = resolved.email;
    userId = resolved.userId;
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: authEmail,
    password,
  });

  if (error || !data.user) {
    return { success: false, error: GENERIC_SIGN_IN_ERROR };
  }

  const account = await loadLearnerAccountById(
    userId ?? data.user.id,
    data.user.email ?? authEmail,
  );
  if (!account) {
    return { success: false, error: GENERIC_SIGN_IN_ERROR };
  }

  return { success: true, account };
}

async function resolveAuthEmailByUsername(
  username: string,
): Promise<{ userId: string; email: string } | null> {
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("id")
    .eq("username", username.trim())
    .maybeSingle();

  if (!profile?.id) return null;

  const { data, error } = await admin.auth.admin.getUserById(profile.id);
  const email = data.user?.email?.trim();
  if (error || !email) return null;
  return { userId: profile.id, email };
}

async function loadLearnerAccountById(
  userId: string,
  authEmail: string | null,
): Promise<LearnerAccountSnapshot | null> {
  const admin = createAdminClient();
  const { data: profile, error } = await admin
    .from("profiles")
    .select(
      "id, username, birth_year, account_role, account_status, consent_approved_at",
    )
    .eq("id", userId)
    .maybeSingle();

  if (error || !profile?.id || !profile.username) return null;
  if (
    profile.account_role !== "child" &&
    profile.account_role !== "parent_master"
  ) {
    return null;
  }
  if (
    profile.account_status !== "pending_consent" &&
    profile.account_status !== "active"
  ) {
    return null;
  }

  const parentEmail = await loadLatestParentEmail(admin, userId);
  const learnerEmail =
    profile.account_role === "parent_master"
      ? authEmail
      : isPlaceholderAuthEmail(authEmail)
        ? null
        : authEmail;

  return {
    userId: profile.id,
    username: profile.username,
    birthYear: typeof profile.birth_year === "number" ? profile.birth_year : null,
    accountRole: profile.account_role,
    accountStatus: profile.account_status,
    consentApprovedAt: profile.consent_approved_at ?? null,
    parentEmail,
    learnerEmail,
  };
}

async function loadLatestParentEmail(
  admin: ReturnType<typeof createAdminClient>,
  childId: string,
): Promise<string | null> {
  const { data } = await admin
    .from("consent_requests")
    .select("parent_email")
    .eq("child_id", childId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const email = data?.parent_email?.trim().toLowerCase();
  return email && EMAIL_PATTERN.test(email) ? email : null;
}

function isPlaceholderAuthEmail(email: string | null): boolean {
  return Boolean(email?.toLowerCase().endsWith(".invalid"));
}
