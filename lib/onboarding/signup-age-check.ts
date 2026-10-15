import {
  getConservativeAgeFromBirthYear,
  getMasteryCohortFromAge,
  masteryCohortLabel,
  type MasteryCohort,
} from "@/lib/dashboard/mastery-cohort";

/** Learner sign-up only. Guests, teachers, and class seats skip this. */
export type AgeCheckAudience = "learner" | "guest" | "teacher" | "class-seat";

export const BIRTH_YEAR_PROMPT = "What year were you born?";
export const BIRTH_YEAR_HELPER =
  "We only use this to check if a parent or guardian needs to approve.";

export function collectsBirthYear(audience: AgeCheckAudience): boolean {
  return audience === "learner";
}

export function ageTrackFitMessage(track: MasteryCohort): string {
  return `Based on your age, ${masteryCohortLabel(track)} is the right fit`;
}

export type LearnerAgeDecision = {
  age: number;
  cohort: MasteryCohort;
  /** 13 or under always uses the Explorer parent-approval path. */
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
  const fromAge = getMasteryCohortFromAge(age);
  const parentApprovalRequired = age <= 13;
  return {
    age,
    cohort: parentApprovalRequired ? "explorer" : fromAge,
    parentApprovalRequired,
  };
}

export function learnerAgeColumns(input: {
  birthYear: number;
  checkedAt: string;
  referenceYear?: number;
}): {
  curriculum_cohort: MasteryCohort;
  parent_approval_required: boolean;
  age_checked_at: string;
} | null {
  const decision = decideLearnerAge(input.birthYear, input.referenceYear);
  if (!decision) return null;
  return {
    curriculum_cohort: decision.cohort,
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
