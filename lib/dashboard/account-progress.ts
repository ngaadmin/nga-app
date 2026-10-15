import type { AcademyLessonMilestoneNode } from "@/lib/dashboard/academy-state";
import {
  walletFieldsFromUnknown,
  type PersistedDashboardWallet,
  type WalletLedgerEvent,
} from "@/lib/dashboard/dashboard-wallet-storage";
import {
  hasPageIntroFlags,
  mergePageIntroFlags,
  type AccountPageIntroFlags,
} from "@/lib/dashboard/page-intro-flags";
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
  /** Consecutive practice days ending today. Omitted when the learner has none. */
  dayStreak?: number;
  /**
   * Page intros this account has dismissed. Synced with the rest of the
   * payload so a new device does not show them again.
   */
  pageIntros?: AccountPageIntroFlags;
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
  return walletFieldsFromUnknown(value);
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

  const dayStreak = parseDayStreak(value.dayStreak ?? value.day_streak);
  const pageIntros = parsePageIntros(value.pageIntros ?? value.page_intros);

  if (
    !academyProgress &&
    !wallet &&
    !skillProgress &&
    !vaultProfile &&
    !vaultSession &&
    dayStreak == null &&
    !pageIntros
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
    ...(dayStreak != null ? { dayStreak } : {}),
    ...(pageIntros ? { pageIntros } : {}),
  };
}

function parsePageIntros(value: unknown): AccountPageIntroFlags | undefined {
  if (typeof value === "string") {
    try {
      return parsePageIntros(JSON.parse(value));
    } catch {
      return undefined;
    }
  }
  if (!isRecord(value)) return undefined;
  return mergePageIntroFlags(value as AccountPageIntroFlags, null);
}

function parseDayStreak(value: unknown): number | undefined {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return undefined;
  return Math.min(9999, Math.floor(parsed));
}

