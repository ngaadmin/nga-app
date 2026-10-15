import { SKILLS_REGISTRY } from "@/lib/skills/skills-registry";

/**
 * Learning tracks. The chosen track is also the compliance cohort:
 * Explorer requires parent approval. Do not store a birth year.
 *
 * Explorers 10-12 · Pathfinders 13-15 · Mavericks 16+
 */
export type MasteryCohort = "explorer" | "pathfinder" | "maverick";

export function parseMasteryCohort(value: unknown): MasteryCohort | null {
  if (value === "explorer" || value === "pathfinder" || value === "maverick") {
    return value;
  }
  return null;
}

/**
 * Account lifecycle status on the local session/profile.
 * - GUEST: personalization complete, not yet registered
 * - PENDING_CONSENT: Explorer registered, awaiting verifiable parental approval
 * - ACTIVE: fully usable registered account
 */
export type AccountLifecycleStatus = "GUEST" | "PENDING_CONSENT" | "ACTIVE";

/** Statuses assigned at registered signup (never GUEST). */
export type RegisteredAccountStatus = Exclude<AccountLifecycleStatus, "GUEST">;

export type CohortAgeBounds = {
  id: MasteryCohort;
  label: string;
  minAge: number;
  /** Inclusive max age; `null` means open-ended (16+). */
  maxAge: number | null;
};

export type CohortSignupRequirements = {
  /** Learner may supply their own email at signup. */
  requiresLearnerEmail: boolean;
  /**
   * Login password required at signup (min 6 characters).
   * True for Explorer, Pathfinder, and Maverick.
   */
  requiresPassword: boolean;
  /**
   * @deprecated Explorers use passwords now. Always false for current cohorts.
   */
  requiresPasscode: boolean;
  /** Parent/guardian email must be collected and linked. */
  requiresParentEmail: boolean;
  /** Verifiable parental approval before the account becomes ACTIVE. */
  requiresParentApproval: boolean;
  defaultAccountStatus: RegisteredAccountStatus;
  /**
   * Parent Portal, parent email linkage, and parent PIN remain required.
   * Driven by the learning track.
   */
  requiresParentPortal: boolean;
};

export type CohortPropertyMatrixEntry = CohortAgeBounds &
  CohortSignupRequirements;

export const MASTERY_COHORT = {
  explorer: {
    id: "explorer",
    label: "Explorer",
    minAge: 10,
    maxAge: 12,
    requiresLearnerEmail: false,
    requiresPassword: true,
    requiresPasscode: false,
    requiresParentEmail: true,
    requiresParentApproval: true,
    defaultAccountStatus: "PENDING_CONSENT",
    requiresParentPortal: true,
  },
  pathfinder: {
    id: "pathfinder",
    label: "Pathfinder",
    minAge: 13,
    maxAge: 15,
    requiresLearnerEmail: true,
    requiresPassword: true,
    requiresPasscode: false,
    requiresParentEmail: true,
    requiresParentApproval: false,
    defaultAccountStatus: "ACTIVE",
    requiresParentPortal: true,
  },
  maverick: {
    id: "maverick",
    label: "Maverick",
    minAge: 16,
    maxAge: null,
    requiresLearnerEmail: true,
    requiresPassword: true,
    requiresPasscode: false,
    requiresParentEmail: false,
    requiresParentApproval: false,
    defaultAccountStatus: "ACTIVE",
    requiresParentPortal: false,
  },
} as const satisfies Record<MasteryCohort, CohortPropertyMatrixEntry>;

/** @deprecated Prefer `MASTERY_COHORT` / `COHORT_PROPERTY_MATRIX` - same source. */
export const COHORT_PROPERTY_MATRIX = MASTERY_COHORT;

export const UNIVERSAL_MASTERY_SKILLS_COUNT = SKILLS_REGISTRY.filter(
  (skill) => !skill.isAdvancedCohortOnly,
).length;
export const MAVERICK_MASTERY_SKILLS_COUNT = SKILLS_REGISTRY.length;

/**
 * Conservative December 31st age rule.
 * Age = CurrentYear − BirthYear − 1 for the entire calendar year so learners
 * do not age out of parental protections before year-end.
 */
