import {
  getComplianceTierFromBirthYear,
  getMasteryCohortFromBirthYear,
  masteryCohortAgeRangeLabel,
  masteryCohortLabel,
  type MasteryCohort,
} from "@/lib/dashboard/mastery-cohort";
import { resetLearningProgress } from "@/lib/dashboard/learning-progress-reset";
import {
  readCachedAccountProgress,
  writeCachedAccountProgress,
} from "@/lib/dashboard/account-progress-local";
import { ACCOUNT_PROGRESS_SCHEMA_VERSION } from "@/lib/dashboard/account-progress";
import { defaultAcademyMilestones } from "@/lib/dashboard/academy-progress-storage";
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
import { updateLinkedChildLearningTrack } from "@/lib/onboarding/update-child-learning-track";

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

function applyLocalTrackAndProgressReset(
  account: UserSession,
  nextCohort: MasteryCohort,
): void {
  const session = readUserSession();
  const isActive =
    Boolean(session) &&
    session!.username.trim().toLowerCase() ===
      account.username.trim().toLowerCase();

  const updated: UserSession = {
    ...account,
    curriculumCohort: nextCohort,
    ageTier: getComplianceTierFromBirthYear(account.birthYear),
  };

  if (updated.accessMode === "registered") {
    upsertRegisteredAccount(updated);
  }

  const existingCache = readCachedAccountProgress({
    userId: account.supabaseUserId,
    username: account.username,
  });
  const resetPayload = {
    schemaVersion: ACCOUNT_PROGRESS_SCHEMA_VERSION,
    academyProgress: defaultAcademyMilestones(),
    wallet: existingCache?.wallet ?? null,
    skillProgress: {},
    vaultProfile: existingCache?.vaultProfile ?? null,
    vaultSession: existingCache?.vaultSession ?? null,
  };
  writeCachedAccountProgress(
    { userId: account.supabaseUserId },
    resetPayload,
  );
  writeCachedAccountProgress({ username: account.username }, resetPayload);

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
}

/**
 * Family accounts track change. Linked children live in Supabase, so update
 * profiles.curriculum_cohort and reset that child's learner_progress.
 */
export async function changeLinkedChildLearningTrack(
  account: UserSession,
  nextCohort: MasteryCohort,
): Promise<ChangeLearningTrackResult> {
  if (account.accountRole === "parent_master") {
    return { ok: false, reason: "invalid" };
  }

  const previousCohort = getSessionCurriculumCohort(account);
  if (previousCohort === nextCohort) {
    return { ok: false, reason: "unchanged" };
  }

  const childUserId = account.supabaseUserId?.trim();
  if (childUserId) {
    const remote = await updateLinkedChildLearningTrack({
      childUserId,
      nextCohort,
    });
    if (!remote.ok) return { ok: false, reason: "invalid" };
    applyLocalTrackAndProgressReset(account, nextCohort);
    return {
      ok: true,
      cohortChanged: true,
      trackLabel: masteryCohortLabel(nextCohort),
      ageRange: masteryCohortAgeRangeLabel(nextCohort),
    };
  }

  return changeAccountLearningTrack(account.username, nextCohort);
}
