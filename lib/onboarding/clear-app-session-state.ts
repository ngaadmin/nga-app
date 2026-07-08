import { ACADEMY_PROGRESS_STORAGE_KEY } from "@/lib/dashboard/academy-progress-storage";
import { DASHBOARD_WALLET_STORAGE_KEY } from "@/lib/dashboard/dashboard-wallet-storage";
import { PARENT_PIN_STORAGE_KEY } from "@/lib/dashboard/parent-pin";
import { VAULT_SKILL_PROGRESS_STORAGE_KEY } from "@/lib/dashboard/vault-skill-progress-storage";
import { GHOST_SESSION_STORAGE_KEY } from "@/lib/onboarding/ghost-session";

import { clearAllPersistedNgaKeys } from "@/lib/dev/client-persist";

/** All sessionStorage keys written by the ghost-phase app shell. */
export const APP_SESSION_STORAGE_KEYS = [
  GHOST_SESSION_STORAGE_KEY,
  DASHBOARD_WALLET_STORAGE_KEY,
  ACADEMY_PROGRESS_STORAGE_KEY,
  VAULT_SKILL_PROGRESS_STORAGE_KEY,
  PARENT_PIN_STORAGE_KEY,
] as const;

/** Removes every persisted ghost-session artifact so onboarding runs from scratch. */
export function clearAllAppSessionState(): void {
  if (typeof window === "undefined") return;

  for (const key of APP_SESSION_STORAGE_KEYS) {
    window.sessionStorage.removeItem(key);
  }

  clearAllPersistedNgaKeys();
}
