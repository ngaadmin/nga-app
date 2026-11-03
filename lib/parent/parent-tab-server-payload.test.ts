import { beforeEach, describe, expect, it, vi } from "vitest";
import { WAITING_CHILD_KEYS } from "@/lib/parent/parent-hub-children";

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ cookies: async () => ({ set: () => {} }) }));

const PARENT = "parent-1";
const ACTIVE = "child-active";
const WAITING = "child-waiting";

const usageLookups: string[] = [];
const profileLookups: string[][] = [];

type Result = { data: unknown; error: null };

function builder(table: string) {
  let filters: Record<string, unknown> = {};
  const resolve = (): Result => {
    if (table === "parent_child") {
      return { data: [{ child_id: ACTIVE }, { child_id: WAITING }], error: null };
    }
    if (table === "usage_events") {
      usageLookups.push(String(filters.ilike));
      return { data: [{ lesson_number: 1 }, { lesson_number: 2 }], error: null };
    }
    if (table === "profiles" && filters.in) {
      profileLookups.push(filters.in as string[]);
      return {
        data: [
          { id: ACTIVE, username: "Zed", account_role: "child", account_status: "active", curriculum_cohort: "explorer" },
          { id: WAITING, username: "Amy", account_role: "child", account_status: "pending_consent", curriculum_cohort: "pathfinder" },
        ],
        error: null,
      };
    }
    return { data: null, error: null };
  };
  const chain: Record<string, unknown> = {
    select: () => chain,
    eq: () => chain,
    not: () => chain,
    limit: () => chain,
    in: (_column: string, values: string[]) => {
      filters = { ...filters, in: values };
      return chain;
    },
    ilike: (_column: string, value: string) => {
      filters = { ...filters, ilike: value };
      return chain;
    },
    maybeSingle: async () =>
      table === "profiles"
        ? { data: { id: PARENT, username: "Pat", account_role: "parent_master" }, error: null }
        : { data: null, error: null },
    then: (onFulfilled: (value: Result) => unknown) => Promise.resolve(resolve()).then(onFulfilled),
  };
  return chain;
}

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ from: (table: string) => builder(table) }),
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: { id: PARENT, email: "p@example.com" } } }) },
  }),
}));

const readPayloads = vi.fn(async (ids: string[]) => {
  const map = new Map<string, unknown>();
  for (const id of ids) {
    map.set(id, { wallet: { balance: 99 }, lessons: { done: [1, 2, 3] } });
  }
  return map;
});
vi.mock("@/lib/onboarding/learner-progress-store", () => ({
  readLearnerProgressPayloads: (ids: string[]) => readPayloads(ids),
}));
vi.mock("@/lib/onboarding/approve-consent-request", () => ({
  listPendingConsentRequestsForParent: async () => ({
    ok: true,
    requests: [
      { requestId: "r-amy", childId: WAITING, childUsername: "Amy", childCohort: "pathfinder", expiresAt: "2026-11-09T00:00:00Z" },
      { requestId: "r-new", childId: "child-unlinked", childUsername: "Kai", childCohort: null, expiresAt: "2026-11-09T00:00:00Z" },
    ],
  }),
}));
vi.mock("@/lib/parent/parent-tab-gate-pass", () => ({
  parentTabGatePassValid: () => true,
  signParentTabGatePass: () => "pass",
}));

const PROGRESS_KEYS = /lesson|coin|xp|streak|wallet|medal|progress|usage|activity|owed|cash/i;

describe("loadParentTabData for a child waiting for consent", () => {
  beforeEach(() => {
    usageLookups.length = 0;
    profileLookups.length = 0;
    readPayloads.mockClear();
  });

  it("never reads or sends progress or usage data for waiting children", async () => {
    const { loadParentTabData } = await import("@/lib/parent/parent-tab-server");
    const result = await loadParentTabData("pass");
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    // Progress and usage are queried for the active child only.
    expect(readPayloads).toHaveBeenCalledTimes(1);
    expect(readPayloads.mock.calls[0]![0]).toEqual([ACTIVE]);
    expect(usageLookups).toEqual(["Zed"]);

    const waiting = result.data.children.filter((child) => child.status === "waiting");
    expect(waiting.map((child) => child.username).sort()).toEqual(["Amy", "Kai"]);
    for (const child of waiting) {
      for (const key of Object.keys(child)) {
        expect(WAITING_CHILD_KEYS as readonly string[]).toContain(key);
        expect(key).not.toMatch(PROGRESS_KEYS);
      }
    }
    expect(waiting.find((child) => child.username === "Amy")).toEqual({
      userId: WAITING,
      username: "Amy",
      cohort: "pathfinder",
      status: "waiting",
      requestId: "r-amy",
    });

    // Nothing owed is built for a waiting child either.
    const owedFor = result.data.needsOk
      .filter((item) => item.kind === "owed")
      .map((item) => (item.kind === "owed" ? item.childUserId : ""));
    expect(owedFor).not.toContain(WAITING);

    // The serialized payload carries no progress for them.
    const json = JSON.stringify(waiting);
    expect(json).not.toMatch(/lessonsDone|coins|wallet|lessons/);

    const active = result.data.children.find((child) => child.status === "active");
    expect(active).toMatchObject({ userId: ACTIVE, status: "active" });
  });
});
