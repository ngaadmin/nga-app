/**
 * Unified youth age bands — compliance (COPPA/GDPR-K) and mastery cohorts share these tiers.
 * Explorers (under 14) · Pathfinders (14–15) · Mavericks (16+)
 */
export {
  MASTERY_COHORT as AGE_TIER,
  type MasteryCohort as AgeTierId,
  getMasteryCohortFromAge,
  getMasteryCohortFromBirthYear,
  masteryCohortLabel,
  requiresParentConsent,
} from "@/lib/dashboard/mastery-cohort";

export type AgeTier = {
  id: import("@/lib/dashboard/mastery-cohort").MasteryCohort;
  label: string;
  minAge: number;
  maxAge: number;
};
