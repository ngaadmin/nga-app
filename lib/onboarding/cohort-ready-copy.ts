import { masteryCohortLabel, type MasteryCohort } from "@/lib/dashboard/mastery-cohort";

/** Copy for the cohort confirmation and the log-in busy state. US spelling. */
export const COHORT_READY_HEADING = "Got it!";
export const COHORT_READY_BODY = "Getting your lessons ready, just a moment…";
export const COHORT_READY_SLOW = "Still working on it…";
export const COHORT_READY_ERROR = "We couldn't get your lessons ready. Try again.";
export const COHORT_READY_RETRY = "Try again";
export const LOGGING_IN_LABEL = "Logging you in…";

export function cohortReadyPickedLine(cohort: MasteryCohort): string {
  return `You picked ${masteryCohortLabel(cohort)}.`;
}
