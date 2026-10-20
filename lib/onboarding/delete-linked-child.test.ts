import { describe, expect, it, vi } from "vitest";
import {
  deleteLinkedChildAccount,
  type DeleteLinkedChildAdmin,
  type LinkedChildTarget,
} from "@/lib/onboarding/delete-linked-child";

const parentA = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const parentB = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const childLinked = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const childOther = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";

const children: Record<string, LinkedChildTarget & { parentId: string }> = {
  [childLinked]: {
    parentId: parentA,
    id: childLinked,
    role: "child",
    username: "River",
  },
  [childOther]: {
    parentId: parentB,
    id: childOther,
    role: "child",
    username: "Birch",
  },
};

function harness(
  overrides: Partial<DeleteLinkedChildAdmin> = {},
  callerRole: string | null = "parent_master",
) {
  const calls: string[] = [];
  const progress = vi.fn(async (id: string) => {
    calls.push(`progress:${id}`);
    return { ok: true as const };
  });
  const consent = vi.fn(async (id: string) => {
    calls.push(`consent:${id}`);
    return { ok: true as const };
  });
  const usage = vi.fn(async (username: string) => {
    calls.push(`usage:${username}`);
    return { ok: true as const };
  });
  const auth = vi.fn(async (id: string) => {
    calls.push(`auth:${id}`);
    return { ok: true as const };
  });
  const link = vi.fn(async (parentId: string, childId: string) => {
    calls.push(`link:${parentId}:${childId}`);
    return { ok: true as const };
  });
  const profile = vi.fn(async (id: string) => {
    calls.push(`profile:${id}`);
    return { ok: true as const };
  });
  const confirm = vi.fn(async (id: string) => {
    calls.push(`gone:${id}`);
    return { ok: true as const };
  });
  const findLinkedChild = vi.fn(async (parentId: string, childId: string) => {
    const row = children[childId];
    if (!row || row.parentId !== parentId) return { ok: true as const, child: null };
    return {
      ok: true as const,
      child: { id: row.id, role: row.role, username: row.username },
    };
  });

  const admin: DeleteLinkedChildAdmin = {
    loadCallerRole: async () => ({ ok: true, role: callerRole }),
    findLinkedChild,
    deleteLearnerProgress: progress,
    deleteConsentRequests: consent,
    deleteUsageEvents: usage,
    deleteAuthUser: auth,
    deleteParentChildLink: link,
    deleteProfile: profile,
    confirmAuthUserGone: confirm,
    ...overrides,
  };

  return { admin, calls, findLinkedChild, progress, consent, usage, auth, link, profile, confirm };
}

describe("deleteLinkedChildAccount", () => {
  it("rejects a child linked to a different parent and deletes nothing", async () => {
    const { admin, calls, findLinkedChild } = harness();

    const result = await deleteLinkedChildAccount(admin, parentA, childOther);

    expect(result).toEqual({
      ok: false,
      status: 403,
      error: "That learner is not linked to this parent account.",
    });
    expect(findLinkedChild).toHaveBeenCalledWith(parentA, childOther);
    expect(calls).toEqual([]);
  });

  it("rejects an unknown child id and deletes nothing", async () => {
    const { admin, calls } = harness();
    const missing = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";

    const result = await deleteLinkedChildAccount(admin, parentA, missing);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(403);
    expect(calls).toEqual([]);
  });

  it("rejects a caller who is not the parent master", async () => {
    const { admin, calls, findLinkedChild } = harness({}, "child");

    const result = await deleteLinkedChildAccount(admin, parentA, childLinked);

    expect(result).toEqual({
      ok: false,
      status: 403,
      error: "Only the parent can delete a linked learner.",
    });
    expect(findLinkedChild).not.toHaveBeenCalled();
    expect(calls).toEqual([]);
  });

  it("rejects a non-child profile even when a link row is returned", async () => {
    const { admin, calls } = harness({
      findLinkedChild: async () => ({
        ok: true,
        child: { id: childLinked, role: "parent_master", username: "Parent" },
      }),
    });

    const result = await deleteLinkedChildAccount(admin, parentA, childLinked);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(403);
    expect(calls).toEqual([]);
  });

  it("rejects the caller's own id", async () => {
    const { admin, calls } = harness();

    const result = await deleteLinkedChildAccount(admin, parentA, parentA);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(400);
    expect(calls).toEqual([]);
  });

  it("deletes only the linked child, progress and consent before the login", async () => {
    const { admin, calls } = harness();

    const result = await deleteLinkedChildAccount(admin, parentA, childLinked);

    expect(result).toEqual({ ok: true, username: "River" });
    expect(calls).toEqual([
      `progress:${childLinked}`,
      `consent:${childLinked}`,
      "usage:River",
      `auth:${childLinked}`,
      `link:${parentA}:${childLinked}`,
      `profile:${childLinked}`,
      `gone:${childLinked}`,
    ]);
    expect(calls.join(" ")).not.toContain(childOther);
    expect(calls.join(" ")).not.toContain(parentB);
  });

  it("stops before the login delete when progress deletion fails", async () => {
    const { admin, auth, link, usage } = harness({
      deleteLearnerProgress: vi.fn(async () => ({ ok: false as const, error: "db" })),
    });

    const result = await deleteLinkedChildAccount(admin, parentA, childLinked);

    expect(result).toEqual({
      ok: false,
      status: 500,
      error: "We could not delete this learner. Try again.",
    });
    expect(usage).not.toHaveBeenCalled();
    expect(auth).not.toHaveBeenCalled();
    expect(link).not.toHaveBeenCalled();
  });

  it("does not free the username when activity deletion fails", async () => {
    const { admin, auth } = harness({
      deleteUsageEvents: vi.fn(async () => ({ ok: false as const, error: "db" })),
    });

    const result = await deleteLinkedChildAccount(admin, parentA, childLinked);

    expect(result.ok).toBe(false);
    expect(auth).not.toHaveBeenCalled();
  });

  it("keeps the parent_child row when the Auth delete fails", async () => {
    const { admin, link, profile } = harness({
      deleteAuthUser: vi.fn(async () => ({ ok: false as const, error: "auth" })),
    });

    const result = await deleteLinkedChildAccount(admin, parentA, childLinked);

    expect(result.ok).toBe(false);
    expect(link).not.toHaveBeenCalled();
    expect(profile).not.toHaveBeenCalled();
  });
});
