import { beforeEach, describe, expect, it, vi } from "vitest";
import { hashCredential } from "@/lib/auth/credential-hash";

vi.mock("server-only", () => ({}));

type Row = { parent_id: string; failed_tries: number; locked_until: string | null };
const db = vi.hoisted(() => ({
  rows: new Map<string, Row>(),
  missing: false,
}));

const MISSING = {
  code: "PGRST205",
  message: "Could not find the table 'public.parent_pin_lockouts' in the schema cache",
};

function table(name: string) {
  if (name !== "parent_pin_lockouts") throw new Error(`unexpected table ${name}`);
  let mode: "select" | "update" | "delete" = "select";
  let values: Partial<Row> = {};
  const filters: Record<string, unknown> = {};
  const nulls: string[] = [];
  const matches = (row: Row) =>
    Object.entries(filters).every(([key, value]) => (row as Record<string, unknown>)[key] === value) &&
    nulls.every((key) => (row as Record<string, unknown>)[key] === null);
  const run = () => {
    if (db.missing) return { data: null, error: MISSING };
    const id = filters.parent_id as string;
    const row = db.rows.get(id);
    if (mode === "delete") {
      db.rows.delete(id);
      return { data: null, error: null };
    }
    if (mode === "update") {
      if (!row || !matches(row)) return { data: [], error: null };
      db.rows.set(id, { ...row, ...values });
      return { data: [{ parent_id: id }], error: null };
    }
    return { data: row ?? null, error: null };
  };
  const chain: Record<string, unknown> = {
    select: () => chain,
    update: (next: Partial<Row>) => {
      mode = "update";
      values = next;
      return chain;
    },
    delete: () => {
      mode = "delete";
      return chain;
    },
    insert: async (row: Row) => {
      if (db.missing) return { error: MISSING };
      if (db.rows.has(row.parent_id)) return { error: { code: "23505", message: "duplicate" } };
      db.rows.set(row.parent_id, row);
      return { error: null };
    },
    eq: (key: string, value: unknown) => {
      filters[key] = value;
      return chain;
    },
    is: (key: string) => {
      nulls.push(key);
      return chain;
    },
    maybeSingle: async () => run(),
    then: (onFulfilled: (value: unknown) => unknown) => Promise.resolve(run()).then(onFulfilled),
  };
  return chain;
}

vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => ({ from: table }) }));

import {
  checkParentPinWithLockout,
  clearParentPinLockout,
  readParentPinLock,
  resetParentPinLockoutMemoryForTests,
} from "@/lib/parent/parent-pin-lockout";

const COPY = { missing: "missing", format: "format", wrong: "wrong", locked: "locked" };
const HASH = hashCredential("2468");
const T0 = Date.parse("2026-11-03T10:00:00Z");

function check(pin: string, now: number, parentId = "parent-1") {
  return checkParentPinWithLockout({ parentId, pin, storedHash: HASH, copy: COPY, now });
}

beforeEach(() => {
  db.rows.clear();
  db.missing = false;
  resetParentPinLockoutMemoryForTests();
});

describe.each([
  ["database table", false],
  ["missing table (fails safe in memory)", true],
])("Parent PIN lockout with the %s", (_label, missing) => {
  beforeEach(() => {
    db.missing = missing;
  });

  it("locks for 5 minutes after 5 wrong tries, and refuses even the right PIN while locked", async () => {
    for (let i = 1; i <= 4; i += 1) {
      const miss = await check("0000", T0 + i);
      expect(miss).toMatchObject({ ok: false, reason: "wrong", triesLeft: 5 - i });
    }
    const fifth = await check("0000", T0 + 5);
    expect(fifth).toMatchObject({ ok: false, reason: "locked", triesLeft: 0 });
    expect(fifth.ok ? 0 : fifth.lockedUntil).toBe(T0 + 5 + 5 * 60 * 1000);

    expect(await check("2468", T0 + 60_000)).toMatchObject({ ok: false, reason: "locked" });
    expect((await readParentPinLock("parent-1", T0 + 60_000)).locked).toBe(true);

    expect(await check("2468", T0 + 5 + 5 * 60 * 1000 + 1)).toEqual({ ok: true });
    expect((await readParentPinLock("parent-1", T0 + 6 * 60 * 1000)).failedTries).toBe(0);
  });

  it("a correct PIN clears earlier misses", async () => {
    await check("0000", T0);
    await check("0000", T0 + 1);
    expect(await check("2468", T0 + 2)).toEqual({ ok: true });
    expect(await check("0000", T0 + 3)).toMatchObject({ triesLeft: 4 });
  });

  it("a reset clears the lock", async () => {
    for (let i = 0; i < 5; i += 1) await check("0000", T0 + i);
    await clearParentPinLockout("parent-1");
    expect(await check("2468", T0 + 10)).toEqual({ ok: true });
  });
});

it("stores the counters in public.parent_pin_lockouts when the table exists", async () => {
  await check("0000", T0);
  expect(db.rows.get("parent-1")).toMatchObject({ failed_tries: 1, locked_until: null });
  for (let i = 1; i < 5; i += 1) await check("0000", T0 + i);
  expect(db.rows.get("parent-1")?.locked_until).toBe(new Date(T0 + 4 + 5 * 60 * 1000).toISOString());
});

it("keeps each parent's count separate", async () => {
  for (let i = 0; i < 5; i += 1) await check("0000", T0 + i, "parent-1");
  expect(await check("2468", T0 + 10, "parent-2")).toEqual({ ok: true });
});
