"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  getMasteryCohortFromBirthYear,
  getSignupRequirementsForBirthYear,
  type MasteryCohort,
  type RegisteredAccountStatus,
} from "@/lib/dashboard/mastery-cohort";
import {
  isEligibleBirthYear,
  representativeBirthYearForCohort,
} from "@/lib/onboarding/birth-years";
import { issueGuardianSignupEmail } from "@/lib/onboarding/issue-guardian-signup-email";
import { sendOnboardingEmail } from "@/lib/email/resend-client";
import { normalizeEmailAddress } from "@/lib/validation/email";

/** Non-PII Auth email for Explorers (COPPA — no learner inbox). */
const EXPLORER_AUTH_EMAIL_DOMAIN = "users.nextgenachievers.invalid";

const USERNAME_PATTERN = /^[a-zA-Z0-9_-]{2,20}$/;
const MIN_PASSWORD_LENGTH = 6;

/** profiles.account_status values (DB check constraint). */
export type SupabaseAccountStatus = "pending_consent" | "active";

function toSupabaseAccountStatus(
  status: RegisteredAccountStatus,
): SupabaseAccountStatus {
  return status === "PENDING_CONSENT" ? "pending_consent" : "active";
}

export type CreateSupabaseAccountInput = {
  username: string;
  /** Required for independent child signup. Ignored when parent-add sends `cohort`. */
  birthYear?: number;
  /**
   * Learning track. Independent Save Your Progress and parent-add both send
   * this; birth year is derived as a content stand-in. Do not send
   * `parentInitiatedById` from the public signup form.
   */
  cohort?: MasteryCohort;
  password: string;
  /** Required for Pathfinder / Maverick. Ignored for Explorers. */
  learnerEmail?: string | null;
  /**
   * Required for Explorer / Pathfinder by cohort rules.
   * Validated here but not stored yet — consent_requests comes next.
   */
  parentEmail?: string | null;
  /** Forced false for Explorers. */
  marketingOptIn?: boolean;
  /**
   * Signed-in parent master is adding this child. Skip guardian emails,
   * create the child as already approved, and link `parent_child`.
   */
  parentInitiatedById?: string | null;
};

export type CreateSupabaseAccountResult =
  | {
      success: true;
      userId: string;
      username: string;
      cohort: MasteryCohort;
      accountRole: "child";
      accountStatus: SupabaseAccountStatus;
      /** Address stored on auth.users (placeholder for Explorers). */
      authEmail: string;
    }
  | {
      success: false;
      error: string;
    };

/**
 * Creates a learner in Supabase Auth and fills the stub `profiles` row.
 * Standalone Explorer / Pathfinder then write `consent_requests` and send
 * parent emails. Parent-initiated adds skip that and write `parent_child`.
 */