export function mergedDayStreak(
  left: number | undefined,
  right: number | undefined,
): number | undefined {
  const value = Math.max(left ?? 0, right ?? 0);
  return value > 0 ? value : undefined;
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

function meaningfulVaultLedgerCount(
  profile: PersistedVaultProfile | null,
): number {
  if (!profile?.ledger?.length) return 0;
  return profile.ledger.filter((entry) => entry.id !== "ledger-welcome").length;
}

function vaultBalanceScore(profile: PersistedVaultProfile | null): number {
  if (!profile) return 0;
  const jars = profile.jarBalances;
  const jarTotal = jars ? sumJarBalances(jars) : 0;
  return (
    (profile.moneyToAllocate ?? 0) +
    jarTotal +
    meaningfulVaultLedgerCount(profile)
  );
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
  const hasStreak = (payload.dayStreak ?? 0) > 0;
  return !hasAcademy && !hasWallet && !hasSkills && !hasVault && !hasStreak;
}

/** True when the payload records at least one dismissed page intro. */
export function hasPersistedPageIntros(
  payload: AccountProgressPayload | null | undefined,
): boolean {
  return hasPageIntroFlags(payload?.pageIntros);
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

const ACADEMY_STATUS_RANK: Record<AcademyLessonMilestoneNode["status"], number> = {
  locked: 0,
  active: 1,
  completed: 2,
};

function normalizeAcademyProgress(
  nodes: readonly AcademyLessonMilestoneNode[],
): AcademyLessonMilestoneNode[] | null {
  if (nodes.length === 0) return null;
  const sorted = [...nodes].sort((left, right) => left.id - right.id);
  let highestCompleted = 0;
  for (const node of sorted) {
    if (node.status === "completed" && node.id > highestCompleted) {
      highestCompleted = node.id;
    }
  }

  return sorted.map((node) => {
    if (highestCompleted > 0 && node.id <= highestCompleted) {
      return { ...node, status: "completed" };
    }
    if (node.id === highestCompleted + 1) {
      return { ...node, status: "active" };
    }
    if (node.id > highestCompleted + 1) {
      return { ...node, status: "locked" };
    }
    return node;
  });
}

/** Union of lesson nodes. A completed lesson never returns to active or locked. */
export function mergeAcademyProgress(
  left: AcademyLessonMilestoneNode[] | null | undefined,
  right: AcademyLessonMilestoneNode[] | null | undefined,
): AcademyLessonMilestoneNode[] | null {
  if (!left?.length && !right?.length) return left ?? right ?? null;
  if (!left?.length) return normalizeAcademyProgress(right ?? []);
  if (!right?.length) return normalizeAcademyProgress(left);

  const byId = new Map<number, AcademyLessonMilestoneNode>();
  for (const node of [...left, ...right]) {
    if (!Number.isFinite(node.id)) continue;
    const existing = byId.get(node.id);
    if (
      !existing ||
      ACADEMY_STATUS_RANK[node.status] > ACADEMY_STATUS_RANK[existing.status]
    ) {
      byId.set(node.id, node);
    }
  }
  return normalizeAcademyProgress([...byId.values()]);
}

function walletSpent(wallet: PersistedDashboardWallet): number {
  return Math.max(0, wallet.lifetimePointsEarned - wallet.totalPoints);
}

function unionWalletLedger(
  left: readonly WalletLedgerEvent[] | undefined,
  right: readonly WalletLedgerEvent[] | undefined,
): WalletLedgerEvent[] {
  const byId = new Map<string, WalletLedgerEvent>();
  for (const event of [...(left ?? []), ...(right ?? [])]) {
    const existing = byId.get(event.id);
    if (!existing || event.points > existing.points) {
      byId.set(event.id, event);
    }
  }
  return [...byId.values()].sort(
    (a, b) => (a.at || "").localeCompare(b.at || "") || a.id.localeCompare(b.id),
  );
}

function replayWalletLedger(events: readonly WalletLedgerEvent[]): {
  lifetime: number;
  spent: number;
} {
  let lifetime = 0;
  let spent = 0;
  for (const event of events) {
    if (event.kind === "earn") lifetime += event.points;
    else spent += event.points;
  }
  return { lifetime, spent };
}

function laterWalletTimestamp(
  left: string | null | undefined,
  right: string | null | undefined,
): string | null {
  const leftMs = left ? Date.parse(left) : Number.NaN;
  const rightMs = right ? Date.parse(right) : Number.NaN;
  if (!Number.isFinite(leftMs) && !Number.isFinite(rightMs)) {
    return left ?? right ?? null;
  }
  if (!Number.isFinite(leftMs)) return right ?? null;
  if (!Number.isFinite(rightMs)) return left ?? null;
  return leftMs >= rightMs ? (left ?? null) : (right ?? null);
}

function walletSettingsSource(
  left: PersistedDashboardWallet,
  right: PersistedDashboardWallet,
): PersistedDashboardWallet {
  const newer = laterWalletTimestamp(left.updatedAt, right.updatedAt);
  if (newer && newer === left.updatedAt && newer !== right.updatedAt) return left;
  if (newer && newer === right.updatedAt && newer !== left.updatedAt) return right;
  if (right.xpExchangeRateSet !== left.xpExchangeRateSet) {
    return right.xpExchangeRateSet ? right : left;
  }
  return right;
}

/**
 * Lifetime XP is the max. Spendable balance replays the union of cash-in and
 * award events, and never falls below what either snapshot already recorded.
 * A stale device cannot undo a cash-in or drop earned XP.
 */
export function mergeWalletProgress(
  left: PersistedDashboardWallet | null | undefined,
  right: PersistedDashboardWallet | null | undefined,
): PersistedDashboardWallet | null {
  if (!left) return right ?? null;
  if (!right) return left;

  const ledger = unionWalletLedger(left.ledger, right.ledger);
  const replayed = replayWalletLedger(ledger);
  const lifetimePointsEarned = Math.max(
    left.lifetimePointsEarned,
    right.lifetimePointsEarned,
    replayed.lifetime,
  );
  const spent = Math.max(walletSpent(left), walletSpent(right), replayed.spent);
  const settings = walletSettingsSource(left, right);

  return {
    schemaVersion: settings.schemaVersion,
    ownerUserId: right.ownerUserId ?? left.ownerUserId ?? null,
    totalPoints: Math.max(0, lifetimePointsEarned - spent),
    lifetimePointsEarned,
    audSliderIndex: settings.audSliderIndex,
    xpExchangeRateSet: settings.xpExchangeRateSet,
    ...(ledger.length > 0 ? { ledger } : {}),
    updatedAt: laterWalletTimestamp(left.updatedAt, right.updatedAt),
  };
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

/** Combine two payloads. Lessons and XP merge forward; skills and Vault keep the richer copy. */
export function mergeAccountProgress(
  left: AccountProgressPayload | null | undefined,
  right: AccountProgressPayload | null | undefined,
): AccountProgressPayload | null {
  if (!left) return right ?? null;
  if (!right) return left;

  const dayStreak = mergedDayStreak(left.dayStreak, right.dayStreak);
  const pageIntros = mergePageIntroFlags(left.pageIntros, right.pageIntros);

  return {
    schemaVersion: ACCOUNT_PROGRESS_SCHEMA_VERSION,
    academyProgress: mergeAcademyProgress(left.academyProgress, right.academyProgress),
    wallet: mergeWalletProgress(left.wallet, right.wallet),
    skillProgress: mergeSkillProgress(left.skillProgress, right.skillProgress),
    vaultProfile: richerVault(left.vaultProfile, right.vaultProfile),
    vaultSession: richerVault(left.vaultSession, right.vaultSession),
    ...(dayStreak != null ? { dayStreak } : {}),
    ...(pageIntros ? { pageIntros } : {}),
  };
}

/**
 * Cloud save merge. Lessons union to the furthest completion. Lifetime XP
 * stays monotonic. The live balance keeps every award and cash-in.
 */
export function overlayAccountProgress(
  base: AccountProgressPayload | null | undefined,
  overlay: AccountProgressPayload | null | undefined,
): AccountProgressPayload | null {
  if (!overlay) return base ?? null;
  if (!base) return overlay;

  const dayStreak = mergedDayStreak(base.dayStreak, overlay.dayStreak);
  const pageIntros = mergePageIntroFlags(base.pageIntros, overlay.pageIntros);

  return {
    schemaVersion: ACCOUNT_PROGRESS_SCHEMA_VERSION,
    academyProgress: mergeAcademyProgress(
      base.academyProgress,
      overlay.academyProgress,
    ),
    wallet: mergeWalletProgress(base.wallet, overlay.wallet),
    skillProgress: overlay.skillProgress ?? base.skillProgress,
    vaultProfile: overlay.vaultProfile ?? base.vaultProfile,
    vaultSession: overlay.vaultSession ?? base.vaultSession,
    ...(dayStreak != null ? { dayStreak } : {}),
    ...(pageIntros ? { pageIntros } : {}),
  };
}

/**
 * Sign-in and lesson return. Cloud, this device's cache, and the live
 * session merge forward so a lesson just cashed in is not replaced by a
 * slower refetch of the previous cloud copy.
 */
export function pickRestoredAccountProgress(input: {
  remote?: AccountProgressPayload | null;
  cached?: AccountProgressPayload | null;
  live?: AccountProgressPayload | null;
}): AccountProgressPayload | null {
  return mergeAccountProgress(
    mergeAccountProgress(input.remote, input.cached),
    input.live,
  );
}
