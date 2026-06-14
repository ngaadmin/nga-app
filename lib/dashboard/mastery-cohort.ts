/** Gamification mastery track - separate from COPPA compliance tiers. */
export type MasteryCohort = "younger" | "advanced";

export const YOUNGER_MASTERY_SKILLS_COUNT = 12;
export const ADVANCED_MASTERY_SKILLS_COUNT = 18;

/** Under 15 = Younger/Intermediate (12 skills). 15+ = Older/Advanced (18 skills). */
export function getMasteryCohortFromAge(age: number): MasteryCohort {
  return age < 15 ? "younger" : "advanced";
}

export function getMasteryCohortFromBirthYear(
  birthYear: number,
  referenceYear = new Date().getFullYear(),
): MasteryCohort {
  const age = referenceYear - birthYear;
  return getMasteryCohortFromAge(age);
}

export function totalSkillsToMasterForMasteryCohort(
  cohort: MasteryCohort,
): number {
  return cohort === "advanced"
    ? ADVANCED_MASTERY_SKILLS_COUNT
    : YOUNGER_MASTERY_SKILLS_COUNT;
}

export function masteryCohortLabel(cohort: MasteryCohort): string {
  return cohort === "advanced" ? "Advanced" : "Younger";
}
