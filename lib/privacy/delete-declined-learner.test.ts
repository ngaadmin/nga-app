import { describe, expect, it, vi } from "vitest";
import { deleteDeclinedLearnerWith } from "@/lib/privacy/delete-declined-learner";
import {
  planUnapprovedAccountDeletion,
  type ActivityAccount,
} from "@/lib/privacy/inactivity";

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => {
    throw new Error("no database in tests");
  },
}));

function learner(overrides: Partial<ActivityAccount> = {}): ActivityAccount {
  return {
    id: "child-1",
    username: "River",
    role: "child",
    createdAt: new Date().toISOString(),
    lastSignInAt: null,
    lastUsageAt: null,
    warningSentAt: null,
    parentId: "parent-1",
    teacherId: null,
    authEmail: null,
    parentEmail: null,
    teacherEmail: null,
    guardianEmail: null,
    accountStatus: "declined",
    consentApprovedAt: null,
    ...overrides,
  };
}

function deps(account: ActivityAccount | null) {
  return {
    loadAccount: vi.fn(async () => account),
    run: vi.fn(async () => {}),
  };
}

describe("planUnapprovedAccountDeletion", () => {
  it("plans a linked-child delete for a declined learner with a parent", () => {
    expect(planUnapprovedAccountDeletion(learner())).toEqual({
      kind: "linked-child",
      parentId: "parent-1",
      childId: "child-1",
    });
  });

  it("plans a standalone delete when there is no parent link", () => {
    expect(planUnapprovedAccountDeletion(learner({ parentId: null }))).toEqual({
      kind: "standalone",
      userId: "child-1",
      username: "River",
    });
  });

  it("never plans a delete for parents, class seats or approved learners", () => {
    expect(planUnapprovedAccountDeletion(learner({ role: "parent_master" }))).toBeNull();
    expect(planUnapprovedAccountDeletion(learner({ teacherId: "teacher-1" }))).toBeNull();
    expect(planUnapprovedAccountDeletion(learner({ accountStatus: "active" }))).toBeNull();
    expect(
      planUnapprovedAccountDeletion(learner({ consentApprovedAt: "2026-10-01T00:00:00Z" })),
    ).toBeNull();
  });
});

describe("deleteDeclinedLearnerWith", () => {
  it("deletes a declined learner once, through the parent link only", async () => {
    const d = deps(learner());
    await expect(deleteDeclinedLearnerWith(d, "child-1")).resolves.toEqual({ deleted: true });
    expect(d.run).toHaveBeenCalledTimes(1);
    expect(d.run).toHaveBeenCalledWith({
      kind: "linked-child",
      parentId: "parent-1",
      childId: "child-1",
    });
  });

  it("does nothing for a learner who is still pending", async () => {
    const d = deps(learner({ accountStatus: "pending_consent" }));
    await expect(deleteDeclinedLearnerWith(d, "child-1")).resolves.toEqual({
      deleted: false,
      reason: "not-declined",
    });
    expect(d.run).not.toHaveBeenCalled();
  });

  it("does nothing for a declined class seat or an approved learner", async () => {
    for (const account of [
      learner({ teacherId: "teacher-1" }),
      learner({ consentApprovedAt: "2026-10-01T00:00:00Z" }),
      learner({ role: "parent_master" }),
    ]) {
      const d = deps(account);
      const result = await deleteDeclinedLearnerWith(d, "child-1");
      expect(result.deleted).toBe(false);
      expect(d.run).not.toHaveBeenCalled();
    }
  });

  it("does nothing when the profile is missing or a different id comes back", async () => {
    const missing = deps(null);
    expect((await deleteDeclinedLearnerWith(missing, "child-1")).deleted).toBe(false);
    expect(missing.run).not.toHaveBeenCalled();

    const other = deps(learner({ id: "child-2" }));
    expect((await deleteDeclinedLearnerWith(other, "child-1")).deleted).toBe(false);
    expect(other.run).not.toHaveBeenCalled();
  });

  it("reports a failed delete without throwing", async () => {
    const d = deps(learner());
    d.run.mockRejectedValueOnce(new Error("boom"));
    await expect(deleteDeclinedLearnerWith(d, "child-1")).resolves.toEqual({
      deleted: false,
      reason: "failed",
    });
  });
});
