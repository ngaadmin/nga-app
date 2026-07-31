import { ACADEMY_PROGRESS_STORAGE_KEY } from "@/lib/dashboard/academy-progress-storage";
import { DASHBOARD_WALLET_STORAGE_KEY } from "@/lib/dashboard/dashboard-wallet-storage";
import { PARENT_PIN_STORAGE_KEY } from "@/lib/dashboard/parent-pin";
import { VAULT_SKILL_PROGRESS_STORAGE_KEY } from "@/lib/dashboard/vault-skill-progress-storage";
import {
  readVaultSessionRaw,
  writeVaultSessionRaw,
} from "@/lib/dashboard/vault/profile-persist";
import { VAULT_SESSION_STORAGE_KEY } from "@/lib/dashboard/vault/vault-profile-storage";
import {
  readPersisted,
  removePersisted,
  writePersisted,
} from "@/lib/dev/client-persist";
import type { UserSession } from "@/lib/onboarding/ghost-session";
import { readUserSession } from "@/lib/onboarding/ghost-session";

export const GHOST_PROGRESS_SNAPSHOT_KEY = "nga_ghost_progress_snapshot_v1";

export type GhostProgressSnapshot = {
  capturedAt: string;
  ghostSession: UserSession | null;
  wallet: string | null;
  /** @deprecated Legacy field name — read for backward-compatible restore. */
  vaultV2Session?: string | null;
  vaultSession: string | null;
  academyProgress: string | null;
  skillProgress: string | null;
  parentPin: string | null;
};

/** Backs up ghost progress before signup or parent-consent — never overwrites an existing snapshot. */
export function captureGhostProgressSnapshot(): GhostProgressSnapshot {
  if (typeof window === "undefined") {
    throw new Error("Ghost progress snapshot requires a browser environment.");
  }

  const existing = readGhostProgressSnapshot();
  if (existing) {
    return existing;
  }

  const snapshot: GhostProgressSnapshot = {
    capturedAt: new Date().toISOString(),
    ghostSession: readUserSession(),
    wallet: readPersisted(DASHBOARD_WALLET_STORAGE_KEY),
    vaultSession: readVaultSessionRaw(VAULT_SESSION_STORAGE_KEY),
    academyProgress: readPersisted(ACADEMY_PROGRESS_STORAGE_KEY),
    skillProgress: readPersisted(VAULT_SKILL_PROGRESS_STORAGE_KEY),
    parentPin:
      typeof window !== "undefined"
        ? window.sessionStorage.getItem(PARENT_PIN_STORAGE_KEY)
        : null,
  };

  writePersisted(GHOST_PROGRESS_SNAPSHOT_KEY, JSON.stringify(snapshot));
  return snapshot;
}

export function readGhostProgressSnapshot(): GhostProgressSnapshot | null {
  if (typeof window === "undefined") return null;

  const raw = readPersisted(GHOST_PROGRESS_SNAPSHOT_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as GhostProgressSnapshot;
    return {
      ...parsed,
      vaultSession: parsed.vaultSession ?? parsed.vaultV2Session ?? null,
    };
  } catch {
    return null;
  }
}

/** Restores backed-up progress after successful signup or parent consent approval. */
export function mergeGhostProgressSnapshot(): boolean {
  if (typeof window === "undefined") return false;

  const snapshot = readGhostProgressSnapshot();
  if (!snapshot) return false;

  if (snapshot.wallet !== null) {
    writePersisted(DASHBOARD_WALLET_STORAGE_KEY, snapshot.wallet);
  }
  const vaultSession = snapshot.vaultSession ?? snapshot.vaultV2Session;
  if (vaultSession !== null && vaultSession !== undefined) {
    writeVaultSessionRaw(VAULT_SESSION_STORAGE_KEY, vaultSession);
  }
  if (snapshot.academyProgress !== null) {
    writePersisted(ACADEMY_PROGRESS_STORAGE_KEY, snapshot.academyProgress);
  }
  if (snapshot.skillProgress !== null) {
    writePersisted(VAULT_SKILL_PROGRESS_STORAGE_KEY, snapshot.skillProgress);
  }
  if (snapshot.parentPin !== null) {
    window.sessionStorage.setItem(PARENT_PIN_STORAGE_KEY, snapshot.parentPin);
  }

  clearGhostProgressSnapshot();
  return true;
}

export function clearGhostProgressSnapshot(): void {
  if (typeof window === "undefined") return;
  removePersisted(GHOST_PROGRESS_SNAPSHOT_KEY);
}
