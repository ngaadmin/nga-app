"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  getMasteryCohortFromBirthYear,
  getSignupRequirementsForBirthYear,
  type MasteryCohort,
  type RegisteredAccountStatus,
} from "@/lib/dashboard/mastery-cohort";
import { isEligibleBirthYear } from "@/lib/onboarding/birth-years";
import { issueGuardianSignupEmail } from "@/lib/onboarding/issue-guardian-signup-email";
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
  birthYear: number;
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
 * Explorer / Pathfinder then write `consent_requests` and send the existing
 * parent emails. Does not write `parent_child` yet.
 */
export async function createSupabaseAccount(
  input: CreateSupabaseAccountInput,
): Promise<CreateSupabaseAccountResult> {
  const parsed = parseSignupInput(input);
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
    requirements.defaultAccountStatus,
  );
  const accountRole = "child" as const;

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

  // Explorers: placeholder email, auto-confirm (no mail to a fake address).
  // Pathfinder / Maverick: real email via signUp so Auth can send confirmation.
  const created =
    cohort === "explorer"
      ? await createExplorerAuthUser(admin, password)
      : await createLearnerAuthUser(learnerEmail!, password);

  if (!created.ok) {
    return { success: false, error: created.error };
  }

  const { error: profileError } = await admin
    .from("profiles")
    .update({
      username,
      birth_year: birthYear,
      account_role: accountRole,
      account_status: accountStatus,
      marketing_opt_in: marketingOptIn,
    })
    .eq("id", created.userId);

  if (profileError) {
    await admin.auth.admin.deleteUser(created.userId);
    return {
      success: false,
      error: profileError.message || "Could not save the profile. Please try again.",
    };
  }

  // Explorer VPC + Pathfinder parent-claim emails. Maverick skips this.
  if (parentEmail && (cohort === "explorer" || cohort === "pathfinder")) {
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

function parseSignupInput(
  input: CreateSupabaseAccountInput,
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

  if (!isEligibleBirthYear(input.birthYear)) {
    return { ok: false, error: "Please choose a valid birth year." };
  }

  const password = input.password;
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { ok: false, error: "Use at least 6 characters for your password." };
  }

  const requirements = getSignupRequirementsForBirthYear(input.birthYear);
  const learnerEmail = requirements.requiresLearnerEmail
    ? (normalizeEmailAddress(input.learnerEmail) ?? null)
    : null;
  const parentEmail = requirements.requiresParentEmail
    ? (normalizeEmailAddress(input.parentEmail) ?? null)
    : null;

  if (requirements.requiresLearnerEmail && !learnerEmail) {
    return { ok: false, error: "Please enter a valid email address." };
  }

  if (requirements.requiresParentEmail && !parentEmail) {
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
      birthYear: input.birthYear,
      password,
      learnerEmail,
      parentEmail,
      marketingOptIn: requirements.requiresLearnerEmail
        ? Boolean(input.marketingOptIn)
        : false,
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

function buildExplorerPlaceholderEmail(): string {
  return `explorer+${crypto.randomUUID()}@${EXPLORER_AUTH_EMAIL_DOMAIN}`;
}

async function createExplorerAuthUser(
  admin: ReturnType<typeof createAdminClient>,
  password: string,
): Promise<
  { ok: true; userId: string; authEmail: string } | { ok: false; error: string }
> {
  const authEmail = buildExplorerPlaceholderEmail();
  const { data, error } = await admin.auth.admin.createUser({
    email: authEmail,
    password,
    email_confirm: true,
  });

  if (error || !data.user) {
    return {
      ok: false,
      error: error?.message || "Could not create the Explorer account.",
    };
  }

  return { ok: true, userId: data.user.id, authEmail };
}

/** Pathfinder / Maverick — uses the cookie server client so Auth can email them. */
async function createLearnerAuthUser(
  learnerEmail: string,
  password: string,
): Promise<
  { ok: true; userId: string; authEmail: string } | { ok: false; error: string }
> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: learnerEmail,
    password,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  // Existing-email anti-enumeration: user row with no identities.
  if (!data.user || data.user.identities?.length === 0) {
    return {
      ok: false,
      error: "Could not create this account. Try signing in, or use another email.",
    };
  }

  return { ok: true, userId: data.user.id, authEmail: learnerEmail };
}
