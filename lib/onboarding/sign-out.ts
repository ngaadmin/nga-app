import { persistRegisteredProgressNow } from "@/lib/dashboard/account-progress-sync";
import { clearAllAppSessionState } from "@/lib/onboarding/clear-app-session-state";
import { dispatchUserSessionUpdated } from "@/lib/onboarding/user-session-events";
import { createClient } from "@/lib/supabase/client";

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

/**
 * Fully leave the app: save progress, drop the Supabase Auth cookies, and
 * wipe in-browser session state so refresh / `/` cannot restore the user.
 */
export async function signOutApp(): Promise<void> {
  try {
    await persistRegisteredProgressNow();
  } catch {
    // Still sign out if the last save fails.
  }

  try {
    const supabase = createClient();
    await supabase.auth.signOut();
  } catch {
    // Server cookie deletion still needs to run.
  }

  try {
    await fetch("/api/auth/sign-out", {
      method: "POST",
      credentials: "same-origin",
      cache: "no-store",
    });
  } catch {
    // Local state still needs to be wiped.
  }

  clearSupabaseBrowserStorage();
  clearAllAppSessionState();
  dispatchUserSessionUpdated();
}
