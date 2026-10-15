/**
 * Youth tracks for curriculum and consent.
 * Explorers (10-13) · Pathfinders (14-16) · Mavericks (17+)
 *
 * The chosen track is the compliance cohort. Explorer requires parent approval.
 * Do not store a birth year.
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
  getSignupRequirementsForCohort,
  masteryCohortLabel,
  requiresParentConsent,
  resolveCurriculumCohort,
} from "@/lib/dashboard/mastery-cohort";

export type AgeTier = {
  id: import("@/lib/dashboard/mastery-cohort").MasteryCohort;
  label: string;
  minAge: number;
  maxAge: number | null;
};
