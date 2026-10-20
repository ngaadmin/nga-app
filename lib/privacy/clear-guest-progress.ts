/**
 * Guest "Clear this device's progress".
 * Removes lessons, coins, lifetime XP, medals and Vault from this device.
 * The guest session itself stays, so the username is still on screen.
 */

export const GUEST_PROGRESS_STORAGE_KEYS = [
  "nga_guest_progress_snapshot_v1",
  "nga_dashboard_wallet_v2",
  "nga_academy_progress_v1",
  "nga_vault_skill_progress_v1",
  "nga_vault_session_v1",
  "nga_vault_v2_session_v1",
  "nga_vault_profile_v1",
  "nga_learning_streak_v1",
  "nga_account_progress_by_user_v1",
] as const;

const GUEST_SESSION_KEY = "nga_guest_session";

type KeyStore = {
  removeItem(key: string): void;
};

export function clearGuestProgressFromStores(...stores: KeyStore[]): void {
  for (const store of stores) {
    for (const key of GUEST_PROGRESS_STORAGE_KEYS) {
      store.removeItem(key);
    }
  }
}

export function guestProgressClearKeepsSession(): boolean {
  return !(GUEST_PROGRESS_STORAGE_KEYS as readonly string[]).includes(
    GUEST_SESSION_KEY,
  );
}
