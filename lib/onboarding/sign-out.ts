import { persistRegisteredProgressNow } from "@/lib/dashboard/account-progress-sync";
import { clearDashboardWalletState } from "@/lib/dashboard/dashboard-wallet-storage";
import { clearAllAppSessionState } from "@/lib/onboarding/clear-app-session-state";
import { ONBOARDING_ENTRY_PATH } from "@/lib/onboarding/guest-session";
import { dispatchUserSessionUpdated } from "@/lib/onboarding/user-session-events";
import { createClient } from "@/lib/supabase/client";

const SIGN_OUT_STEP_TIMEOUT_MS = 2500;

function clearSupabaseBrowserStorage() {
  if (typeof window === "undefined") return;

  const stores = [window.localStorage, window.sessionStorage];
  for (const store of stores) {
    const keys: string[] = [];
    for (let index = 0; index < store.length; index += 1) {
      const key = store.key(index);
      if (!key) continue;
      const lower = key.toLowerCase();
      if (lower.startsWith("sb-") || lower.includes("supabase")) {
        keys.push(key);
      }
    }
    for (const key of keys) store.removeItem(key);
  }
}

function withTimeout(work: Promise<unknown>, ms: number): Promise<void> {
  return new Promise((resolve) => {
    const timer = window.setTimeout(resolve, ms);
    void work
      .catch(() => undefined)
      .finally(() => {
        window.clearTimeout(timer);
        resolve();
      });
  });
}

function wipeLocalSignOutState(): void {
  clearSupabaseBrowserStorage();
  clearAllAppSessionState();
  clearDashboardWalletState();
  dispatchUserSessionUpdated();
}

/**
 * Fully leave the app: save progress, drop the Supabase Auth cookies, and
 * wipe in-browser session state so refresh / `/` cannot restore the user.
 */
export async function signOutApp(): Promise<void> {
  await withTimeout(persistRegisteredProgressNow(), SIGN_OUT_STEP_TIMEOUT_MS);

  await withTimeout(
    (async () => {
      const supabase = createClient();
      await supabase.auth.signOut();
    })(),
    SIGN_OUT_STEP_TIMEOUT_MS,
  );

  await withTimeout(
    fetch("/api/auth/sign-out", {
      method: "POST",
      credentials: "same-origin",
      cache: "no-store",
      signal: AbortSignal.timeout(SIGN_OUT_STEP_TIMEOUT_MS),
    }),
    SIGN_OUT_STEP_TIMEOUT_MS,
  );

  wipeLocalSignOutState();
}

/** Always leave Settings / the dashboard after local sign-out state is cleared. */
export function redirectToHomeAfterSignOut(): void {
  if (typeof window === "undefined") return;
  window.location.replace(ONBOARDING_ENTRY_PATH);
}
