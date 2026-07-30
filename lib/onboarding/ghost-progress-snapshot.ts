import { ACADEMY_PROGRESS_STORAGE_KEY } from "@/lib/dashboard/academy-progress-storage";
import { DASHBOARD_WALLET_STORAGE_KEY } from "@/lib/dashboard/dashboard-wallet-storage";
import { PARENT_PIN_STORAGE_KEY } from "@/lib/dashboard/parent-pin";
import { VAULT_SKILL_PROGRESS_STORAGE_KEY } from "@/lib/dashboard/vault-skill-progress-storage";
import {
  readVaultV2SessionRaw,
  writeVaultV2SessionRaw,
} from "@/lib/dashboard/vault-v2/profile-persist";
import { VAULT_V2_SESSION_STORAGE_KEY } from "@/lib/dashboard/vault-v2/vault-v2-profile-storage";
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
  vaultV2Session: string | null;
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
    vaultV2Session: readVaultV2SessionRaw(VAULT_V2_SESSION_STORAGE_KEY),
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
    return JSON.parse(raw) as GhostProgressSnapshot;
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
  if (snapshot.vaultV2Session !== null) {
    writeVaultV2SessionRaw(VAULT_V2_SESSION_STORAGE_KEY, snapshot.vaultV2Session);
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
