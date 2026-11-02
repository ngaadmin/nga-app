import { describe, expect, it } from "vitest";
import {
  mergeParentHubChildren,
  PENDING_CONSENT_CHIP,
  type ParentHubChild,
} from "@/lib/parent/parent-hub-children";

const active: ParentHubChild = {
  userId: "a1",
  username: "Zed",
  cohort: "explorer",
  status: "active",
  lessonsDone: 7,
  coins: 40,
};

describe("mergeParentHubChildren", () => {
  it("adds a child whose consent request is still waiting, with no progress", () => {
    const merged = mergeParentHubChildren(
      [active],
      [{ requestId: "r1", childId: "p1", childUsername: "Amy", childCohort: "pathfinder" }],
    );
    expect(merged.map((child) => child.username)).toEqual(["Zed", "Amy"]);
    expect(merged[1]).toEqual({
      userId: "p1",
      username: "Amy",
      cohort: "pathfinder",
      status: "waiting",
      lessonsDone: 0,
      coins: 0,
      requestId: "r1",
    });
  });

  it("matches a linked waiting child to its request and strips its progress", () => {
    const merged = mergeParentHubChildren(
      [{ ...active, userId: "p1", username: "Amy", status: "waiting", lessonsDone: 5, coins: 9 }],
      [{ requestId: "r1", childId: "p1", childUsername: "Amy", childCohort: null }],
    );
    expect(merged).toHaveLength(1);
    expect(merged[0]).toMatchObject({ status: "waiting", lessonsDone: 0, coins: 0, requestId: "r1" });
  });

  it("keeps a linked waiting child with no open request as waiting, without a request", () => {
    const merged = mergeParentHubChildren(
      [{ ...active, userId: "p2", username: "Bo", status: "waiting" }],
      [],
    );
    expect(merged[0]!.requestId).toBeUndefined();
    expect(merged[0]!.coins).toBe(0);
  });

  it("does not duplicate an active child and leaves its data alone", () => {
    const merged = mergeParentHubChildren([active], []);
    expect(merged).toEqual([active]);
  });

  it("uses the same words as the Needs your OK row", () => {
    expect(PENDING_CONSENT_CHIP).toBe("Waiting for approval");
  });
});
