import { describe, expect, it } from "vitest";
import { dragPositionFromPointer } from "@/lib/academy/lessons/drag-position";

const grab = { pointerX: 120, pointerY: 480, left: 80, top: 440 };

describe("dragPositionFromPointer", () => {
  it("leaves the element where it is when the pointer has not moved", () => {
    expect(dragPositionFromPointer(grab, { x: 120, y: 480 })).toEqual({
      x: 80,
      y: 440,
    });
  });

  it("moves the element by the pointer delta", () => {
    expect(dragPositionFromPointer(grab, { x: 138, y: 469 })).toEqual({
      x: 98,
      y: 429,
    });
  });

  it("keeps the offset between the pointer and the element's corner", () => {
    const next = dragPositionFromPointer(grab, { x: 150, y: 500 });
    expect(150 - next.x).toBe(120 - 80);
    expect(500 - next.y).toBe(480 - 440);
  });
});