export async function createSupabaseAccount(
  input: CreateSupabaseAccountInput,
): Promise<CreateSupabaseAccountResult> {
  const claimedParentId = input.parentInitiatedById?.trim() || null;
  const parentInitiated = Boolean(claimedParentId);
  const parsed = parseSignupInput(input, parentInitiated);
  if (!parsed.ok) {
    return { success: false, error: parsed.error };
  }

  const {
    username,
    birthYear,
    password,
    learnerEmail,
    parentEmail,
    marketingOptIn,
  } = parsed.value;
  const cohort = getMasteryCohortFromBirthYear(birthYear);
  const requirements = getSignupRequirementsForBirthYear(birthYear);
  const accountStatus = toSupabaseAccountStatus(
    parentInitiated ? "ACTIVE" : requirements.defaultAccountStatus,
  );
  const accountRole = "child" as const;
  const approvedAt = parentInitiated ? new Date().toISOString() : null;

  let admin;
  try {
    admin = createAdminClient();
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Supabase admin client is not configured.",
    };
  }

  if (claimedParentId) {
    const verified = await verifyParentInitiator(admin, claimedParentId);
    if (!verified.ok) {
      return { success: false, error: verified.error };
    }
  }

  let usernameTaken: boolean;
  try {
    usernameTaken = await isUsernameTaken(admin, username);
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Could not check that username. Please try again.",
    };
  }
  if (usernameTaken) {
    return {
      success: false,
      error: "That username is already taken. Try adding a favorite number!",
    };
  }

  // Explorers, and any parent-added child: placeholder email + admin create
  // so we never swap the signed-in parent Auth session.
  const created =
    cohort === "explorer" || parentInitiated
      ? await createPlaceholderAuthUser(
          admin,
          password,
          username,
          cohort,
          parentInitiated ? "linked" : "explorer",
        )
      : await createLearnerAuthUser(
          admin,
          learnerEmail!,
          password,
          username,
          cohort,
        );

  if (!created.ok) {
    return { success: false, error: created.error };
  }

  const profileSaved = await saveLearnerProfile(admin, {
    userId: created.userId,
    username,
    birthYear,
    accountRole,
    accountStatus,
    marketingOptIn,
    consentApprovedAt: approvedAt,
  });
  if (!profileSaved.ok) {
    await admin.auth.admin.deleteUser(created.userId);
    return { success: false, error: profileSaved.error };
  }

  if (claimedParentId) {
    const linked = await linkParentChild(admin, claimedParentId, created.userId);
    if (!linked.ok) {
      await admin.auth.admin.deleteUser(created.userId);
      return { success: false, error: linked.error };
    }
  }

  // Explorer VPC + Pathfinder parent-claim emails. Skip when a parent master
  // already created this child from Settings.
  if (
    !parentInitiated &&
    parentEmail &&
    (cohort === "explorer" || cohort === "pathfinder")
  ) {
    try {
      const emailResult = await issueGuardianSignupEmail({
        childId: created.userId,
        username,
        birthYear,
        parentEmail,
        cohort,
      });

      if (!emailResult.ok && cohort === "explorer") {
        await admin.auth.admin.deleteUser(created.userId);
        return {
          success: false,
          error: emailResult.error,
        };
      }
    } catch (error) {
      if (cohort === "explorer") {
        await admin.auth.admin.deleteUser(created.userId);
        return {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : "We could not send the parent approval email. Please try again.",
        };
      }
    }
  }

  if (
    !parentInitiated &&
    learnerEmail &&
    (cohort === "pathfinder" || cohort === "maverick")
  ) {
    try {
      await sendOnboardingEmail({
        type: cohort === "pathfinder" ? "PATHFINDER_WELCOME" : "MAVERICK_WELCOME",
        recipientEmail: learnerEmail,
        data: { username },
      });
    } catch {
      // Welcome mail must not block account creation.
    }
  }

  if (!parentInitiated) {
    try {
      const supabase = await createClient();
      await supabase.auth.signInWithPassword({
        email: created.authEmail,
        password,
      });
    } catch {
      // Local session still lands; the child can sign in again later.
    }
  }

  return {
    success: true,
    userId: created.userId,
    username,
    cohort,
    accountRole,
    accountStatus,
    authEmail: created.authEmail,
  };
}

type ParsedSignup = {
  username: string;
  birthYear: number;
  password: string;
  learnerEmail: string | null;
  parentEmail: string | null;
  marketingOptIn: boolean;
};

function isMasteryCohort(value: unknown): value is MasteryCohort {
  return value === "explorer" || value === "pathfinder" || value === "maverick";
}

function resolveSignupBirthYear(
  input: CreateSupabaseAccountInput,
  parentInitiated: boolean,
): number | null {
  if (isMasteryCohort(input.cohort)) {
    return representativeBirthYearForCohort(input.cohort);
  }
  if (parentInitiated) return null;
  if (typeof input.birthYear === "number" && isEligibleBirthYear(input.birthYear)) {
    return input.birthYear;
  }
  return null;
}

function parseSignupInput(
  input: CreateSupabaseAccountInput,
  parentInitiated = false,
): { ok: true; value: ParsedSignup } | { ok: false; error: string } {
  const username = input.username.trim();
  if (!username) {
    return { ok: false, error: "Pick a username for your account." };
  }
  if (!USERNAME_PATTERN.test(username)) {
    return {
      ok: false,
      error: "Username must be 2–20 letters, numbers, underscores, or hyphens.",
    };
  }

  const birthYear = resolveSignupBirthYear(input, parentInitiated);
  if (birthYear == null) {
    return {
      ok: false,
      error: "Pick a learning track for this learner.",
    };
  }

  const password = input.password;
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { ok: false, error: "Use at least 6 characters for your password." };
  }

  const requirements = getSignupRequirementsForBirthYear(birthYear);
  const learnerEmail =
    !parentInitiated && requirements.requiresLearnerEmail
      ? (normalizeEmailAddress(input.learnerEmail) ?? null)
      : null;
  const parentEmail =
    !parentInitiated && requirements.requiresParentEmail
      ? (normalizeEmailAddress(input.parentEmail) ?? null)
      : null;

  if (!parentInitiated && requirements.requiresLearnerEmail && !learnerEmail) {
    return { ok: false, error: "Please enter a valid email address." };
  }

  if (!parentInitiated && requirements.requiresParentEmail && !parentEmail) {
    return {
      ok: false,
      error: "Please enter a parent or guardian email address.",
    };
  }

  if (learnerEmail && parentEmail && learnerEmail === parentEmail) {
    return {
      ok: false,
      error:
        "Please enter a parent or guardian's email address that is different from your own.",
    };
  }

  return {
    ok: true,
    value: {
      username,
      birthYear,
      password,
      learnerEmail,
      parentEmail,
      marketingOptIn:
        parentInitiated || !requirements.requiresLearnerEmail
          ? false
          : Boolean(input.marketingOptIn),
    },
  };
}

