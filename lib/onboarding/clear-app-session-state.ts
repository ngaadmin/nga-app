import { ACADEMY_PROGRESS_STORAGE_KEY } from "@/lib/dashboard/academy-progress-storage";
import { DASHBOARD_WALLET_STORAGE_KEY } from "@/lib/dashboard/dashboard-wallet-storage";
import { CURRENCY_PREFERENCE_STORAGE_KEY } from "@/lib/dashboard/currency/currency-storage";
import { PARENT_PIN_STORAGE_KEY } from "@/lib/dashboard/parent-pin";
import { TESTING_PREMIUM_STORAGE_KEY } from "@/lib/dashboard/testing-premium";
import { TESTING_SETTINGS_VIEW_STORAGE_KEY } from "@/lib/dashboard/testing-settings-view";
import { VAULT_SKILL_PROGRESS_STORAGE_KEY } from "@/lib/dashboard/vault-skill-progress-storage";
import { VAULT_PROFILE_STORAGE_KEY, VAULT_SESSION_STORAGE_KEY } from "@/lib/dashboard/vault/vault-profile-storage";
import { GUEST_SESSION_STORAGE_KEY, readUserSession } from "@/lib/onboarding/guest-session";
import { GENERIC_PROFILE_POOL_STORAGE_KEY } from "@/lib/onboarding/generic-profile-id";
import { GUEST_PROGRESS_SNAPSHOT_KEY } from "@/lib/onboarding/guest-progress-snapshot";
import {
  ACCOUNT_PROGRESS_CACHE_KEY,
  persistAccountProgressCacheFromLive,
} from "@/lib/dashboard/account-progress-local";
import { EXPLORER_PENDING_PLAY_OK_KEY } from "@/lib/onboarding/explorer-pending-consent";
import { PENDING_PARENT_CONSENT_KEY } from "@/lib/onboarding/parent-consent-pending";
import { REGISTERED_ACCOUNTS_STORAGE_KEY } from "@/lib/onboarding/registered-accounts";
import { clearAllPersistedNgaKeys, removePersisted } from "@/lib/dev/client-persist";

/** All sessionStorage keys written by the guest-phase app shell. */
export const APP_SESSION_STORAGE_KEYS = [
  GUEST_SESSION_STORAGE_KEY,
  "nga_ghost_session", // legacy guest session key
  GENERIC_PROFILE_POOL_STORAGE_KEY,
  GUEST_PROGRESS_SNAPSHOT_KEY,
  PENDING_PARENT_CONSENT_KEY,
  EXPLORER_PENDING_PLAY_OK_KEY,
  DASHBOARD_WALLET_STORAGE_KEY,
  CURRENCY_PREFERENCE_STORAGE_KEY,
  ACADEMY_PROGRESS_STORAGE_KEY,
  VAULT_SKILL_PROGRESS_STORAGE_KEY,
  VAULT_SESSION_STORAGE_KEY,
  VAULT_PROFILE_STORAGE_KEY,
  PARENT_PIN_STORAGE_KEY,
  TESTING_PREMIUM_STORAGE_KEY,
  TESTING_SETTINGS_VIEW_STORAGE_KEY,
] as const;

/** Keys that must survive logout so returning users can log back in. */
const PRESERVED_ON_LOGOUT_KEYS = [
  REGISTERED_ACCOUNTS_STORAGE_KEY,
  ACCOUNT_PROGRESS_CACHE_KEY,
] as const;

/** Removes active session artifacts while preserving durable registered accounts. */
export function clearAllAppSessionState(): void {
  if (typeof window === "undefined") return;

  const session = readUserSession();
  if (session?.accessMode === "registered") {
    persistAccountProgressCacheFromLive({
      userId: session.supabaseUserId,
      username: session.username,
    });
  }

  for (const key of APP_SESSION_STORAGE_KEYS) {
    removePersisted(key);
    window.localStorage.removeItem(key);
  }

  clearAllPersistedNgaKeys([...PRESERVED_ON_LOGOUT_KEYS]);
}
