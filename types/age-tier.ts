/**
 * Youth age bands for legal compliance (birth-year age gate) and curriculum tracks.
 * Explorers (10-12) · Pathfinders (13-15) · Mavericks (16+)
 *
 * Parental oversight must always use birth-year helpers (conservative Dec 31 age).
 * Curriculum cohort overrides must not weaken Parent Portal / consent rules.
 */
export {
  MASTERY_COHORT as AGE_TIER,
  COHORT_PROPERTY_MATRIX,
  type MasteryCohort as AgeTierId,
  type AccountLifecycleStatus,
  type CohortSignupRequirements,
  getConservativeAgeFromBirthYear,
  getMasteryCohortFromAge,
  getMasteryCohortFromBirthYear,
  getComplianceTierFromBirthYear,
  getSignupRequirementsForBirthYear,
  getSignupRequirementsForCohort,
  masteryCohortLabel,
  requiresParentConsent,
  requiresParentConsentForBirthYear,
  requiresParentEmailForBirthYear,
  requiresParentPortalForBirthYear,
  defaultAccountStatusForBirthYear,
  resolveCurriculumCohort,
} from "@/lib/dashboard/mastery-cohort";

export type AgeTier = {
  id: import("@/lib/dashboard/mastery-cohort").MasteryCohort;
  label: string;
  minAge: number;
  maxAge: number | null;
};
