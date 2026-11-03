import { describe, expect, it } from "vitest";
import {
  mergeParentHubChildren,
  PENDING_CONSENT_CHIP,
  WAITING_CHILD_KEYS,
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

function onlyIdentityKeys(child: object) {
  for (const key of Object.keys(child)) {
    expect(WAITING_CHILD_KEYS as readonly string[]).toContain(key);
  }
}

describe("mergeParentHubChildren", () => {
  it("adds a child whose consent request is still waiting, with identity only", () => {
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
      requestId: "r1",
    });
    onlyIdentityKeys(merged[1]!);
  });

  it("matches a linked waiting child to its request and drops any progress fields", () => {
    const leaky = {
      userId: "p1",
      username: "Amy",
      cohort: null,
      status: "waiting",
      lessonsDone: 5,
      coins: 9,
    } as unknown as ParentHubChild;
    const merged = mergeParentHubChildren(
      [leaky],
      [{ requestId: "r1", childId: "p1", childUsername: "Amy", childCohort: null }],
    );
    expect(merged).toHaveLength(1);
    expect(merged[0]).toEqual({
      userId: "p1",
      username: "Amy",
      cohort: null,
      status: "waiting",
      requestId: "r1",
    });
    expect(merged[0]).not.toHaveProperty("lessonsDone");
    expect(merged[0]).not.toHaveProperty("coins");
  });

  it("keeps a linked waiting child with no open request as waiting, without a request", () => {
    const merged = mergeParentHubChildren(
      [{ userId: "p2", username: "Bo", cohort: null, status: "waiting" }],
      [],
    );
    expect(merged[0]).toEqual({ userId: "p2", username: "Bo", cohort: null, status: "waiting" });
  });

  it("does not duplicate an active child and leaves its data alone", () => {
    const merged = mergeParentHubChildren([active], []);
    expect(merged).toEqual([active]);
  });

  it("uses the same words as the Needs your OK row", () => {
    expect(PENDING_CONSENT_CHIP).toBe("Waiting for approval");
  });
});