async function isUsernameTaken(
  admin: ReturnType<typeof createAdminClient>,
  username: string,
): Promise<boolean> {
  const { data, error } = await admin
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return Boolean(data);
}

async function saveLearnerProfile(
  admin: ReturnType<typeof createAdminClient>,
  input: {
    userId: string;
    username: string;
    birthYear: number;
    accountRole: "child";
    accountStatus: SupabaseAccountStatus;
    marketingOptIn: boolean;
    consentApprovedAt?: string | null;
  },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const payload = {
    username: input.username,
    birth_year: input.birthYear,
    account_role: input.accountRole,
    account_status: input.accountStatus,
    marketing_opt_in: input.marketingOptIn,
    ...(input.consentApprovedAt
      ? { consent_approved_at: input.consentApprovedAt }
      : {}),
  };

  const { data: updated, error: updateError } = await admin
    .from("profiles")
    .update(payload)
    .eq("id", input.userId)
    .select("id, username, account_status")
    .maybeSingle();

  if (updateError) {
    return {
      ok: false,
      error: updateError.message || "Could not save the profile. Please try again.",
    };
  }
  if (
    updated?.id === input.userId &&
    typeof updated.username === "string" &&
    updated.username.trim().toLowerCase() === input.username.trim().toLowerCase()
  ) {
    return { ok: true };
  }

  const { data: inserted, error: insertError } = await admin
    .from("profiles")
    .insert({ id: input.userId, ...payload })
    .select("id")
    .maybeSingle();

  if (insertError || !inserted?.id) {
    return {
      ok: false,
      error:
        insertError?.message || "Could not save the profile. Please try again.",
    };
  }
  return { ok: true };
}

function buildPlaceholderAuthEmail(kind: "explorer" | "linked"): string {
  const prefix = kind === "linked" ? "linked" : "explorer";
  return `${prefix}+${crypto.randomUUID()}@${EXPLORER_AUTH_EMAIL_DOMAIN}`;
}

async function verifyParentInitiator(
  admin: ReturnType<typeof createAdminClient>,
  claimedParentId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.id !== claimedParentId) {
    return {
      ok: false,
      error: "Sign in as a parent to add a linked profile.",
    };
  }

  const { data: profile, error } = await admin
    .from("profiles")
    .select("account_role")
    .eq("id", user.id)
    .maybeSingle();

  if (error || profile?.account_role !== "parent_master") {
    return {
      ok: false,
      error: "Only a parent master can add a linked profile this way.",
    };
  }

  return { ok: true };
}

async function createPlaceholderAuthUser(
  admin: ReturnType<typeof createAdminClient>,
  password: string,
  username: string,
  cohort: MasteryCohort,
  kind: "explorer" | "linked",
): Promise<
  { ok: true; userId: string; authEmail: string } | { ok: false; error: string }
> {
  const authEmail = buildPlaceholderAuthEmail(kind);
  const { data, error } = await admin.auth.admin.createUser({
    email: authEmail,
    password,
    email_confirm: true,
    user_metadata: { username, cohort },
  });

  if (error || !data.user) {
    return {
      ok: false,
      error: error?.message || "Could not create the learner account.",
    };
  }

  return { ok: true, userId: data.user.id, authEmail };
}

async function linkParentChild(
  admin: ReturnType<typeof createAdminClient>,
  parentId: string,
  childId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { error } = await admin.from("parent_child").insert({
    parent_id: parentId,
    child_id: childId,
  });

  if (
    error &&
    error.code !== "23505" &&
    !/duplicate key|unique/i.test(error.message ?? "")
  ) {
    return {
      ok: false,
      error: error.message || "Could not link this learner to the parent account.",
    };
  }

  return { ok: true };
}

/** Pathfinder / Maverick — admin create with email already confirmed. */
async function createLearnerAuthUser(
  admin: ReturnType<typeof createAdminClient>,
  learnerEmail: string,
  password: string,
  username: string,
  cohort: MasteryCohort,
): Promise<
  { ok: true; userId: string; authEmail: string } | { ok: false; error: string }
> {
  const { data, error } = await admin.auth.admin.createUser({
    email: learnerEmail,
    password,
    email_confirm: true,
    user_metadata: { username, cohort },
  });

  if (error || !data.user) {
    const message = error?.message ?? "";
    if (/already been registered|already registered|already exists/i.test(message)) {
      return {
        ok: false,
        error:
          "Could not create this account. Try signing in, or use another email.",
      };
    }
    return {
      ok: false,
      error: message || "Could not create this account. Please try again.",
    };
  }

  return { ok: true, userId: data.user.id, authEmail: learnerEmail };
}
