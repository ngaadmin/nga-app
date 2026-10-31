/**
 * Parent tab PIN: shared rules. The PIN itself lives on the server in
 * public.parent_tab_pins (service role only) and is checked by the server
 * actions in parent-tab-pin-server.ts. Nothing about it is kept on the
 * device, so clearing site data never resets the PIN or the lockout.
 *
 * This PIN is separate from profiles.parent_pin_hash (the "My child's data"
 * PIN). It never gates switching into the parent profile; it gates the
 * Parent tab and every approval or decline.
 */

export const PARENT_TAB_PIN_ITERATIONS = 150_000;
export const PARENT_TAB_PIN_MAX_TRIES = 5;
export const PARENT_TAB_PIN_LOCKOUT_MS = 5 * 60 * 1000;

export function isParentTabPin(value: string): boolean {
  return /^\d{4}$/.test(value);
}

export type ParentTabPinCounters = {
  failedTries: number;
  /** Epoch ms, or null when not locked. */
  lockedUntil: number | null;
};

/** Locked right now? An expired lock counts as unlocked. */
export function parentTabPinLockActive(
  counters: ParentTabPinCounters,
  now: number,
): boolean {
  return Boolean(counters.lockedUntil && counters.lockedUntil > now);
}

/**
 * Counters after one check. A match clears everything. A miss adds a try;
 * the 5th miss starts a 5-minute lock. A lock that has run out starts over.
 */
export function nextParentTabPinCounters(
  counters: ParentTabPinCounters,
  matched: boolean,
  now: number,
): ParentTabPinCounters {
  if (matched) return { failedTries: 0, lockedUntil: null };
  const expired = counters.lockedUntil !== null && counters.lockedUntil <= now;
  const tries = (expired ? 0 : counters.failedTries) + 1;
  if (tries >= PARENT_TAB_PIN_MAX_TRIES) {
    return {
      failedTries: PARENT_TAB_PIN_MAX_TRIES,
      lockedUntil: now + PARENT_TAB_PIN_LOCKOUT_MS,
    };
  }
  return { failedTries: tries, lockedUntil: null };
}

export type ParentTabPinCheck =
  | { ok: true; pass: string }
  | {
      ok: false;
      reason: "missing" | "wrong" | "locked" | "error";
      error: string;
      triesLeft: number;
      lockedUntil: number | null;
    };
