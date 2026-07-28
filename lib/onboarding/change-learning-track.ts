import {
  getMasteryCohortFromBirthYear,
  masteryCohortAgeRangeLabel,
  masteryCohortLabel,
} from "@/lib/dashboard/mastery-cohort";
import { resetLearningProgress } from "@/lib/dashboard/learning-progress-reset";
import { isEligibleBirthYear } from "@/lib/onboarding/birth-years";
import {
  readUserSession,
  updateUserBirthYear,
} from "@/lib/onboarding/ghost-session";

export type ChangeLearningTrackResult =
  | { ok: true; cohortChanged: boolean; trackLabel: string; ageRange: string }
  | { ok: false; reason: "invalid" | "unchanged" | "no_session" };

export function changeUserLearningTrack(birthYear: number): ChangeLearningTrackResult {
  const session = readUserSession();
  if (!session) return { ok: false, reason: "no_session" };
  if (!isEligibleBirthYear(birthYear)) return { ok: false, reason: "invalid" };
  if (session.birthYear === birthYear) return { ok: false, reason: "unchanged" };

  const previousCohort = getMasteryCohortFromBirthYear(session.birthYear);
  const nextCohort = getMasteryCohortFromBirthYear(birthYear);
  const cohortChanged = previousCohort !== nextCohort;

  const updated = updateUserBirthYear(birthYear);
  if (!updated) return { ok: false, reason: "invalid" };

  if (cohortChanged) {
    resetLearningProgress();
  }

  return {
    ok: true,
    cohortChanged,
    trackLabel: masteryCohortLabel(nextCohort),
    ageRange: masteryCohortAgeRangeLabel(nextCohort),
  };
}
