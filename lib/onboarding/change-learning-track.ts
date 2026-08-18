import {
  getComplianceTierFromBirthYear,
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
  saveUserSession,
  updateUserCurriculumCohort,
  type UserSession,
} from "@/lib/onboarding/guest-session";
import {
  findRegisteredAccountByUsername,
  upsertRegisteredAccount,
} from "@/lib/onboarding/registered-accounts";
import { dispatchUserSessionUpdated } from "@/lib/onboarding/user-session-events";

export type ChangeLearningTrackResult =
  | { ok: true; cohortChanged: boolean; trackLabel: string; ageRange: string }
  | { ok: false; reason: "invalid" | "unchanged" | "no_session" };

/**
 * Parent Settings curriculum override.
 *
 * `birthYear` is interpreted as a picker value that maps to a target learning
 * track (via the conservative age → cohort matrix). Legal `session.birthYear`,
 * compliance `ageTier`, parent email, and Parent Portal requirements are
 * left untouched - only `curriculumCohort` (content/difficulty) changes.
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

/** Parent master accounts always display as Maverick. */
export function displayAccountLearningTrack(account: UserSession): MasteryCohort {
  if (account.accountRole === "parent_master") return "maverick";
  return getSessionCurriculumCohort(account);
}

/**
 * Update one household account's learning track.
 * Resets Academy progress only when that account is the signed-in session.
 */
export function changeAccountLearningTrack(
  username: string,
  nextCohort: MasteryCohort,
): ChangeLearningTrackResult {
  const session = readUserSession();
  const targetKey = username.trim().toLowerCase();
  if (!targetKey) return { ok: false, reason: "no_session" };

  const isActive =
    Boolean(session) &&
    session!.username.trim().toLowerCase() === targetKey;
  const account =
    findRegisteredAccountByUsername(username) ?? (isActive ? session : null);
  if (!account) return { ok: false, reason: "no_session" };
  if (account.accountRole === "parent_master") {
    return { ok: false, reason: "invalid" };
  }

  const previousCohort = getSessionCurriculumCohort(account);
  if (previousCohort === nextCohort) {
    return { ok: false, reason: "unchanged" };
  }

  const updated: UserSession = {
    ...account,
    curriculumCohort: nextCohort,
    ageTier: getComplianceTierFromBirthYear(account.birthYear),
  };

  if (updated.accessMode === "registered") {
    upsertRegisteredAccount(updated);
  }

  if (isActive && session) {
    saveUserSession({
      ...session,
      curriculumCohort: nextCohort,
      ageTier: getComplianceTierFromBirthYear(session.birthYear),
    });
    resetLearningProgress();
  } else {
    dispatchUserSessionUpdated();
  }

  return {
    ok: true,
    cohortChanged: true,
    trackLabel: masteryCohortLabel(nextCohort),
    ageRange: masteryCohortAgeRangeLabel(nextCohort),
  };
}
