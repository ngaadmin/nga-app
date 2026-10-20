import { describe, expect, it, vi } from "vitest";
import { discardUnfinishedAuthUser } from "@/lib/school/discard-unfinished-auth-user";

describe("discardUnfinishedAuthUser", () => {
  it("deletes activity for the stored username before the login", async () => {
    const calls: string[] = [];
    await discardUnfinishedAuthUser(
      {
        readUsername: async () => "u123stub",
        deleteUsageEvents: async (username) => {
          calls.push(`usage:${username}`);
        },
        deleteAuthUser: async (userId) => {
          calls.push(`auth:${userId}`);
        },
      },
      "user-1",
    );
    expect(calls).toEqual(["usage:u123stub", "auth:user-1"]);
  });

  it("still removes the login when activity deletion throws", async () => {
    const deleteAuthUser = vi.fn(async () => undefined);
    await discardUnfinishedAuthUser(
      {
        readUsername: async () => "u123stub",
        deleteUsageEvents: async () => {
          throw new Error("db");
        },
        deleteAuthUser,
      },
      "user-1",
    );
    expect(deleteAuthUser).toHaveBeenCalledWith("user-1");
  });
});
