import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  learnerProgressAccessAllowed,
  learnerProgressWriteAllowedForStatus,
} from "@/lib/onboarding/learner-progress-access";

vi.mock("server-only", () => ({}));

const state = {
  actorId: "learner-1" as string | null,
  linkedChildIds: [] as string[],
  statuses: new Map<string, string | null>(),
  statusError: false,
  writes: [] as string[],
  reads: [] as string[],
};

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: {
      getUser: async () => ({ data: { user: state.actorId ? { id: state.actorId } : null } }),
    },
    from: (table: string) => {
      const filters: Record<string, string> = {};
      const chain = {
        select: () => chain,
        eq: (column: string, value: string) => {
          filters[column] = value;
          return chain;
        },
        then: (onFulfilled: (v: unknown) => unknown) => {
          const rows =
            table === "parent_child" && filters.parent_id === state.actorId
              ? state.linkedChildIds
                  .filter((id) => id === filters.child_id)
                  .map((child_id) => ({ child_id }))
              : [];
          return Promise.resolve({ data: rows, error: null }).then(onFulfilled);
        },
      };
      return chain;
    },
  }),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: () => {
      let id = "";
      const chain = {
        select: () => chain,
        eq: (_column: string, value: string) => {
          id = value;
          return chain;
        },
        maybeSingle: async () =>
          state.statusError
            ? { data: null, error: { message: "boom" } }
            : {
                data: state.statuses.has(id) ? { account_status: state.statuses.get(id) } : null,
                error: null,
              },
      };
      return chain;
    },
  }),
}));

vi.mock("@/lib/onboarding/learner-progress-store", () => ({
  readLearnerProgressRow: async (userId: string) => {
    state.reads.push(userId);
    return null;
  },
  writeLearnerProgressRow: async (userId: string) => {
    state.writes.push(userId);
    return { ok: true };
  },
}));

const payload = {
  schemaVersion: 1,
  academyProgress: null,
  wallet: null,
  skillProgress: null,
  vaultProfile: null,
  vaultSession: null,
} as never;

async function load() {
  return import("@/lib/onboarding/learner-progress");
}

beforeEach(() => {
  state.actorId = "learner-1";
  state.linkedChildIds = [];
  state.statuses = new Map();
  state.statusError = false;
  state.writes = [];
  state.reads = [];
});

describe("learnerProgressWriteAllowedForStatus", () => {
  it("allows active only and refuses pending, declined and unknown", () => {
    expect(learnerProgressWriteAllowedForStatus("active")).toBe(true);
    expect(learnerProgressWriteAllowedForStatus("pending_consent")).toBe(false);
    expect(learnerProgressWriteAllowedForStatus("declined")).toBe(false);
    expect(learnerProgressWriteAllowedForStatus(null)).toBe(false);
    expect(learnerProgressWriteAllowedForStatus("")).toBe(false);
    expect(learnerProgressWriteAllowedForStatus("something_else")).toBe(false);
  });

  it("leaves the identity rule unchanged", () => {
    expect(learnerProgressAccessAllowed({ actorId: "a", targetUserId: "a" })).toBe(true);
  });
});

describe("saveLearnerProgressForUser consent block (security review finding 1)", () => {
  it("writes for an active learner saving their own progress", async () => {
    state.statuses.set("learner-1", "active");
    const { saveLearnerProgressForUser } = await load();
    await expect(saveLearnerProgressForUser("learner-1", payload)).resolves.toEqual({ ok: true });
    expect(state.writes).toEqual(["learner-1"]);
  });

  it("refuses a learner whose consent is pending (direct server action call)", async () => {
    state.statuses.set("learner-1", "pending_consent");
    const { saveLearnerProgressForUser } = await load();
    await expect(saveLearnerProgressForUser("learner-1", payload)).resolves.toEqual({ ok: false });
    expect(state.writes).toEqual([]);
  });

  it("refuses a learner whose consent was declined", async () => {
    state.statuses.set("learner-1", "declined");
    const { saveLearnerProgressForUser } = await load();
    await expect(saveLearnerProgressForUser("learner-1", payload)).resolves.toEqual({ ok: false });
    expect(state.writes).toEqual([]);
  });

  it("refuses a parent writing for a linked child who is still pending", async () => {
    state.actorId = "parent-1";
    state.linkedChildIds = ["child-1"];
    state.statuses.set("child-1", "pending_consent");
    const { saveLearnerProgressForUser } = await load();
    await expect(saveLearnerProgressForUser("child-1", payload)).resolves.toEqual({ ok: false });
    expect(state.writes).toEqual([]);
  });

  it("writes for a parent's linked active child", async () => {
    state.actorId = "parent-1";
    state.linkedChildIds = ["child-1"];
    state.statuses.set("child-1", "active");
    const { saveLearnerProgressForUser } = await load();
    await expect(saveLearnerProgressForUser("child-1", payload)).resolves.toEqual({ ok: true });
    expect(state.writes).toEqual(["child-1"]);
  });

  it("fails closed when the profile is missing or the status lookup errors", async () => {
    const { saveLearnerProgressForUser } = await load();
    await expect(saveLearnerProgressForUser("learner-1", payload)).resolves.toEqual({ ok: false });
    state.statuses.set("learner-1", "active");
    state.statusError = true;
    await expect(saveLearnerProgressForUser("learner-1", payload)).resolves.toEqual({ ok: false });
    expect(state.writes).toEqual([]);
  });

  it("still refuses an unlinked target before any status check", async () => {
    state.statuses.set("someone-else", "active");
    const { saveLearnerProgressForUser } = await load();
    await expect(saveLearnerProgressForUser("someone-else", payload)).resolves.toEqual({ ok: false });
    expect(state.writes).toEqual([]);
  });

  it("does not change reads: a pending learner can still load their own row", async () => {
    state.statuses.set("learner-1", "pending_consent");
    const { loadLearnerProgressByUserId } = await load();
    await loadLearnerProgressByUserId("learner-1");
    expect(state.reads).toEqual(["learner-1"]);
  });
});
