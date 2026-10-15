import { ACADEMY_PROGRESS_STORAGE_KEY } from "@/lib/dashboard/academy-progress-storage";
import { DASHBOARD_WALLET_STORAGE_KEY } from "@/lib/dashboard/dashboard-wallet-storage";
import { PARENT_PIN_STORAGE_KEY } from "@/lib/dashboard/parent-pin";
import { VAULT_SKILL_PROGRESS_STORAGE_KEY } from "@/lib/dashboard/vault-skill-progress-storage";
import {
  readVaultProfileRaw,
  readVaultSessionRaw,
  writeVaultProfileRaw,
  writeVaultSessionRaw,
} from "@/lib/dashboard/vault/profile-persist";
import {
  VAULT_PROFILE_STORAGE_KEY,
  VAULT_SESSION_STORAGE_KEY,
  migrateVaultSessionToProfile,
} from "@/lib/dashboard/vault/vault-profile-storage";
import {
  readPersisted,
  removePersisted,
  writePersisted,
} from "@/lib/dev/client-persist";
import { isExplorerPendingConsent } from "@/lib/onboarding/explorer-pending-consent";
import {
  GUEST_SESSION_STORAGE_KEY,
  readUserSession,
  type UserSession,
} from "@/lib/onboarding/guest-session";

export const GUEST_PROGRESS_SNAPSHOT_KEY = "nga_guest_progress_snapshot_v1";

export type GuestProgressSnapshot = {
  capturedAt: string;
  guestSession: UserSession | null;
  /** Dashboard wallet - XP / points balances. */
  wallet: string | null;
  /** @deprecated Legacy field name - read for backward-compatible restore. */
  vaultV2Session?: string | null;
  /** Guest Vault jar balances / ledger (session store). */
  vaultSession: string | null;
  /** Registered Vault profile blob when already promoted. */
  vaultProfile: string | null;
  /** Academy lesson milestones. */
  academyProgress: string | null;
  /** Skill trophy / badge tier overrides. */
  skillProgress: string | null;
  parentPin: string | null;
  /**
   * Explorer progress captured at sign-up and held on the device until
   * the parent approves. Live play while pending is folded in at approval.
   */
  heldForConsent?: boolean;
};

function readLiveParentPin(): string | null {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem(PARENT_PIN_STORAGE_KEY);
}

function buildLiveSnapshot(): GuestProgressSnapshot {
  return {
    capturedAt: new Date().toISOString(),
    guestSession: readUserSession(),
    wallet: readPersisted(DASHBOARD_WALLET_STORAGE_KEY),
    vaultSession: readVaultSessionRaw(VAULT_SESSION_STORAGE_KEY),
    vaultProfile: readVaultProfileRaw(VAULT_PROFILE_STORAGE_KEY),
    academyProgress: readPersisted(ACADEMY_PROGRESS_STORAGE_KEY),
    skillProgress: readPersisted(VAULT_SKILL_PROGRESS_STORAGE_KEY),
    parentPin: readLiveParentPin(),
  };
}

/** Backs up guest progress before signup or parent-consent - never overwrites an existing snapshot. */
export function captureGuestProgressSnapshot(): GuestProgressSnapshot {
  if (typeof window === "undefined") {
    throw new Error("guest progress snapshot requires a browser environment.");
  }

  const existing = readGuestProgressSnapshot();
  if (existing) {
    return existing;
  }

  const snapshot = buildLiveSnapshot();
  writePersisted(GUEST_PROGRESS_SNAPSHOT_KEY, JSON.stringify(snapshot));
  return snapshot;
}

/**
 * Refresh snapshot fields from live storage when a key is missing,
 * without clobbering already-captured guest assets.
 */
