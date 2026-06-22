import { SKILLS_REGISTRY } from "@/lib/skills/skills-registry";

/** Age-based mastery track — separate from COPPA compliance tiers (Explorer/Titan). */
export type MasteryCohort = "explorer" | "pathfinder" | "maverick";

export const MASTERY_COHORT = {
  explorer: {
    id: "explorer",
    label: "Explorer",
    minAge: 10,
    maxAge: 12,
  },
  pathfinder: {
    id: "pathfinder",
    label: "Pathfinder",
    minAge: 13,
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

/** Skills 13–18 (`is_advanced_cohort_only`) unlock for Mavericks (ages 16–18) only. */
export function canAccessAdvancedSkills(cohort: MasteryCohort): boolean {
  return cohort === "maverick";
}

export function getMasteryCohortFromAge(age: number): MasteryCohort {
  if (age <= 12) return "explorer";
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
  return canAccessAdvancedSkills(cohort)
    ? MAVERICK_MASTERY_SKILLS_COUNT
    : UNIVERSAL_MASTERY_SKILLS_COUNT;
}

export function masteryCohortLabel(cohort: MasteryCohort): string {
  return MASTERY_COHORT[cohort].label;
}
