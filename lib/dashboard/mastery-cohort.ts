import { SKILLS_REGISTRY } from "@/lib/skills/skills-registry";

/** Unified age band: Explorers (under 14) · Pathfinders (14–15) · Mavericks (16+). */
export type MasteryCohort = "explorer" | "pathfinder" | "maverick";

export const MASTERY_COHORT = {
  explorer: {
    id: "explorer",
    label: "Explorer",
    minAge: 10,
    maxAge: 13,
  },
  pathfinder: {
    id: "pathfinder",
    label: "Pathfinder",
    minAge: 14,
    maxAge: 15,
  },
  maverick: {
    id: "maverick",
    label: "Maverick",
    minAge: 16,
    maxAge: 18,
  },
} as const satisfies Record<
  MasteryCohort,
  { id: MasteryCohort; label: string; minAge: number; maxAge: number }
>;

export const UNIVERSAL_MASTERY_SKILLS_COUNT = SKILLS_REGISTRY.filter(
  (skill) => !skill.isAdvancedCohortOnly,
).length;
export const MAVERICK_MASTERY_SKILLS_COUNT = SKILLS_REGISTRY.length;

/** Explorers under 14 require verifiable parental consent before a saved account. */
export function requiresParentConsent(cohort: MasteryCohort): boolean {
  return cohort === "explorer";
}

export function maxSkillNumberForMasteryCohort(cohort: MasteryCohort): number {
  switch (cohort) {
    case "explorer":
      return 12;
    case "pathfinder":
      return 15;
    case "maverick":
      return 18;
  }
}

/** Highest Academy module (1–6) visible for a cohort's skill track. */
export function maxAcademyModuleForMasteryCohort(
  cohort: MasteryCohort,
): 1 | 2 | 3 | 4 | 5 | 6 {
  switch (cohort) {
    case "explorer":
      return 4;
    case "pathfinder":
      return 5;
    case "maverick":
      return 6;
  }
}

/** Skills 13–18 unlock for Mavericks (ages 16–18) only. */
export function canAccessAdvancedSkills(cohort: MasteryCohort): boolean {
  return cohort === "maverick";
}

/** Skills 13–15 unlock for Pathfinders and Mavericks. */
export function canAccessPathfinderGrowthSkills(cohort: MasteryCohort): boolean {
  return cohort === "pathfinder" || cohort === "maverick";
}

export function getMasteryCohortFromAge(age: number): MasteryCohort {
  if (age < 14) return "explorer";
  if (age <= 15) return "pathfinder";
  return "maverick";
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
  return maxSkillNumberForMasteryCohort(cohort);
}

export function masteryCohortLabel(cohort: MasteryCohort): string {
  return MASTERY_COHORT[cohort].label;
}

export function masteryCohortAgeRangeLabel(cohort: MasteryCohort): string {
  const { minAge, maxAge } = MASTERY_COHORT[cohort];
  return `${minAge}-${maxAge}`;
}

export const MASTERY_COHORT_ORDER: readonly MasteryCohort[] = [
  "explorer",
  "pathfinder",
  "maverick",
];
