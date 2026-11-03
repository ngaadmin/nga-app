import "server-only";

import {
  PARENT_TAB_PIN_MAX_TRIES,
  nextParentTabPinCounters,
  parentTabPinLockActive,
  type ParentTabPinCounters,
} from "@/lib/parent/parent-tab-pin";
import { verifyCredential } from "@/lib/auth/credential-hash";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Wrong-PIN lockout for the one Parent PIN: 5 wrong tries, then a 5-minute
 * lock. Stored in public.parent_pin_lockouts so it holds across every server
 * instance. Fails safe: if the table is missing (migration not applied yet)
 * or the database can't be reached, the same 5 tries / 5 minutes rule runs in
 * memory on this instance instead, so a PIN is never checked without a limit.
 */

const TABLE = "parent_pin_lockouts";

type LockRow = { failed_tries: number | null; locked_until: string | null };

export type ParentPinLockState = ParentTabPinCounters & {
  /** "db" when read from the table, "memory" when on the fallback. */
  source: "db" | "memory";
};

const memory = new Map<string, ParentTabPinCounters>();

/** Test hook: forget the in-memory fallback counters. */
export function resetParentPinLockoutMemoryForTests(): void {
  memory.clear();
}

function fromRow(row: LockRow | null): ParentTabPinCounters {
  if (!row) return { failedTries: 0, lockedUntil: null };
  const ms = row.locked_until ? Date.parse(row.locked_until) : NaN;
  return {
    failedTries: Math.max(0, Math.min(PARENT_TAB_PIN_MAX_TRIES, Number(row.failed_tries) || 0)),
    lockedUntil: Number.isFinite(ms) ? ms : null,
  };
}

function memoryState(parentId: string): ParentPinLockState {
  return { ...(memory.get(parentId) ?? { failedTries: 0, lockedUntil: null }), source: "memory" };
}

function admin() {
  return createAdminClient();
}

async function readRow(parentId: string): Promise<LockRow | null> {
  const { data, error } = await admin()
    .from(TABLE)
    .select("failed_tries, locked_until")
    .eq("parent_id", parentId)
    .maybeSingle();
  if (error) throw error;
  return (data as LockRow | null) ?? null;
}

/** Current lock state. An expired lock reads as unlocked. */
export async function readParentPinLock(
  parentId: string,
  now: number = Date.now(),
): Promise<ParentPinLockState & { locked: boolean }> {
  let state: ParentPinLockState;
  try {
    state = { ...fromRow(await readRow(parentId)), source: "db" };
  } catch {
    state = memoryState(parentId);
  }
  return { ...state, locked: parentTabPinLockActive(state, now) };
}

/**
 * Records one wrong PIN. Returns the new counters: the 5th miss in a row
 * sets lockedUntil 5 minutes ahead.
 */
export async function recordParentPinMiss(
  parentId: string,
  now: number = Date.now(),
): Promise<ParentPinLockState> {
  try {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const row = await readRow(parentId);
      const next = nextParentTabPinCounters(fromRow(row), false, now);
      const values = {
        failed_tries: next.failedTries,
        locked_until: next.lockedUntil ? new Date(next.lockedUntil).toISOString() : null,
        updated_at: new Date(now).toISOString(),
      };
      if (!row) {
        const { error } = await admin()
          .from(TABLE)
          .insert({ parent_id: parentId, ...values });
        if (!error) return { ...next, source: "db" };
        if (error.code === "23505") continue; // Another instance inserted first.
        throw error;
      }
      // Only applies if nobody else changed the row since it was read.
      let update = admin()
        .from(TABLE)
        .update(values)
        .eq("parent_id", parentId)
        .eq("failed_tries", row.failed_tries ?? 0);
      update = row.locked_until
        ? update.eq("locked_until", row.locked_until)
        : update.is("locked_until", null);
      const { data, error } = await update.select("parent_id");
      if (error) throw error;
      if (Array.isArray(data) && data.length > 0) return { ...next, source: "db" };
    }
    throw new Error("parent_pin_lockouts: concurrent update");
  } catch {
    const next = nextParentTabPinCounters(memoryState(parentId), false, now);
    memory.set(parentId, next);
    return { ...next, source: "memory" };
  }
}

/** A correct PIN or a PIN reset clears the counters and any lock. */
export async function clearParentPinLockout(parentId: string): Promise<void> {
  memory.delete(parentId);
  try {
    const { error } = await admin().from(TABLE).delete().eq("parent_id", parentId);
    if (error) throw error;
  } catch {
    // Table missing or unreachable: the in-memory counters are already clear.
  }
}

/** Tries left before the lock starts (0 while locked). */
export function parentPinTriesLeft(state: ParentTabPinCounters, now: number = Date.now()): number {
  if (parentTabPinLockActive(state, now)) return 0;
  return Math.max(0, PARENT_TAB_PIN_MAX_TRIES - state.failedTries);
}

export type LockedParentPinCheck =
  | { ok: true }
  | {
      ok: false;
      reason: "missing" | "format" | "wrong" | "locked";
      error: string;
      lockedUntil: number | null;
      triesLeft: number;
    };

/**
 * Checks a Parent PIN against the stored hash with the shared lockout. A
 * locked parent is refused before the PIN is even compared. A wrong 4-digit
 * PIN counts as a miss; a correct one clears the counters.
 */
export async function checkParentPinWithLockout(input: {
  parentId: string;
  pin: unknown;
  storedHash: string | null | undefined;
  copy: { missing: string; format: string; wrong: string; locked: string };
  now?: number;
}): Promise<LockedParentPinCheck> {
  const now = input.now ?? Date.now();
  const hash = input.storedHash?.trim() ?? "";
  if (!hash) {
    return { ok: false, reason: "missing", error: input.copy.missing, lockedUntil: null, triesLeft: 0 };
  }
  const lock = await readParentPinLock(input.parentId, now);
  if (lock.locked) {
    return { ok: false, reason: "locked", error: input.copy.locked, lockedUntil: lock.lockedUntil, triesLeft: 0 };
  }
  if (typeof input.pin !== "string" || !/^\d{4}$/.test(input.pin)) {
    return { ok: false, reason: "format", error: input.copy.format, lockedUntil: null, triesLeft: parentPinTriesLeft(lock, now) };
  }
  if (!verifyCredential(input.pin, hash)) {
    const next = await recordParentPinMiss(input.parentId, now);
    const locked = parentTabPinLockActive(next, now);
    return {
      ok: false,
      reason: locked ? "locked" : "wrong",
      error: locked ? input.copy.locked : input.copy.wrong,
      lockedUntil: locked ? next.lockedUntil : null,
      triesLeft: parentPinTriesLeft(next, now),
    };
  }
  await clearParentPinLockout(input.parentId);
  return { ok: true };
}
