import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

type Row = { key_hash: string; hit_count: number; window_reset_at: string };
const db = vi.hoisted(() => ({
  rows: new Map<string, Row>(),
  missing: false,
  tables: [] as string[],
}));

const MISSING = {
  code: "PGRST205",
  message: "Could not find the table 'public.auth_rate_limits' in the schema cache",
};

function table(name: string) {
  db.tables.push(name);
  let mode: "select" | "update" = "select";
  let values: Partial<Row> = {};
  const filters: Record<string, unknown> = {};
  const matches = (row: Row) =>
    Object.entries(filters).every(([k, v]) => (row as Record<string, unknown>)[k] === v);
  const run = () => {
    if (db.missing) return { data: null, error: MISSING };
    const row = db.rows.get(filters.key_hash as string);
    if (mode === "update") {
      if (!row || !matches(row)) return { data: [], error: null };
      Object.assign(row, values);
      return { data: [{ key_hash: row.key_hash }], error: null };
    }
    return { data: row ? { ...row } : null, error: null };
  };
  const builder = {
    select: () => builder,
    eq: (k: string, v: unknown) => {
      filters[k] = v;
      return builder;
    },
    is: (k: string, v: unknown) => {
      filters[k] = v;
      return builder;
    },
    maybeSingle: async () => run(),
    update: (v: Partial<Row>) => {
      mode = "update";
      values = v;
      return builder;
    },
    insert: async (row: Row) => {
      if (db.missing) return { error: MISSING };
      if (db.rows.has(row.key_hash)) return { error: { code: "23505", message: "dup" } };
      db.rows.set(row.key_hash, { ...row });
      return { error: null };
    },
    then: (resolve: (v: unknown) => void) => resolve(run()),
  };
  return builder;
}

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ from: table }),
}));

import { consumeSharedRateLimit, sharedRateLimitKeyHash } from "@/lib/auth/shared-rate-limit";

beforeEach(() => {
  db.rows.clear();
  db.missing = false;
  db.tables = [];
});

describe("consumeSharedRateLimit", () => {
  it("allows up to the limit, then refuses until the window ends", async () => {
    const now = 1_000_000;
    for (let i = 0; i < 3; i += 1) {
      const r = await consumeSharedRateLimit("sign-in:ip:1.2.3.4", 3, 60_000, now);
      expect(r).toMatchObject({ allowed: true, source: "db" });
    }
    const blocked = await consumeSharedRateLimit("sign-in:ip:1.2.3.4", 3, 60_000, now + 1_000);
    expect(blocked).toEqual({ allowed: false, retryAfterMs: 59_000, source: "db" });

    const later = await consumeSharedRateLimit("sign-in:ip:1.2.3.4", 3, 60_000, now + 60_000);
    expect(later).toMatchObject({ allowed: true, source: "db" });
    expect(db.tables.every((t) => t === "auth_rate_limits")).toBe(true);
  });

  it("keeps separate counts per key", async () => {
    await consumeSharedRateLimit("a", 1, 60_000, 0);
    expect((await consumeSharedRateLimit("a", 1, 60_000, 1)).allowed).toBe(false);
    expect((await consumeSharedRateLimit("b", 1, 60_000, 1)).allowed).toBe(true);
  });

  it("stores only a hash of the key, never the IP or email", async () => {
    await consumeSharedRateLimit("consent-resend:email:parent@example.com", 3, 60_000, 0);
    const [stored] = [...db.rows.keys()];
    expect(stored).toBe(sharedRateLimitKeyHash("consent-resend:email:parent@example.com"));
    expect(stored).toMatch(/^[0-9a-f]{64}$/);
    expect(JSON.stringify([...db.rows.values()])).not.toContain("example.com");
  });

  it("falls back to the in-memory limit when the table is missing", async () => {
    db.missing = true;
    const key = `fallback-${Math.random()}`;
    expect(await consumeSharedRateLimit(key, 2, 60_000)).toMatchObject({ allowed: true, source: "memory" });
    expect(await consumeSharedRateLimit(key, 2, 60_000)).toMatchObject({ allowed: true, source: "memory" });
    expect(await consumeSharedRateLimit(key, 2, 60_000)).toMatchObject({ allowed: false, source: "memory" });
  });
});
