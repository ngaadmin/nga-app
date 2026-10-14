import { describe, expect, it } from "vitest";
import {
  PENNY_JOURNEY_SIZE_PX,
  placePennyBesideNode,
} from "@/lib/dashboard/place-penny-beside-node";
import { resolvePennyMilestoneId } from "@/lib/dashboard/resolve-active-step-index";

const NODE = 84;

function seat(slotWidth: number, centerX: number) {
  return placePennyBesideNode({
    slotWidth,
    nodeLeft: centerX - NODE / 2,
    nodeTop: 0,
    nodeWidth: NODE,
    nodeHeight: NODE,
  });
}

describe("placePennyBesideNode", () => {
  it("keeps Penny fully inside a 390px phone track on both sides of the path", () => {
    const slotWidth = 358;
    for (const anchor of [0.3, 0.5, 0.7]) {
      const placed = seat(slotWidth, anchor * slotWidth);
      expect(placed.leftPx).toBeGreaterThanOrEqual(0);
      expect(placed.leftPx + PENNY_JOURNEY_SIZE_PX).toBeLessThanOrEqual(slotWidth);
    }
  });

  it("stands on the left when that side fits, and on the right when it does not", () => {
    const slotWidth = 358;
    const leftSide = seat(slotWidth, 0.7 * slotWidth);
    const rightSide = seat(slotWidth, 0.3 * slotWidth);
    expect(leftSide.nodeOnRight).toBe(true);
    expect(rightSide.nodeOnRight).toBe(false);
    expect(rightSide.leftPx).toBeGreaterThan(0.3 * slotWidth);
  });

  it("clamps Penny inside a track that is tighter than both open sides", () => {
    const placed = seat(200, 100);
    expect(placed.leftPx).toBeGreaterThanOrEqual(0);
    expect(placed.leftPx + PENNY_JOURNEY_SIZE_PX).toBeLessThanOrEqual(200);
  });
});

describe("resolvePennyMilestoneId", () => {
  const step = (id: number, status: "completed" | "active" | "locked") => ({ id, status });

  it("stands on the first lesson for a new player", () => {
    expect(
      resolvePennyMilestoneId([step(1, "active"), step(2, "locked"), step(3, "locked")]),
    ).toBe(1);
  });

  it("stands on the next lesson after lesson 2, even if that tile is not marked active", () => {
    expect(
      resolvePennyMilestoneId([
        step(1, "completed"),
        step(2, "completed"),
        step(3, "locked"),
      ]),
    ).toBe(3);
  });

  it("stands on the last lesson when the journey is finished", () => {
    expect(
      resolvePennyMilestoneId([step(1, "completed"), step(2, "completed"), step(9, "completed")]),
    ).toBe(9);
  });
});