export function getConservativeAgeFromBirthYear(
  birthYear: number,
  referenceYear = new Date().getFullYear(),
): number {
  return referenceYear - birthYear - 1;
}

export function getCohortPropertyMatrix(
  cohort: MasteryCohort,
): CohortPropertyMatrixEntry {
  return MASTERY_COHORT[cohort];
}

export function getMasteryCohortFromAge(age: number): MasteryCohort {
  if (age <= 12) return "explorer";
  if (age <= 15) return "pathfinder";
  return "maverick";
}

/**
 * Map a leftover birth year from an old local session or consent token.
 * New accounts do not store a year.
 */
export function getMasteryCohortFromBirthYear(
  birthYear: number,
  referenceYear = new Date().getFullYear(),
): MasteryCohort {
  return getMasteryCohortFromAge(
    getConservativeAgeFromBirthYear(birthYear, referenceYear),
  );
}

export function getSignupRequirementsForCohort(
  cohort: MasteryCohort,
): CohortSignupRequirements {
  const matrix = MASTERY_COHORT[cohort];
  return {
    requiresLearnerEmail: matrix.requiresLearnerEmail,
    requiresPassword: matrix.requiresPassword,
    requiresPasscode: matrix.requiresPasscode,
    requiresParentEmail: matrix.requiresParentEmail,
    requiresParentApproval: matrix.requiresParentApproval,
    defaultAccountStatus: matrix.defaultAccountStatus,
    requiresParentPortal: matrix.requiresParentPortal,
  };
}

/**
 * Verifiable parental approval required (Explorers 10-12).
 */
export function requiresParentConsent(cohort: MasteryCohort): boolean {
  return MASTERY_COHORT[cohort].requiresParentApproval;
}

/**
 * Learning track. A saved track wins. `birthYear` is only for old local
 * sessions and legacy consent tokens, and is not stored on new accounts.
 */
export function resolveCurriculumCohort(input: {
  curriculumCohort?: MasteryCohort | null;
  birthYear?: number | null;
  referenceYear?: number;
}): MasteryCohort {
  if (
    input.curriculumCohort === "explorer" ||
    input.curriculumCohort === "pathfinder" ||
    input.curriculumCohort === "maverick"
  ) {
    return input.curriculumCohort;
  }
  if (typeof input.birthYear === "number" && Number.isInteger(input.birthYear)) {
    return getMasteryCohortFromBirthYear(
      input.birthYear,
      input.referenceYear ?? new Date().getFullYear(),
    );
  }
  return "explorer";
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

/** Highest Academy module (1-6) visible for a cohort's skill track. */
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

/** Skills 13-18 unlock for Mavericks (16+) only. */
export function canAccessAdvancedSkills(cohort: MasteryCohort): boolean {
  return cohort === "maverick";
}

/** Skills 13-15 unlock for Pathfinders and Mavericks. */
export function canAccessPathfinderGrowthSkills(cohort: MasteryCohort): boolean {
  return cohort === "pathfinder" || cohort === "maverick";
}

export function totalSkillsToMasterForMasteryCohort(
  cohort: MasteryCohort,
): number {
  return maxSkillNumberForMasteryCohort(cohort);
}

export function masteryCohortLabel(cohort: MasteryCohort): string {
  return MASTERY_COHORT[cohort].label;
}

/** Age band for UI. Always ASCII hyphen (`10-12`), never an en- or em-dash. */
export function masteryCohortAgeRangeLabel(cohort: MasteryCohort): string {
  const { minAge, maxAge } = MASTERY_COHORT[cohort];
  if (maxAge == null) return `${minAge}+`;
  return `${minAge}-${maxAge}`;
}

/** Youngest-first name plus age, e.g. `Explorer 10-12`. */
export function masteryCohortNameAndAgeLabel(cohort: MasteryCohort): string {
  return `${masteryCohortLabel(cohort)} ${masteryCohortAgeRangeLabel(cohort)}`;
}

/** Youngest to oldest. Every three-cohort list in the product must use this order. */
export const MASTERY_COHORT_ORDER: readonly MasteryCohort[] = [
  "explorer",
  "pathfinder",
  "maverick",
];
