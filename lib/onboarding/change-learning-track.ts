import {
  getMasteryCohortFromBirthYear,
  masteryCohortAgeRangeLabel,
  masteryCohortLabel,
  type MasteryCohort,
} from "@/lib/dashboard/mastery-cohort";
import { resetLearningProgress } from "@/lib/dashboard/learning-progress-reset";
import { isEligibleBirthYear } from "@/lib/onboarding/birth-years";
import {
  getSessionCurriculumCohort,
  readUserSession,
  updateUserCurriculumCohort,
} from "@/lib/onboarding/guest-session";

export type ChangeLearningTrackResult =
  | { ok: true; cohortChanged: boolean; trackLabel: string; ageRange: string }
  | { ok: false; reason: "invalid" | "unchanged" | "no_session" };

/**
 * Parent Settings curriculum override.
 *
 * `birthYear` is interpreted as a picker value that maps to a target learning
 * track (via the conservative age → cohort matrix). Legal `session.birthYear`,
 * compliance `ageTier`, parent email, and Parent Portal requirements are
 * left untouched — only `curriculumCohort` (content/difficulty) changes.
 */
export function changeUserLearningTrack(
  birthYear: number,
): ChangeLearningTrackResult {
  const session = readUserSession();
  if (!session) return { ok: false, reason: "no_session" };
  if (!isEligibleBirthYear(birthYear)) return { ok: false, reason: "invalid" };

  const nextCohort: MasteryCohort = getMasteryCohortFromBirthYear(birthYear);
  const previousCohort = getSessionCurriculumCohort(session);
  if (previousCohort === nextCohort) {
    return { ok: false, reason: "unchanged" };
  }

  const updated = updateUserCurriculumCohort(nextCohort);
  if (!updated) return { ok: false, reason: "invalid" };

  resetLearningProgress();

  return {
    ok: true,
    cohortChanged: true,
    trackLabel: masteryCohortLabel(nextCohort),
    ageRange: masteryCohortAgeRangeLabel(nextCohort),
  };
}
