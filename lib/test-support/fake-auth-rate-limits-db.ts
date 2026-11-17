/**
 * In-memory stand-in for public.auth_rate_limits behind the Supabase admin
 * client, for rate-limit tests. Supports the calls shared-rate-limit.ts makes.
 */
export type FakeRateLimitRow = {
  key_hash: string;
  hit_count: number;
  window_reset_at: string;
};

export const fakeRateLimitDb = {
  rows: new Map<string, FakeRateLimitRow>(),
  missing: false,
  tables: [] as string[],
  reset() {
    this.rows.clear();
    this.missing = false;
    this.tables = [];
  },
};

export const MISSING_TABLE_ERROR = {
  code: "PGRST205",
  message: "Could not find the table 'public.auth_rate_limits' in the schema cache",
};

export function fakeRateLimitTable(name: string) {
  const db = fakeRateLimitDb;
  db.tables.push(name);
  let mode: "select" | "update" | "delete" = "select";
  let values: Partial<FakeRateLimitRow> = {};
  const filters: Record<string, unknown> = {};
  let before: { column: string; value: string } | null = null;
  const matches = (row: FakeRateLimitRow) =>
    Object.entries(filters).every(
      ([k, v]) => (row as Record<string, unknown>)[k] === v,
    );
  const run = () => {
    if (db.missing) return { data: null, count: null, error: MISSING_TABLE_ERROR };
    if (mode === "delete") {
      let count = 0;
      for (const [key, row] of db.rows) {
        const value = (row as Record<string, unknown>)[before?.column ?? ""];
        if (before && typeof value === "string" && Date.parse(value) < Date.parse(before.value)) {
          db.rows.delete(key);
          count += 1;
        }
      }
      return { data: null, count, error: null };
    }
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
    lt: (column: string, value: string) => {
      before = { column, value };
      return builder;
    },
    maybeSingle: async () => run(),
    update: (v: Partial<FakeRateLimitRow>) => {
      mode = "update";
      values = v;
      return builder;
    },
    delete: () => {
      mode = "delete";
      return builder;
    },
    insert: async (row: FakeRateLimitRow) => {
      if (db.missing) return { error: MISSING_TABLE_ERROR };
      if (db.rows.has(row.key_hash)) return { error: { code: "23505", message: "dup" } };
      db.rows.set(row.key_hash, { ...row });
      return { error: null };
    },
    then: (resolve: (v: unknown) => void) => resolve(run()),
  };
  return builder;
}

export const fakeRateLimitAdmin = { from: fakeRateLimitTable };
