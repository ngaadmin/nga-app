import { describe, expect, it } from "vitest";

import { learnerProgressAccessAllowed } from "@/lib/onboarding/learner-progress-access";

describe("learnerProgressAccessAllowed", () => {
  it("allows the signed-in user to open their own row", () => {
    expect(
      learnerProgressAccessAllowed({
        actorId: "learner-1",
        targetUserId: "learner-1",
      }),
    ).toBe(true);
  });

  it("allows a parent to open a linked child", () => {
    expect(
      learnerProgressAccessAllowed({
        actorId: "parent-1",
        targetUserId: "child-1",
        linkedChildIds: ["child-1"],
      }),
    ).toBe(true);
  });

  it("refuses another learner and a child who is not linked", () => {
    expect(
      learnerProgressAccessAllowed({
        actorId: "learner-1",
        targetUserId: "learner-2",
        linkedChildIds: [],
      }),
    ).toBe(false);
    expect(
      learnerProgressAccessAllowed({
        actorId: "parent-1",
        targetUserId: "child-2",
        linkedChildIds: ["child-1"],
      }),
    ).toBe(false);
  });

  it("refuses a missing session", () => {
    expect(
      learnerProgressAccessAllowed({
        actorId: null,
        targetUserId: "learner-1",
      }),
    ).toBe(false);
  });
});
