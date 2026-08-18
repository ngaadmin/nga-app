import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { EMAIL_PATTERN } from "@/lib/validation/email";
import type { LearnerAccountSnapshot } from "@/lib/onboarding/learner-account";

export const SIGN_IN_MISMATCH_ERROR =
  "Those details don't match. Check your email or username and password.";

export const SIGN_IN_UNAVAILABLE_ERROR =
  "Could not sign in. Try again shortly.";

/**
 * Sign in with username or email + password against Supabase Auth.
 * Explorers use a placeholder inbox, so username is resolved to that address.
 */
export async function signInSupabaseAccount(input: {
  identifier: string;
  password: string;
}): Promise<
  | { success: true; account: LearnerAccountSnapshot }
  | { success: false; error: string }
> {
  const identifier = input.identifier.trim();
  const password = input.password;
  if (!identifier || password.length < 6) {
    return { success: false, error: SIGN_IN_MISMATCH_ERROR };
  }

  let authEmail: string | null = null;
  let userId: string | null = null;

  if (EMAIL_PATTERN.test(identifier.toLowerCase())) {
    authEmail = identifier.toLowerCase();
  } else {
    const resolved = await resolveAuthEmailByUsername(identifier);
    if (!resolved) {
      return { success: false, error: SIGN_IN_MISMATCH_ERROR };
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
    console.error("[sign-in] Supabase Auth rejected sign-in", {
      code: error?.code ?? null,
      message: error?.message ?? "no user",
    });
    return { success: false, error: SIGN_IN_MISMATCH_ERROR };
  }

  const account = await loadLearnerAccountById(
    userId ?? data.user.id,
    data.user.email ?? authEmail,
  );
  if (!account) {
    console.error("[sign-in] Auth succeeded but profile was not found");
    return {
      success: false,
      error: "We could not open your profile. Try again.",
    };
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
    .ilike("username", username.trim())
    .maybeSingle();

  if (!profile?.id) return null;

  const { data, error } = await admin.auth.admin.getUserById(profile.id);
  const email = data.user?.email?.trim();
  if (error || !email) return null;
  return { userId: profile.id, email };
}

export async function loadLearnerAccountById(
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

  if (error || !profile?.id) {
    console.error("[sign-in] Profile lookup failed", {
      message: error?.message ?? "missing row",
    });
    return null;
  }
  if (
    profile.account_role !== "child" &&
    profile.account_role !== "parent_master"
  ) {
    console.error("[sign-in] Profile role rejected", {
      role: profile.account_role,
    });
    return null;
  }
  if (profile.account_role === "child" && !profile.username) {
    console.error("[sign-in] Child profile is missing a username");
    return null;
  }
  if (
    profile.account_status !== "pending_consent" &&
    profile.account_status !== "active"
  ) {
    console.error("[sign-in] Profile status rejected", {
      status: profile.account_status,
    });
    return null;
  }

  const { data: authUser } = await admin.auth.admin.getUserById(userId);
  const mustChangePassword =
    authUser.user?.user_metadata?.mustChangePassword === true;

  const normalizedAuthEmail =
    authEmail && EMAIL_PATTERN.test(authEmail.trim().toLowerCase())
      ? authEmail.trim().toLowerCase()
      : null;
  const parentEmail =
    profile.account_role === "parent_master"
      ? normalizedAuthEmail
      : await loadLatestParentEmail(admin, userId);
  const learnerEmail =
    profile.account_role === "parent_master"
      ? normalizedAuthEmail
      : isPlaceholderAuthEmail(authEmail)
        ? null
        : normalizedAuthEmail;

  const username =
    typeof profile.username === "string" && profile.username.trim()
      ? profile.username.trim()
      : profile.account_role === "parent_master"
        ? `p${userId.replace(/-/g, "").slice(0, 19)}`
        : "";
  if (!username) return null;

  return {
    userId: profile.id,
    username,
    birthYear: parseBirthYear(profile.birth_year),
    accountRole: profile.account_role,
    accountStatus: profile.account_status,
    consentApprovedAt: profile.consent_approved_at ?? null,
    parentEmail,
    learnerEmail,
    mustChangePassword,
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

function parseBirthYear(value: unknown): number | null {
  const year =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim()
        ? Number(value)
        : NaN;
  return Number.isInteger(year) ? year : null;
}
