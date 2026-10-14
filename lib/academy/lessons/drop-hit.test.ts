import { describe, expect, it } from "vitest";
import {
  bestDropZone,
  dragHitsZone,
  type DragBounds,
  type DropRect,
} from "@/lib/academy/lessons/drop-hit";

const zone: DropRect = { left: 100, top: 200, right: 300, bottom: 400 };

describe("dragHitsZone", () => {
  it("accepts a pointer that is inside the destination", () => {
    expect(dragHitsZone(null, 150, 250, zone, 0)).toBe(true);
  });

  it("accepts a pointer that is only roughly over the destination", () => {
    expect(dragHitsZone(null, 80, 180, zone)).toBe(true);
  });

  it("accepts an item that overlaps the destination even when the pointer is outside", () => {
    const drag: DragBounds = { x: 70, y: 160, width: 90, height: 90 };
    expect(dragHitsZone(drag, 50, 150, zone, 0)).toBe(true);
  });

  it("rejects a drop that misses the destination", () => {
    const drag: DragBounds = { x: 0, y: 0, width: 40, height: 40 };
    expect(dragHitsZone(drag, 10, 10, zone, 0)).toBe(false);
  });
});

describe("bestDropZone", () => {
  const left: DropRect = { left: 0, top: 0, right: 100, bottom: 200 };
  const right: DropRect = { left: 140, top: 0, right: 240, bottom: 200 };

  it("chooses the destination the item overlaps, not a distant exact spot", () => {
    const drag: DragBounds = { x: 150, y: 20, width: 80, height: 60 };
    expect(
      bestDropZone(
        [
          { id: "left", rect: left },
          { id: "right", rect: right },
        ],
        drag,
        160,
        40,
        0,
      ),
    ).toBe("right");
  });
});
