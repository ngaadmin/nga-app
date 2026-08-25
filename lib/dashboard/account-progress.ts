import type { AcademyLessonMilestoneNode } from "@/lib/dashboard/academy-state";
import type { PersistedDashboardWallet } from "@/lib/dashboard/dashboard-wallet-storage";
import type { SkillTrophyTier } from "@/lib/dashboard/skill-trophies";
import type { VaultSkillTierOverrides } from "@/lib/dashboard/vault-skill-progress-storage";
import type { PersistedVaultProfile } from "@/lib/dashboard/vault/vault-profile-storage";
import { sumJarBalances } from "@/lib/dashboard/destination-jars";

export const ACCOUNT_PROGRESS_SCHEMA_VERSION = 1;

export type AccountProgressPayload = {
  schemaVersion: number;
  academyProgress: AcademyLessonMilestoneNode[] | null;
  wallet: PersistedDashboardWallet | null;
  skillProgress: VaultSkillTierOverrides | null;
  vaultProfile: PersistedVaultProfile | null;
  vaultSession: PersistedVaultProfile | null;
};

const SKILL_TIER_RANK: Record<SkillTrophyTier, number> = {
  gold: 0,
  silver: 1,
  bronze: 2,
  unlocked: 3,
  locked: 4,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function parseAcademyProgress(
  value: unknown,
): AcademyLessonMilestoneNode[] | null {
  if (typeof value === "string") {
    try {
      return parseAcademyProgress(JSON.parse(value));
    } catch {
      return null;
    }
  }
  if (!Array.isArray(value) || value.length === 0) return null;

  const nodes: AcademyLessonMilestoneNode[] = [];
  for (const raw of value) {
    if (!isRecord(raw)) continue;
    let entry = raw;
    if (typeof entry.id !== "number" || !Number.isFinite(entry.id)) {
      const asNumber = typeof entry.id === "string" ? Number(entry.id) : NaN;
      if (!Number.isFinite(asNumber)) continue;
      entry = { ...entry, id: asNumber };
    }
    if (
      entry.status !== "active" &&
      entry.status !== "locked" &&
      entry.status !== "completed"
    ) {
      continue;
    }
    nodes.push(entry as AcademyLessonMilestoneNode);
  }
  return nodes.length > 0 ? nodes : null;
}

function parseWallet(value: unknown): PersistedDashboardWallet | null {
  if (typeof value === "string") {
    try {
      return parseWallet(JSON.parse(value));
    } catch {
      return null;
    }
  }
  if (!isRecord(value)) return null;
  if (
    typeof value.totalPoints !== "number" ||
    !Number.isFinite(value.totalPoints) ||
    typeof value.audSliderIndex !== "number" ||
    !Number.isFinite(value.audSliderIndex)
  ) {
    return null;
  }

  const totalPoints = Math.max(0, Math.floor(value.totalPoints));
  const lifetimePointsEarned =
    typeof value.lifetimePointsEarned === "number" &&
    Number.isFinite(value.lifetimePointsEarned)
      ? Math.max(0, Math.floor(value.lifetimePointsEarned))
      : totalPoints;

  return {
    schemaVersion:
      typeof value.schemaVersion === "number" ? value.schemaVersion : 1,
    totalPoints,
    lifetimePointsEarned,
    audSliderIndex: value.audSliderIndex,
    xpExchangeRateSet: value.xpExchangeRateSet === true,
  };
}

function isSkillTier(value: unknown): value is SkillTrophyTier {
  return (
    value === "gold" ||
    value === "silver" ||
    value === "bronze" ||
    value === "unlocked" ||
    value === "locked"
  );
}

function parseSkillProgress(value: unknown): VaultSkillTierOverrides | null {
  if (typeof value === "string") {
    try {
      return parseSkillProgress(JSON.parse(value));
    } catch {
      return null;
    }
  }
  if (!isRecord(value)) return null;

  const overrides: VaultSkillTierOverrides = {};
  for (const [key, tier] of Object.entries(value)) {
    if (isSkillTier(tier)) overrides[key] = tier;
  }
  return Object.keys(overrides).length > 0 ? overrides : null;
}

function parseVaultProfile(value: unknown): PersistedVaultProfile | null {
  if (typeof value === "string") {
    try {
      return parseVaultProfile(JSON.parse(value));
    } catch {
      return null;
    }
  }
  if (!isRecord(value)) return null;
  if (
    typeof value.moneyToAllocate !== "number" &&
    !isRecord(value.jarBalances)
  ) {
    return null;
  }
  return value as unknown as PersistedVaultProfile;
}

/** Accepts a stored jsonb object or a JSON string. */
export function parseAccountProgressPayload(
  value: unknown,
): AccountProgressPayload | null {
  if (typeof value === "string") {
    try {
      return parseAccountProgressPayload(JSON.parse(value));
    } catch {
      return null;
    }
  }
  if (!isRecord(value)) return null;

  const academyProgress = parseAcademyProgress(
    value.academyProgress ?? value.academy_progress,
  );
  const wallet = parseWallet(value.wallet);
  const skillProgress = parseSkillProgress(
    value.skillProgress ?? value.skill_progress,
  );
  const vaultProfile = parseVaultProfile(
    value.vaultProfile ?? value.vault_profile,
  );
  const vaultSession = parseVaultProfile(
    value.vaultSession ?? value.vault_session,
  );

  if (
    !academyProgress &&
    !wallet &&
    !skillProgress &&
    !vaultProfile &&
    !vaultSession
  ) {
    return null;
  }

  return {
    schemaVersion:
      typeof value.schemaVersion === "number"
        ? value.schemaVersion
        : ACCOUNT_PROGRESS_SCHEMA_VERSION,
    academyProgress,
    wallet,
    skillProgress,
    vaultProfile,
    vaultSession,
  };
}

function completedLessonCount(
  milestones: AcademyLessonMilestoneNode[] | null,
): number {
  if (!milestones) return 0;
  return milestones.filter((node) => node.status === "completed").length;
}

function skillProgressScore(overrides: VaultSkillTierOverrides | null): number {
  if (!overrides) return 0;
  return Object.values(overrides).reduce((score, tier) => {
    if (!tier || tier === "locked") return score;
    return score + (4 - SKILL_TIER_RANK[tier]);
  }, 0);
}

function vaultBalanceScore(profile: PersistedVaultProfile | null): number {
  if (!profile) return 0;
  const jars = profile.jarBalances;
  const jarTotal = jars ? sumJarBalances(jars) : 0;
  return (profile.moneyToAllocate ?? 0) + jarTotal + (profile.ledger?.length ?? 0);
}

export function isEmptyAccountProgress(
  payload: AccountProgressPayload | null | undefined,
): boolean {
  if (!payload) return true;
  const hasAcademy = completedLessonCount(payload.academyProgress) > 0;
  const hasWallet =
    (payload.wallet?.lifetimePointsEarned ?? 0) > 0 ||
    (payload.wallet?.totalPoints ?? 0) > 0;
  const hasSkills = skillProgressScore(payload.skillProgress) > 0;
  const hasVault =
    vaultBalanceScore(payload.vaultProfile) > 0 ||
    vaultBalanceScore(payload.vaultSession) > 0;
  return !hasAcademy && !hasWallet && !hasSkills && !hasVault;
}

/** Safe learner_progress log fields — ids, XP, and milestone counts only. */
export function accountProgressLogFields(
  payload: AccountProgressPayload | null | undefined,
): {
  xp: number;
  milestoneCount: number;
} {
  const milestoneCount = completedLessonCount(payload?.academyProgress ?? null);
  const lifetimeXp = payload?.wallet?.lifetimePointsEarned ?? 0;
  const spendableXp = payload?.wallet?.totalPoints ?? 0;
  return {
    xp: lifetimeXp > 0 ? lifetimeXp : spendableXp,
    milestoneCount,
  };
}

function richerAcademy(
  left: AcademyLessonMilestoneNode[] | null,
  right: AcademyLessonMilestoneNode[] | null,
): AcademyLessonMilestoneNode[] | null {
  return completedLessonCount(left) >= completedLessonCount(right) ? left : right;
}

function richerWallet(
  left: PersistedDashboardWallet | null,
  right: PersistedDashboardWallet | null,
): PersistedDashboardWallet | null {
  if (!left) return right;
  if (!right) return left;
  if (left.lifetimePointsEarned !== right.lifetimePointsEarned) {
    return left.lifetimePointsEarned >= right.lifetimePointsEarned ? left : right;
  }
  return left.totalPoints >= right.totalPoints ? left : right;
}

function mergeSkillProgress(
  left: VaultSkillTierOverrides | null,
  right: VaultSkillTierOverrides | null,
): VaultSkillTierOverrides | null {
  if (!left) return right;
  if (!right) return left;

  const merged: VaultSkillTierOverrides = { ...left };
  for (const [skillId, tier] of Object.entries(right)) {
    if (!tier) continue;
    const current = merged[skillId];
    if (!current || SKILL_TIER_RANK[tier] < SKILL_TIER_RANK[current]) {
      merged[skillId] = tier;
    }
  }
  return merged;
}

function richerVault(
  left: PersistedVaultProfile | null,
  right: PersistedVaultProfile | null,
): PersistedVaultProfile | null {
  return vaultBalanceScore(left) >= vaultBalanceScore(right) ? left : right;
}

/** Prefer the more advanced of two payloads without summing XP twice. */
export function mergeAccountProgress(
  left: AccountProgressPayload | null | undefined,
  right: AccountProgressPayload | null | undefined,
): AccountProgressPayload | null {
  if (!left) return right ?? null;
  if (!right) return left;

  return {
    schemaVersion: ACCOUNT_PROGRESS_SCHEMA_VERSION,
    academyProgress: richerAcademy(left.academyProgress, right.academyProgress),
    wallet: richerWallet(left.wallet, right.wallet),
    skillProgress: mergeSkillProgress(left.skillProgress, right.skillProgress),
    vaultProfile: richerVault(left.vaultProfile, right.vaultProfile),
    vaultSession: richerVault(left.vaultSession, right.vaultSession),
  };
}
