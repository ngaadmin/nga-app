import { useEffect, useState } from "react";
import { readPersisted, writePersisted } from "@/lib/dev/client-persist";

/** Testing-only premium unlock until billing is wired. */
export const TESTING_PREMIUM_STORAGE_KEY = "nga_testing_premium_unlocked";
export const TESTING_PREMIUM_UPDATED_EVENT = "nga:testing-premium-updated";

export function readTestingPremiumUnlocked(): boolean {
  return readPersisted(TESTING_PREMIUM_STORAGE_KEY) === "1";
}

export function unlockTestingPremium(): void {
  writePersisted(TESTING_PREMIUM_STORAGE_KEY, "1");
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(TESTING_PREMIUM_UPDATED_EVENT));
}

export function useTestingPremiumUnlocked(): boolean {
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    const sync = () => setUnlocked(readTestingPremiumUnlocked());
    sync();
    window.addEventListener(TESTING_PREMIUM_UPDATED_EVENT, sync);
    return () => window.removeEventListener(TESTING_PREMIUM_UPDATED_EVENT, sync);
  }, []);

  return unlocked;
}
