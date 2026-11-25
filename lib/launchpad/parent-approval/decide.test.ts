import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

type Row = Record<string, unknown>;
const db = vi.hoisted(() => ({
  userId: null as string | null,
  tables: {} as Record<string, Row[]>,
  updates: [] as Row[],
  inserts: [] as Row[],
}));

function query(table: string) {
  const filters: Array<[string, unknown]> = [];
  const api = {
    select: () => api,
    eq: (col: string, val: unknown) => {
      filters.push([col, val]);
      return api;
    },
    maybeSingle: async () => ({
      data: (db.tables[table] ?? []).find((r) => filters.every(([c, v]) => r[c] === v)) ?? null,
    }),
    update: (patch: Row) => ({
      eq: async () => {
        db.updates.push(patch);
        return { error: null };
      },
    }),
    insert: async (row: Row) => {
      db.inserts.push(row);
      return { error: null };
    },
  };
  return api;
}

vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => ({ from: query }) }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: db.userId ? { id: db.userId } : null } }) },
  }),
}));
vi.mock("@/lib/launchpad/venture-test/launchpad-home-data", () => ({ liveVentureIds: () => ["dog-walking"] }));

import { decideLaunchpadApproval } from "@/lib/launchpad/parent-approval/server";
import { signParentTabGatePass } from "@/lib/parent/parent-tab-gate-pass";

/** The Parent Hub gate pass the server signs after the Parent PIN, for the signed-in user. */
function hubPass(userId: string | null = db.userId): string {
  return userId ? signParentTabGatePass(userId) : "";
}

const T1 = "2026-11-18T10:00:00.000Z";

beforeEach(() => {
  vi.stubEnv("NGA_TOKEN_SECRET", "decide-test-secret");
  db.userId = "parent-1";
  db.updates = [];
  db.inserts = [];
  db.tables = {
    profiles: [
      { id: "parent-1", account_role: "parent_master" },
      { id: "other-parent", account_role: "parent_master" },
      { id: "kid-1", account_role: "child" },
    ],
    parent_child: [{ id: "l1", parent_id: "parent-1", child_id: "kid-1" }],
    launchpad_learner_ventures: [
      { id: "v1", user_id: "kid-1", venture_id: "dog-walking", wrap_up_confirmed_at: { "parent-approval-requested": T1 } },
    ],
  };
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("decideLaunchpadApproval (Hub PIN pass, parent link checked)", () => {
  it("lets the linked parent approve in one call", async () => {
    const result = await decideLaunchpadApproval("kid-1", "dog-walking", "yes", hubPass());
    expect(result).toEqual({ ok: true, status: "approved" });
    expect(db.updates).toHaveLength(1);
    expect(db.updates[0]!.wrap_up_confirmed_at).toMatchObject({ "parent-approval-yes": expect.any(String) });
  });

  it("lets the linked parent say not now", async () => {
    expect(await decideLaunchpadApproval("kid-1", "dog-walking", "no", hubPass())).toEqual({ ok: true, status: "declined" });
  });

  it("refuses someone who is not signed in", async () => {
    db.userId = null;
    const result = await decideLaunchpadApproval("kid-1", "dog-walking", "yes", hubPass());
    expect(result.ok).toBe(false);
    expect(db.updates).toHaveLength(0);
  });

  it("refuses a parent who is not linked to that learner", async () => {
    db.userId = "other-parent";
    const result = await decideLaunchpadApproval("kid-1", "dog-walking", "yes", hubPass());
    expect(result).toMatchObject({ ok: false });
    expect(db.updates).toHaveLength(0);
  });

  it("refuses a learner answering for themselves", async () => {
    db.userId = "kid-1";
    const result = await decideLaunchpadApproval("kid-1", "dog-walking", "yes", hubPass());
    expect(result).toMatchObject({ ok: false });
    expect(db.updates).toHaveLength(0);
  });

  it("refuses when there is no request to answer", async () => {
    db.tables.launchpad_learner_ventures = [];
    const result = await decideLaunchpadApproval("kid-1", "dog-walking", "yes", hubPass());
    expect(result).toMatchObject({ ok: false });
    expect(db.updates).toHaveLength(0);
    expect(db.inserts).toHaveLength(0);
  });
});

describe("decideLaunchpadApproval self-approve lock", () => {
  it("refuses a learner approving their own stop, even holding a signed pass for their own id", async () => {
    db.userId = "kid-1";
    const result = await decideLaunchpadApproval("kid-1", "dog-walking", "yes", signParentTabGatePass("kid-1"));
    expect(result).toMatchObject({ ok: false });
    expect(db.updates).toHaveLength(0);
    expect(db.inserts).toHaveLength(0);
  });

  it("refuses the linked parent's session without the Parent PIN pass", async () => {
    const result = await decideLaunchpadApproval("kid-1", "dog-walking", "yes", "");
    expect(result).toMatchObject({ ok: false });
    expect(db.updates).toHaveLength(0);
  });

  it("refuses a pass signed for someone else, or a forged or expired pass", async () => {
    for (const pass of [
      signParentTabGatePass("kid-1"),
      signParentTabGatePass("parent-1").replace(/.$/, "x"),
      signParentTabGatePass("parent-1", Date.now() - 60 * 60 * 1000),
    ]) {
      const result = await decideLaunchpadApproval("kid-1", "dog-walking", "yes", pass);
      expect(result).toMatchObject({ ok: false });
    }
    expect(db.updates).toHaveLength(0);
  });

  it("still lets the linked parent with the Hub pass approve", async () => {
    const result = await decideLaunchpadApproval("kid-1", "dog-walking", "yes", hubPass("parent-1"));
    expect(result).toEqual({ ok: true, status: "approved" });
    expect(db.updates[0]!.wrap_up_confirmed_at).toMatchObject({ "parent-approval-yes": expect.any(String) });
  });
});
