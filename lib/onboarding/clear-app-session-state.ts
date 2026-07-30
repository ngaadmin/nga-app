import { ACADEMY_PROGRESS_STORAGE_KEY } from "@/lib/dashboard/academy-progress-storage";
import { DASHBOARD_WALLET_STORAGE_KEY } from "@/lib/dashboard/dashboard-wallet-storage";
import { CURRENCY_PREFERENCE_STORAGE_KEY } from "@/lib/dashboard/currency/currency-storage";
import { PARENT_PIN_STORAGE_KEY } from "@/lib/dashboard/parent-pin";
import { VAULT_SKILL_PROGRESS_STORAGE_KEY } from "@/lib/dashboard/vault-skill-progress-storage";
import { VAULT_V2_PROFILE_STORAGE_KEY, VAULT_V2_SESSION_STORAGE_KEY } from "@/lib/dashboard/vault-v2/vault-v2-profile-storage";
import { GHOST_SESSION_STORAGE_KEY } from "@/lib/onboarding/ghost-session";
import { GENERIC_PROFILE_POOL_STORAGE_KEY } from "@/lib/onboarding/generic-profile-id";
import { GHOST_PROGRESS_SNAPSHOT_KEY } from "@/lib/onboarding/ghost-progress-snapshot";
import { PENDING_PARENT_CONSENT_KEY } from "@/lib/onboarding/parent-consent-pending";

import { clearAllPersistedNgaKeys } from "@/lib/dev/client-persist";

/** All sessionStorage keys written by the ghost-phase app shell. */
export const APP_SESSION_STORAGE_KEYS = [
  GHOST_SESSION_STORAGE_KEY,
  GENERIC_PROFILE_POOL_STORAGE_KEY,
  GHOST_PROGRESS_SNAPSHOT_KEY,
  PENDING_PARENT_CONSENT_KEY,
  DASHBOARD_WALLET_STORAGE_KEY,
  CURRENCY_PREFERENCE_STORAGE_KEY,
  ACADEMY_PROGRESS_STORAGE_KEY,
  VAULT_SKILL_PROGRESS_STORAGE_KEY,
  VAULT_V2_SESSION_STORAGE_KEY,
  VAULT_V2_PROFILE_STORAGE_KEY,
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
