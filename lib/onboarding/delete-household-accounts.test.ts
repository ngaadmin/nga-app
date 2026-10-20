import { describe, expect, it, vi } from "vitest";
import {
  deleteHouseholdAccounts,
  type DeleteHouseholdAccountsAdmin,
  type HouseholdChildRecord,
} from "@/lib/onboarding/delete-household-accounts";

const parentId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const childId = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const otherId = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";

const children: HouseholdChildRecord[] = [
  { id: childId, role: "child", username: "River" },
  { id: otherId, role: "parent_master", username: "NotAChild" },
];

function harness(overrides: Partial<DeleteHouseholdAccountsAdmin> = {}) {
  const calls: string[] = [];
  const admin: DeleteHouseholdAccountsAdmin = {
    deleteUsageEvents: vi.fn(async (username: string) => {
      calls.push(`usage:${username}`);
      return { ok: true as const };
    }),
    deleteAuthUser: vi.fn(async (userId: string) => {
      calls.push(`auth:${userId}`);
      return { ok: true as const };
    }),
    deleteLeftoverRows: vi.fn(async () => {
      calls.push("leftover");
      return { ok: true as const };
    }),
    confirmParentGone: vi.fn(async () => {
      calls.push("gone");
      return { ok: true as const };
    }),
    ...overrides,
  };
  return { admin, calls };
}

describe("deleteHouseholdAccounts", () => {
  it("deletes each child username's activity before that login, then the parent", async () => {
    const { admin, calls } = harness();

    const result = await deleteHouseholdAccounts(
      admin,
      { id: parentId, username: "ParentSam" },
      children,
    );

    expect(result).toEqual({ ok: true });
    expect(calls).toEqual([
      "usage:River",
      `auth:${childId}`,
      "usage:ParentSam",
      "leftover",
      `auth:${parentId}`,
      "gone",
    ]);
    expect(calls.join(" ")).not.toContain("NotAChild");
  });

  it("does not free a username when activity deletion fails", async () => {
    const { admin, calls } = harness({
      deleteUsageEvents: vi.fn(async () => ({ ok: false as const, error: "db" })),
    });

    const result = await deleteHouseholdAccounts(
      admin,
      { id: parentId, username: "ParentSam" },
      children,
    );

    expect(result.ok).toBe(false);
    expect(calls).toEqual([]);
  });
});
