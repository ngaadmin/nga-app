import {
  ACCOUNT_PROGRESS_SCHEMA_VERSION,
  isEmptyAccountProgress,
  mergeAccountProgress,
  parseAccountProgressPayload,
  type AccountProgressPayload,
} from "@/lib/dashboard/account-progress";
import {
  beginAccountProgressApply,
  dispatchAccountProgressRestored,
  endAccountProgressApply,
} from "@/lib/dashboard/account-progress-dirty";
import {
  ACADEMY_PROGRESS_STORAGE_KEY,
  saveAcademyMilestones,
} from "@/lib/dashboard/academy-progress-storage";
import {
  readDashboardWalletState,
  saveDashboardWalletState,
} from "@/lib/dashboard/dashboard-wallet-storage";
import {
  readVaultSkillTierOverrides,
  saveVaultSkillTierOverrides,
} from "@/lib/dashboard/vault-skill-progress-storage";
import {
  VAULT_PROFILE_STORAGE_KEY,
  VAULT_SESSION_STORAGE_KEY,
  migrateVaultSessionToProfile,
} from "@/lib/dashboard/vault/vault-profile-storage";
import {
  readVaultProfileRaw,
  readVaultSessionRaw,
  writeVaultProfileRaw,
  writeVaultSessionRaw,
} from "@/lib/dashboard/vault/profile-persist";
import { readPersisted } from "@/lib/dev/client-persist";
import { readUserSession } from "@/lib/onboarding/guest-session";

/** Durable per-account cache — survives logout so the same device can restore. */
export const ACCOUNT_PROGRESS_CACHE_KEY = "nga_account_progress_by_user_v1";

type AccountProgressCache = Record<string, AccountProgressPayload>;

export function accountProgressCacheKey(input: {
  userId?: string | null;
  username?: string | null;
}): string | null {
  const userId = input.userId?.trim();
  if (userId) return userId;
  const username = input.username?.trim().toLowerCase();
  return username || null;
}

function readCache(): AccountProgressCache {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(ACCOUNT_PROGRESS_CACHE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!parsed || typeof parsed !== "object") return {};

    const cache: AccountProgressCache = {};
    for (const [key, value] of Object.entries(parsed)) {
      const payload = parseAccountProgressPayload(value);
      if (payload) cache[key] = payload;
    }
    return cache;
  } catch {
    return {};
  }
}

function writeCache(cache: AccountProgressCache): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ACCOUNT_PROGRESS_CACHE_KEY, JSON.stringify(cache));
}

export function readCachedAccountProgress(input: {
  userId?: string | null;
  username?: string | null;
}): AccountProgressPayload | null {
  const key = accountProgressCacheKey(input);
  if (!key) return null;
  const cache = readCache();
  const byId = cache[key] ?? null;
  if (byId) return byId;
  const usernameKey = input.username?.trim().toLowerCase();
  if (!usernameKey) return null;
  return cache[usernameKey] ?? null;
}

export function writeCachedAccountProgress(
  input: { userId?: string | null; username?: string | null },
  payload: AccountProgressPayload | null,
): void {
  const key = accountProgressCacheKey(input);
  if (!key || typeof window === "undefined") return;

  const cache = readCache();
  if (!payload || isEmptyAccountProgress(payload)) {
    delete cache[key];
  } else {
    cache[key] = payload;
  }
  writeCache(cache);
}

export function collectAccountProgress(): AccountProgressPayload {
  const academyRaw = readPersisted(ACADEMY_PROGRESS_STORAGE_KEY);
  const vaultProfileRaw = readVaultProfileRaw(VAULT_PROFILE_STORAGE_KEY);
  const vaultSessionRaw = readVaultSessionRaw(VAULT_SESSION_STORAGE_KEY);

  return {
    schemaVersion: ACCOUNT_PROGRESS_SCHEMA_VERSION,
    academyProgress: academyRaw
      ? (parseAccountProgressPayload({ academyProgress: academyRaw })
          ?.academyProgress ?? null)
      : null,
    wallet: readDashboardWalletState(),
    skillProgress: readVaultSkillTierOverrides(),
    vaultProfile: vaultProfileRaw
      ? parseAccountProgressPayload({ vaultProfile: vaultProfileRaw })
          ?.vaultProfile ?? null
      : null,
    vaultSession: vaultSessionRaw
      ? parseAccountProgressPayload({ vaultSession: vaultSessionRaw })
          ?.vaultSession ?? null
      : null,
  };
}

export function applyAccountProgress(payload: AccountProgressPayload): void {
  if (typeof window === "undefined") return;

  beginAccountProgressApply();
  try {
    if (payload.academyProgress && payload.academyProgress.length > 0) {
      saveAcademyMilestones(payload.academyProgress);
    }

    if (payload.wallet) {
      saveDashboardWalletState(payload.wallet);
    }

    if (payload.skillProgress) {
      saveVaultSkillTierOverrides(payload.skillProgress);
    }

    if (payload.vaultProfile) {
      writeVaultProfileRaw(
        VAULT_PROFILE_STORAGE_KEY,
        JSON.stringify(payload.vaultProfile),
      );
    }

    if (payload.vaultSession) {
      writeVaultSessionRaw(
        VAULT_SESSION_STORAGE_KEY,
        JSON.stringify(payload.vaultSession),
      );
    }

    const session = readUserSession();
    if (session?.accessMode === "registered") {
      migrateVaultSessionToProfile();
    }

    writeCachedAccountProgress(
      {
        userId: session?.supabaseUserId,
        username: session?.username,
      },
      collectAccountProgress(),
    );
  } finally {
    endAccountProgressApply();
  }

  dispatchAccountProgressRestored();
}

/**
 * Merge remote + same-device cache + live storage, then write the richer
 * result into the active session stores.
 */
export function restoreAccountProgressForUser(input: {
  userId?: string | null;
  username?: string | null;
  remote?: AccountProgressPayload | null;
}): AccountProgressPayload | null {
  if (typeof window === "undefined") return null;

  const live = collectAccountProgress();
  const cached = readCachedAccountProgress(input);
  const merged = mergeAccountProgress(
    mergeAccountProgress(input.remote ?? null, cached),
    isEmptyAccountProgress(live) ? null : live,
  );

  if (!merged || isEmptyAccountProgress(merged)) {
    return merged;
  }

  applyAccountProgress(merged);
  writeCachedAccountProgress(input, merged);
  return merged;
}

export function persistAccountProgressCacheFromLive(input: {
  userId?: string | null;
  username?: string | null;
}): void {
  if (typeof window === "undefined") return;
  const live = collectAccountProgress();
  if (isEmptyAccountProgress(live)) return;
  writeCachedAccountProgress(input, live);
}
