import { SKILLS_REGISTRY } from "@/lib/skills/skills-registry";

/**
 * Learning / mastery age bands (curriculum tracks).
 * Parental oversight and signup gates are evaluated from legal birth-year age
 * via the conservative Dec 31 rule - never from a curriculum override alone.
 *
 * Explorers 10-12 · Pathfinders 13-15 · Mavericks 16+
 */
export type MasteryCohort = "explorer" | "pathfinder" | "maverick";

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
   * @deprecated Explorers use passwords now. Always false for current cohorts;
   * kept so older callers of {@link requiresPasscodeForBirthYear} keep compiling.
   */
  requiresPasscode: boolean;
  /** Parent/guardian email must be collected and linked. */
  requiresParentEmail: boolean;
  /** Verifiable parental approval before the account becomes ACTIVE. */
  requiresParentApproval: boolean;
  defaultAccountStatus: RegisteredAccountStatus;
  /**
   * Parent Portal, parent email linkage, and parent PIN remain required.
   * Driven by legal birth-year age - curriculum overrides must not clear this.
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
 * Legal / compliance cohort from birth year (conservative age).
 * Curriculum track overrides must never replace this for parental gates.
 */
export function getMasteryCohortFromBirthYear(
  birthYear: number,
  referenceYear = new Date().getFullYear(),
): MasteryCohort {
  return getMasteryCohortFromAge(
    getConservativeAgeFromBirthYear(birthYear, referenceYear),
  );
}

/** Alias - legal compliance tier is always derived from birth year. */
export const getComplianceTierFromBirthYear = getMasteryCohortFromBirthYear;

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

export function getSignupRequirementsForBirthYear(
  birthYear: number,
  referenceYear = new Date().getFullYear(),
): CohortSignupRequirements {
  return getSignupRequirementsForCohort(
    getComplianceTierFromBirthYear(birthYear, referenceYear),
  );
}

/**
 * Verifiable parental approval required (Explorers 10-12).
 * Accepts a cohort id for call-site compatibility; parental gates that can see
 * a curriculum override should prefer {@link requiresParentConsentForBirthYear}.
 */
export function requiresParentConsent(cohort: MasteryCohort): boolean {
  return MASTERY_COHORT[cohort].requiresParentApproval;
}

/** Legal age-gate: parental approval from birth year, ignoring curriculum overrides. */
export function requiresParentConsentForBirthYear(
  birthYear: number,
  referenceYear = new Date().getFullYear(),
): boolean {
  return getSignupRequirementsForBirthYear(birthYear, referenceYear)
    .requiresParentApproval;
}

export function requiresParentEmailForBirthYear(
  birthYear: number,
  referenceYear = new Date().getFullYear(),
): boolean {
  return getSignupRequirementsForBirthYear(birthYear, referenceYear)
    .requiresParentEmail;
}

/**
 * Parent Portal / parent PIN / parent email linkage - legal birth-year only.
 * A parent moving curriculum from Explorer → Pathfinder must not clear this.
 */
export function requiresParentPortalForBirthYear(
  birthYear: number,
  referenceYear = new Date().getFullYear(),
): boolean {
  return getSignupRequirementsForBirthYear(birthYear, referenceYear)
    .requiresParentPortal;
}

export function defaultAccountStatusForBirthYear(
  birthYear: number,
  referenceYear = new Date().getFullYear(),
): RegisteredAccountStatus {
  return getSignupRequirementsForBirthYear(birthYear, referenceYear)
    .defaultAccountStatus;
}

/**
 * @deprecated Explorers use passwords. Always false for current cohort matrix.
 */
export function requiresPasscodeForBirthYear(
  birthYear: number,
  referenceYear = new Date().getFullYear(),
): boolean {
  return getSignupRequirementsForBirthYear(birthYear, referenceYear)
    .requiresPasscode;
}

/** True when cohort signup requires a login password (min 6 characters). */
export function requiresPasswordForBirthYear(
  birthYear: number,
  referenceYear = new Date().getFullYear(),
): boolean {
  return getSignupRequirementsForBirthYear(birthYear, referenceYear)
    .requiresPassword;
}

/**
 * Resolve learning-content cohort: optional curriculum override, else legal tier.
 * Never use the override for parental consent / Parent Portal decisions.
 */
export function resolveCurriculumCohort(input: {
  birthYear: number;
  curriculumCohort?: MasteryCohort | null;
  referenceYear?: number;
}): MasteryCohort {
  if (
    input.curriculumCohort === "explorer" ||
    input.curriculumCohort === "pathfinder" ||
    input.curriculumCohort === "maverick"
  ) {
    return input.curriculumCohort;
  }
  return getComplianceTierFromBirthYear(
    input.birthYear,
    input.referenceYear ?? new Date().getFullYear(),
  );
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

export function masteryCohortAgeRangeLabel(cohort: MasteryCohort): string {
  const { minAge, maxAge } = MASTERY_COHORT[cohort];
  if (maxAge == null) return `${minAge}+`;
  return `${minAge}-${maxAge}`;
}

export const MASTERY_COHORT_ORDER: readonly MasteryCohort[] = [
  "explorer",
  "pathfinder",
  "maverick",
];