export function ensureGuestProgressSnapshot(): GuestProgressSnapshot {
  if (typeof window === "undefined") {
    throw new Error("guest progress snapshot requires a browser environment.");
  }

  const existing = readGuestProgressSnapshot();
  if (!existing) {
    return captureGuestProgressSnapshot();
  }

  const live = buildLiveSnapshot();
  const merged: GuestProgressSnapshot = {
    capturedAt: existing.capturedAt,
    guestSession: existing.guestSession ?? live.guestSession,
    wallet: existing.wallet ?? live.wallet,
    vaultSession: existing.vaultSession ?? live.vaultSession,
    vaultProfile: existing.vaultProfile ?? live.vaultProfile,
    academyProgress: existing.academyProgress ?? live.academyProgress,
    skillProgress: existing.skillProgress ?? live.skillProgress,
    parentPin: existing.parentPin ?? live.parentPin,
    heldForConsent: existing.heldForConsent === true,
  };

  writePersisted(GUEST_PROGRESS_SNAPSHOT_KEY, JSON.stringify(merged));
  return merged;
}

function parseSnapshot(raw: string): GuestProgressSnapshot | null {
  try {
    const parsed = JSON.parse(raw) as GuestProgressSnapshot & {
      ghostSession?: UserSession | null;
    };
    return {
      ...parsed,
      guestSession: parsed.guestSession ?? parsed.ghostSession ?? null,
      vaultSession: parsed.vaultSession ?? parsed.vaultV2Session ?? null,
      vaultProfile: parsed.vaultProfile ?? null,
      heldForConsent: parsed.heldForConsent === true,
    };
  } catch {
    return null;
  }
}

export function readGuestProgressSnapshot(): GuestProgressSnapshot | null {
  if (typeof window === "undefined") return null;

  const raw = readPersisted(GUEST_PROGRESS_SNAPSHOT_KEY);
  if (!raw) return null;
  return parseSnapshot(raw);
}

function readLocalFirst(key: string): string | null {
  if (typeof window === "undefined") return null;
  const local = window.localStorage.getItem(key);
  if (local !== null) return local;
  return window.sessionStorage.getItem(key);
}

function deviceSessionMatchesAccount(session: UserSession): boolean {
  if (typeof window === "undefined") return false;
  const raw = window.localStorage.getItem(GUEST_SESSION_STORAGE_KEY);
  if (!raw) return true;
  try {
    const stored = JSON.parse(raw) as {
      username?: string;
      supabaseUserId?: string;
    };
    if (session.supabaseUserId && stored.supabaseUserId) {
      return stored.supabaseUserId === session.supabaseUserId;
    }
    const left = stored.username?.trim().toLowerCase();
    const right = session.username.trim().toLowerCase();
    return Boolean(left && right && left === right);
  } catch {
    return false;
  }
}

/** Keep the on-device snapshot until parent approval. Does not clear it. */
export function markGuestProgressHeldForConsent(): GuestProgressSnapshot {
  const existing = ensureGuestProgressSnapshot();
  if (existing.heldForConsent) return existing;
  const held: GuestProgressSnapshot = { ...existing, heldForConsent: true };
  writePersisted(GUEST_PROGRESS_SNAPSHOT_KEY, JSON.stringify(held));
  return held;
}

/**
 * Play while pending updates the live keys. Fold those into the held snapshot
 * so approval keeps the newer progress. No-op unless the snapshot is held.
 */
export function absorbLiveProgressIntoHeldSnapshot(): boolean {
  if (typeof window === "undefined") return false;
  const raw =
    window.localStorage.getItem(GUEST_PROGRESS_SNAPSHOT_KEY) ??
    window.sessionStorage.getItem(GUEST_PROGRESS_SNAPSHOT_KEY);
  if (!raw) return false;
  const existing = parseSnapshot(raw);
  if (!existing?.heldForConsent) return false;

  const next: GuestProgressSnapshot = {
    ...existing,
    wallet: readLocalFirst(DASHBOARD_WALLET_STORAGE_KEY) ?? existing.wallet,
    vaultSession:
      readLocalFirst(VAULT_SESSION_STORAGE_KEY) ?? existing.vaultSession,
    vaultProfile:
      readLocalFirst(VAULT_PROFILE_STORAGE_KEY) ?? existing.vaultProfile,
    academyProgress:
      readLocalFirst(ACADEMY_PROGRESS_STORAGE_KEY) ?? existing.academyProgress,
    skillProgress:
      readLocalFirst(VAULT_SKILL_PROGRESS_STORAGE_KEY) ?? existing.skillProgress,
    parentPin: readLiveParentPin() ?? existing.parentPin,
    heldForConsent: true,
  };
  writePersisted(GUEST_PROGRESS_SNAPSHOT_KEY, JSON.stringify(next));
  return true;
}

