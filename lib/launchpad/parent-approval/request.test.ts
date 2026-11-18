import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/server", () => ({ after: (task: () => Promise<void>) => void task() }));

type Row = Record<string, unknown>;
const db = vi.hoisted(() => ({
  userId: null as string | null,
  tables: {} as Record<string, Row[]>,
  emailCalls: [] as Array<{ learnerId: string; ventureId: string; kind: string }>,
}));

function query(table: string) {
  const filters: Array<[string, unknown]> = [];
  let patch: Row | null = null;
  const api: Record<string, unknown> = {
    select: () => api,
    eq: (col: string, val: unknown) => (filters.push([col, val]), api),
    maybeSingle: async () => ({
      data: (db.tables[table] ?? []).find((r) => filters.every(([c, v]) => r[c] === v)) ?? null,
    }),
    update: (p: Row) => ((patch = p), api),
    insert: async (row: Row) => {
      (db.tables[table] ??= []).push({ id: `new-${(db.tables[table] ?? []).length}`, ...row });
      return { error: null };
    },
    then: (resolve: (v: unknown) => unknown) => {
      const rows = (db.tables[table] ?? []).filter((r) => filters.every(([c, v]) => r[c] === v));
      if (patch) rows.forEach((r) => Object.assign(r, patch));
      return Promise.resolve({ error: null }).then(resolve);
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
vi.mock("@/lib/launchpad/venture-test/launchpad-home-data", () => ({
  liveVentureIds: () => ["dog-walking"],
  LAUNCHPAD_CATEGORIES: [],
}));
vi.mock("@/lib/launchpad/parent-approval/email", () => ({
  sendLaunchpadApprovalEmail: async (_admin: unknown, input: { learnerId: string; ventureId: string; kind: string }) => {
    db.emailCalls.push(input);
    return "sent";
  },
}));

import { loadLaunchpadApprovalGate, requestLaunchpadParentApproval } from "@/lib/launchpad/parent-approval/server";

const ADULT = { parent_approval_required: false, age_checked_at: "2026-11-01T00:00:00.000Z" };

function learner(id: string, age: Row = { parent_approval_required: true, age_checked_at: "2026-11-01T00:00:00.000Z" }) {
  return { id, account_role: "child", account_status: "active", ...age };
}

beforeEach(() => {
  db.userId = "kid-under";
  db.emailCalls = [];
  db.tables = {
    profiles: [
      learner("kid-under"),
      learner("kid-16", ADULT),
      learner("kid-unlinked"),
      learner("kid-unknown-age", { parent_approval_required: null, age_checked_at: null }),
    ],
    parent_child: [
      { parent_id: "p1", child_id: "kid-under" },
      { parent_id: "p1", child_id: "kid-16" },
      { parent_id: "p1", child_id: "kid-unknown-age" },
    ],
    launchpad_learner_ventures: [],
  };
});

describe("requesting approval at the Level 4 stop", () => {
  it("an under-16 learner stops, the request is saved and the email is sent once", async () => {
    expect(await loadLaunchpadApprovalGate("dog-walking")).toEqual({ applies: true, status: "none" });
    expect(await requestLaunchpadParentApproval("dog-walking")).toEqual({ applies: true, status: "pending" });
    expect(db.emailCalls).toEqual([{ learnerId: "kid-under", ventureId: "dog-walking", kind: "request" }]);
    expect(Object.keys((db.tables.launchpad_learner_ventures ?? [])[0]?.wrap_up_confirmed_at as Row)).toContain("parent-approval-requested");
    // Coming back to the stop never asks again.
    await requestLaunchpadParentApproval("dog-walking");
    expect(db.emailCalls).toHaveLength(1);
  });

  it("a learner who was 16 or over at sign-up skips the stop: no gate, no request, no email", async () => {
    db.userId = "kid-16";
    expect((await loadLaunchpadApprovalGate("dog-walking")).applies).toBe(false);
    expect((await requestLaunchpadParentApproval("dog-walking")).applies).toBe(false);
    expect(db.emailCalls).toHaveLength(0);
    expect(db.tables.launchpad_learner_ventures).toHaveLength(0);
  });

  it("a learner with no recorded age stays gated", async () => {
    db.userId = "kid-unknown-age";
    expect(await loadLaunchpadApprovalGate("dog-walking")).toEqual({ applies: true, status: "none" });
  });

  it("an unlinked learner fails closed: waiting screen, nothing saved, no email", async () => {
    db.userId = "kid-unlinked";
    expect(await loadLaunchpadApprovalGate("dog-walking")).toEqual({ applies: true, status: "pending" });
    expect(await requestLaunchpadParentApproval("dog-walking")).toEqual({ applies: true, status: "pending" });
    expect(db.emailCalls).toHaveLength(0);
    expect(db.tables.launchpad_learner_ventures).toHaveLength(0);
  });

  it("a guest is not gated", async () => {
    db.userId = null;
    expect((await loadLaunchpadApprovalGate("dog-walking")).applies).toBe(false);
    expect(db.emailCalls).toHaveLength(0);
  });
});
