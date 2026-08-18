import {
  isEligibleBirthYear,
  representativeBirthYearForCohort,
} from "@/lib/onboarding/birth-years";
import {
  convertToRegisteredProfile,
  enforceCohortAccountState,
  readUserSession,
  saveUserSession,
  type UserSession,
} from "@/lib/onboarding/guest-session";
import {
  lookupCurrentLearnerAccount,
  lookupLearnerConsentStatus,
  type LearnerAccountSnapshot,
  type LearnerConsentStatus,
} from "@/lib/onboarding/learner-account";
import {
  resolveHouseholdEmail,
  upsertRegisteredAccount,
} from "@/lib/onboarding/registered-accounts";
import { finalizeRegisteredSignup } from "@/lib/onboarding/signup-finalize";

const ADULT_OFFSET_YEARS = 35;

export type ApplyLearnerAccountOptions = {
  existing?: UserSession | null;
  password?: string;
};

function adultBirthYear(): number {
  return new Date().getFullYear() - ADULT_OFFSET_YEARS;
}

function remoteIsActive(
  remote: Pick<LearnerConsentStatus, "accountStatus" | "consentApprovedAt">,
): boolean {
  return remote.accountStatus === "active";
}

function toLocalAccountStatus(
  remote: Pick<LearnerConsentStatus, "accountStatus" | "consentApprovedAt">,
): "ACTIVE" | "PENDING_CONSENT" {
  return remoteIsActive(remote) ? "ACTIVE" : "PENDING_CONSENT";
}

function resolveConsentApprovedAt(
  remote: Pick<LearnerConsentStatus, "accountStatus" | "consentApprovedAt">,
  existing?: string,
): string | undefined {
  if (!remoteIsActive(remote)) return existing;
  return remote.consentApprovedAt ?? existing ?? new Date().toISOString();
}

function usernamesMatch(left?: string | null, right?: string | null): boolean {
  const a = left?.trim().toLowerCase();
  const b = right?.trim().toLowerCase();
  return Boolean(a && b && a === b);
}

function snapshotFromConsentStatus(
  status: LearnerConsentStatus,
  existing: UserSession | null,
): LearnerAccountSnapshot {
  return {
    userId: status.userId,
    username: status.username,
    birthYear: existing?.birthYear ?? null,
    accountRole: existing?.accountRole === "parent_master" ? "parent_master" : "child",
    accountStatus: status.accountStatus,
    consentApprovedAt: status.consentApprovedAt,
    parentEmail: existing?.parentEmail ?? null,
    learnerEmail: existing?.learnerEmail ?? existing?.email ?? null,
  };
}

/**
 * Merge a Supabase profile into the local session + durable registry.
 * Activates Explorers once `account_status` is active and consent is dated.
 */
export function applyLearnerAccountSnapshot(
  remote: LearnerAccountSnapshot,
  options: ApplyLearnerAccountOptions = {},
): UserSession {
  const existing = options.existing ?? readUserSession();
  const accountStatus = toLocalAccountStatus(remote);
  const consentApprovedAt = resolveConsentApprovedAt(
    remote,
    existing?.consentApprovedAt,
  );
  const birthYear =
    remote.birthYear && isEligibleBirthYear(remote.birthYear)
      ? remote.birthYear
      : existing && isEligibleBirthYear(existing.birthYear)
        ? existing.birthYear
        : remote.accountRole === "parent_master"
          ? adultBirthYear()
          : representativeBirthYearForCohort(
              existing?.curriculumCohort ?? existing?.ageTier ?? "pathfinder",
            );

  const sameRegisteredUser =
    existing?.accessMode === "registered" &&
    (existing.supabaseUserId === remote.userId ||
      usernamesMatch(existing.username, remote.username));

  if (sameRegisteredUser && existing) {
    const updated = enforceCohortAccountState({
      ...existing,
      username: remote.username || existing.username,
      supabaseUserId: remote.userId,
      accountRole: remote.accountRole,
      accountStatus,
      consentApprovedAt,
      mustChangePassword: remote.mustChangePassword === true,
      parentEmail:
        remote.accountRole === "parent_master"
          ? (remote.learnerEmail ?? existing.parentEmail ?? remote.parentEmail ?? undefined)
          : (existing.parentEmail ?? remote.parentEmail ?? undefined),
      learnerEmail:
        remote.accountRole === "child" && existing.ageTier === "explorer"
          ? undefined
          : remote.accountRole === "parent_master"
            ? (remote.learnerEmail ?? existing.learnerEmail ?? undefined)
            : (existing.learnerEmail ?? remote.learnerEmail ?? undefined),
    });
    saveUserSession(updated);
    upsertRegisteredAccount(updated);
    return updated;
  }

  const converted = convertToRegisteredProfile({
    username: remote.username,
    birthYear,
    accountRole: remote.accountRole,
    parentEmail:
      remote.accountRole === "parent_master"
        ? (remote.learnerEmail ?? existing?.parentEmail ?? remote.parentEmail)
        : (existing?.parentEmail ?? remote.parentEmail),
    learnerEmail:
      remote.accountRole === "parent_master"
        ? (remote.learnerEmail ?? existing?.learnerEmail)
        : remote.accountRole === "child" && existing?.ageTier === "explorer"
          ? undefined
          : remote.learnerEmail,
    password: options.password,
    passcodeHash: existing?.passcodeHash,
    passwordHash: existing?.passwordHash,
    consentApprovedAt,
    accountStatus,
    supabaseUserId: remote.userId,
  });

  return {
    ...converted,
    mustChangePassword: remote.mustChangePassword === true,
  };
}

/**
 * Pull the signed-in (or username-matched) Supabase profile onto this device.
 * No-op when the local session is already an active linked account.
 */
export async function syncLocalSessionWithSupabaseAccount(): Promise<UserSession | null> {
  if (typeof window === "undefined") return null;

  const local = readUserSession();
  const parentMissingEmail =
    local?.accountRole === "parent_master" && !resolveHouseholdEmail(local);

  if (
    local?.accessMode === "registered" &&
    local.accountStatus === "ACTIVE" &&
    local.consentApprovedAt &&
    local.supabaseUserId &&
    !parentMissingEmail
  ) {
    return local;
  }

  try {
    const current = await lookupCurrentLearnerAccount();
    if (current) {
      const applied = applyLearnerAccountSnapshot(current, { existing: local });
      if (applied.accessMode === "registered") {
        await finalizeRegisteredSignup(applied, { skipEmail: true });
        return readUserSession() ?? applied;
      }
    }

    if (local?.accessMode === "registered" && local.username.trim()) {
      const status = await lookupLearnerConsentStatus(local.username);
      if (!status) return local;

      const applied = applyLearnerAccountSnapshot(
        snapshotFromConsentStatus(status, local),
        { existing: local },
      );
      if (
        applied.accountStatus !== local.accountStatus ||
        applied.consentApprovedAt !== local.consentApprovedAt ||
        applied.supabaseUserId !== local.supabaseUserId
      ) {
        await finalizeRegisteredSignup(applied, { skipEmail: true });
        return readUserSession() ?? applied;
      }
      return applied;
    }
  } catch {
    return local;
  }

  return local;
}