/**
 * The approval sync can save an active session before finalize runs.
 * Copy a matching held snapshot into the session store so the merge can see it.
 */
export function stageHeldConsentSnapshotForAccount(session: UserSession): boolean {
  if (typeof window === "undefined") return false;
  if (isExplorerPendingConsent(session)) return false;
  const raw = window.localStorage.getItem(GUEST_PROGRESS_SNAPSHOT_KEY);
  if (!raw) return false;
  const snapshot = parseSnapshot(raw);
  if (!snapshot?.heldForConsent) return false;
  if (!deviceSessionMatchesAccount(session)) return false;
  window.sessionStorage.setItem(
    GUEST_PROGRESS_SNAPSHOT_KEY,
    JSON.stringify(snapshot),
  );
  return true;
}

/** Held progress for a different account must stay on the device. */
export function hasForeignHeldConsentSnapshot(session: UserSession): boolean {
  if (typeof window === "undefined") return false;
  const raw = window.localStorage.getItem(GUEST_PROGRESS_SNAPSHOT_KEY);
  if (!raw) return false;
  const snapshot = parseSnapshot(raw);
  if (!snapshot?.heldForConsent) return false;
  return !deviceSessionMatchesAccount(session);
}

/**
 * Restores backed-up progress after successful signup or parent consent approval.
 * Merges guest lesson milestones, XP/wallet, skill badges, and Vault balances
 * into the registered profile stores without resetting live progress.
 */
export function mergeGuestProgressSnapshot(): boolean {
  if (typeof window === "undefined") return false;

  const snapshot = ensureGuestProgressSnapshot();

  // Prefer snapshot values; fall back to anything still live so we never wipe gains.
  const live = buildLiveSnapshot();

  const wallet = snapshot.wallet ?? live.wallet;
  if (wallet !== null) {
    writePersisted(DASHBOARD_WALLET_STORAGE_KEY, wallet);
  }

  const academyProgress = snapshot.academyProgress ?? live.academyProgress;
  if (academyProgress !== null) {
    writePersisted(ACADEMY_PROGRESS_STORAGE_KEY, academyProgress);
  }

  const skillProgress = snapshot.skillProgress ?? live.skillProgress;
  if (skillProgress !== null) {
    writePersisted(VAULT_SKILL_PROGRESS_STORAGE_KEY, skillProgress);
  }

  const parentPin = snapshot.parentPin ?? live.parentPin;
  if (parentPin !== null) {
    window.sessionStorage.setItem(PARENT_PIN_STORAGE_KEY, parentPin);
  }

  const vaultSession =
    snapshot.vaultSession ?? snapshot.vaultV2Session ?? live.vaultSession;
  if (vaultSession !== null && vaultSession !== undefined) {
    writeVaultSessionRaw(VAULT_SESSION_STORAGE_KEY, vaultSession);
  }

  const vaultProfile = snapshot.vaultProfile ?? live.vaultProfile;
  if (vaultProfile !== null) {
    writeVaultProfileRaw(VAULT_PROFILE_STORAGE_KEY, vaultProfile);
  }

  // Promote guest Vault session jars into the durable registered profile store.
  const session = readUserSession();
  if (session?.accessMode === "registered") {
    migrateVaultSessionToProfile();
  }

  clearGuestProgressSnapshot();
  return true;
}

export function clearGuestProgressSnapshot(): void {
  if (typeof window === "undefined") return;
  removePersisted(GUEST_PROGRESS_SNAPSHOT_KEY);
}
