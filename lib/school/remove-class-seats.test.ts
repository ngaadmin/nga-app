import { describe, expect, it, vi } from "vitest";
import {
  pickClassSeatsToRemove,
  removeOwnedClassSeats,
  type OwnedClassSeat,
  type RemoveClassSeatsAdmin,
} from "@/lib/school/remove-class-seats";

const teacherId = "teacher-1";

const seats: OwnedClassSeat[] = [
  { id: "seat-b", username: "Birch7", accountRole: "child" },
  { id: "seat-a", username: "acorn3", accountRole: "child" },
  { id: teacherId, username: "teacher", accountRole: "child" },
  { id: "seat-parent", username: "parent", accountRole: "parent_master" },
  { id: "seat-blank", username: "  ", accountRole: "child" },
];

describe("pickClassSeatsToRemove", () => {
  it("removes one owned child seat, ignoring case", () => {
    const picked = pickClassSeatsToRemove(seats, teacherId, {
      scope: "one",
      username: "ACORN3",
    });
    expect(picked).toEqual({
      ok: true,
      seats: [{ id: "seat-a", username: "acorn3", accountRole: "child" }],
    });
  });

  it("refuses a username that is not an owned child seat", () => {
    expect(
      pickClassSeatsToRemove(seats, teacherId, {
        scope: "one",
        username: "teacher",
      }),
    ).toEqual({ ok: false, error: "That student is not in this class." });
    expect(
      pickClassSeatsToRemove(seats, teacherId, {
        scope: "one",
        username: "parent",
      }),
    ).toEqual({ ok: false, error: "That student is not in this class." });
    expect(
      pickClassSeatsToRemove(seats, teacherId, {
        scope: "one",
        username: "nope",
      }),
    ).toEqual({ ok: false, error: "That student is not in this class." });
  });

  it("removes every owned child seat when the target is the whole class", () => {
    const picked = pickClassSeatsToRemove(seats, teacherId, { scope: "all" });
    expect(picked.ok).toBe(true);
    if (!picked.ok) return;
    expect(picked.seats.map((seat) => seat.username)).toEqual([
      "acorn3",
      "Birch7",
    ]);
  });
});

describe("removeOwnedClassSeats", () => {
  function admin(overrides: Partial<RemoveClassSeatsAdmin> = {}): {
    client: RemoveClassSeatsAdmin;
    progress: ReturnType<typeof vi.fn>;
    auth: ReturnType<typeof vi.fn>;
  } {
    const progress = vi.fn(async () => ({ ok: true as const }));
    const auth = vi.fn(async () => ({ ok: true as const }));
    return {
      progress,
      auth,
      client: {
        listOwnedSeats: async () => ({ ok: true, seats }),
        deleteProgress: progress,
        deleteAuthUser: auth,
        ...overrides,
      },
    };
  }

  it("deletes progress before the auth user, and only for the chosen seat", async () => {
    const harness = admin();
    const result = await removeOwnedClassSeats(harness.client, teacherId, {
      scope: "one",
      username: "birch7",
    });

    expect(result).toEqual({ ok: true, removed: ["Birch7"] });
    expect(harness.progress).toHaveBeenCalledTimes(1);
    expect(harness.progress).toHaveBeenCalledWith("seat-b");
    expect(harness.auth).toHaveBeenCalledTimes(1);
    expect(harness.auth).toHaveBeenCalledWith("seat-b");
    expect(harness.progress.mock.invocationCallOrder[0] ?? 0).toBeLessThan(
      harness.auth.mock.invocationCallOrder[0] ?? 0,
    );
  });

  it("stops before deleting a login when progress deletion fails", async () => {
    const harness = admin({
      deleteProgress: vi.fn(async () => ({ ok: false as const, error: "db" })),
    });
    const result = await removeOwnedClassSeats(harness.client, teacherId, {
      scope: "one",
      username: "acorn3",
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.removed).toEqual([]);
    expect(harness.auth).not.toHaveBeenCalled();
  });

  it("keeps earlier removals when a later login delete fails", async () => {
    const deleteAuthUser = vi.fn(async (userId: string) =>
      userId === "seat-b"
        ? { ok: false as const, error: "auth" }
        : { ok: true as const },
    );
    const harness = admin({ deleteAuthUser });
    const result = await removeOwnedClassSeats(harness.client, teacherId, {
      scope: "all",
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.removed).toEqual(["acorn3"]);
    expect(deleteAuthUser).toHaveBeenCalledTimes(2);
    expect(deleteAuthUser.mock.calls.map((call) => call[0])).toEqual([
      "seat-a",
      "seat-b",
    ]);
  });
});
