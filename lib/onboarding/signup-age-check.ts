import {
  getConservativeAgeFromBirthYear,
  getMasteryCohortFromAge,
  masteryCohortLabel,
  type MasteryCohort,
  type RegisteredAccountStatus,
} from "@/lib/dashboard/mastery-cohort";

/**
 * Learner self sign-up only. Guest play, teachers, class seats, and
 * parent-added profiles do not ask for a birth year.
 */
export type AgeCheckAudience = "learner" | "guest" | "teacher" | "class-seat";

/**
 * Conservative age at or above this value skips parent approval.
 * Younger than this requires the existing parent-approval flow.
 * One cutoff for the whole app.
 */
export const PARENT_APPROVAL_MIN_AGE = 16;

export const BIRTH_YEAR_PROMPT = "What year were you born?";
export const BIRTH_YEAR_HELPER =
  "We only use this to check if a parent or guardian needs to approve.";

/**
 * The stored flag is only under 16 versus 16 and over, so it cannot hide a
 * marketing box for 16-17 while showing it for 18+. The teen box stays off
 * for every learner. Newsletters stay on the parent account.
 */
export const LEARNER_MARKETING_CHECKBOX_VISIBLE = false;

export function collectsBirthYear(audience: AgeCheckAudience): boolean {
  return audience === "learner";
}

export function ageTrackFitMessage(track: MasteryCohort): string {
  return `Based on your age, ${masteryCohortLabel(track)} is the right fit`;
}

export type LearnerAgeDecision = {
  age: number;
  /** Age-band suggestion. Never overwrite the track the learner picked. */
  suggestedCohort: MasteryCohort;
  /** True when conservative age is under PARENT_APPROVAL_MIN_AGE. */
  parentApprovalRequired: boolean;
};

/**
 * Age = current year − birth year − 1. The year itself is not returned for storage.
 */
export function decideLearnerAge(
  birthYear: number,
  referenceYear = new Date().getFullYear(),
): LearnerAgeDecision | null {
  if (!Number.isInteger(birthYear) || birthYear < 1900 || birthYear > referenceYear) {
    return null;
  }
  const age = getConservativeAgeFromBirthYear(birthYear, referenceYear);
  return {
    age,
    suggestedCohort: getMasteryCohortFromAge(age),
    parentApprovalRequired: age < PARENT_APPROVAL_MIN_AGE,
  };
}

/** Profile columns for the age check. The birth year and the age are not keys. */
export function learnerAgeColumns(input: {
  birthYear: number;
  checkedAt: string;
  referenceYear?: number;
}): {
  parent_approval_required: boolean;
  age_checked_at: string;
} | null {
  const decision = decideLearnerAge(input.birthYear, input.referenceYear);
  if (!decision) return null;
  return {
    parent_approval_required: decision.parentApprovalRequired,
    age_checked_at: input.checkedAt,
  };
}

/** Profile write for a signup audience. Birth year is never a key. */
export function profileColumnsForAudience(input: {
  audience: AgeCheckAudience;
  birthYear: number;
  checkedAt: string;
  referenceYear?: number;
}): Record<string, unknown> | null {
  if (!collectsBirthYear(input.audience)) return null;
  return learnerAgeColumns({
    birthYear: input.birthYear,
    checkedAt: input.checkedAt,
    referenceYear: input.referenceYear,
  });
}

export function payloadStoresBirthYear(payload: unknown): boolean {
  const serialized = JSON.stringify(payload);
  return /birth[_ ]?year/i.test(serialized);
}

/**
 * Learner self sign-up never stores a marketing opt-in. The request flag is
 * ignored so an under-18 cannot turn it on, including 16-17 where the stored
 * age flag is only "16 and over".
 */
export function learnerMarketingOptIn(requested?: boolean): false {
  if (requested === true) return false;
  return false;
}

export type LearnerSignupPlan = {
  cohort: MasteryCohort;
  parentApprovalRequired: boolean;
  accountStatus: RegisteredAccountStatus;
  requiresLearnerEmail: boolean;
  requiresParentEmail: boolean;
  /** VPC approval email. Never a parent-dashboard invite. */
  sendParentConsentEmail: boolean;
  /** Welcome mail. Never sent to a 16+ Explorer. Their address is for resets only. */
  sendLearnerWelcomeEmail: boolean;
  marketingOptIn: false;
};

/**
 * Age flag decides consent. The picked track is kept.
 * Under 16: pending parent approval, whatever track they picked.
 * 16 and over: active, no parent email, no parent invite.
 * 16+ Explorer must give an email. It is stored for password resets and
 * nothing is sent at sign-up.
 */
/**
 * Once this sign-up session has taken the under-16 path, a later birth year
 * cannot switch it onto the 16+ path.
 */
export function signupRequiresParentApproval(input: {
  birthYear: number | null;
  under16PathReached: boolean;
  referenceYear?: number;
}): boolean {
  if (input.under16PathReached) return true;
  if (input.birthYear == null) return false;
  return (
    decideLearnerAge(input.birthYear, input.referenceYear)?.parentApprovalRequired ===
    true
  );
}

export function planLearnerSignup(input: {
  pickedCohort: MasteryCohort;
  birthYear: number;
  referenceYear?: number;
  requestedMarketingOptIn?: boolean;
  /** Sticky for this sign-up session after the under-16 path was reached. */
  under16PathReached?: boolean;
}): LearnerSignupPlan | null {
  const decision = decideLearnerAge(input.birthYear, input.referenceYear);
  if (!decision) return null;
  const parentApprovalRequired =
    decision.parentApprovalRequired || input.under16PathReached === true;
  const sixteenPlusExplorer =
    input.pickedCohort === "explorer" && !parentApprovalRequired;
  return {
    cohort: input.pickedCohort,
    parentApprovalRequired,
    accountStatus: parentApprovalRequired ? "PENDING_CONSENT" : "ACTIVE",
    requiresLearnerEmail: input.pickedCohort !== "explorer" || sixteenPlusExplorer,
    requiresParentEmail: parentApprovalRequired,
    sendParentConsentEmail: parentApprovalRequired,
    sendLearnerWelcomeEmail:
      !parentApprovalRequired && input.pickedCohort !== "explorer",
    marketingOptIn: learnerMarketingOptIn(input.requestedMarketingOptIn),
  };
}
