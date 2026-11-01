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

describe("bestDropZone with blanks on neighboring lines", () => {
  // Two word-drop blanks 36px apart: their padded zones overlap.
  const upper = { id: 0, rect: { left: 460, top: 240, right: 576, bottom: 276 } };
  const lower = { id: 1, rect: { left: 460, top: 282, right: 556, bottom: 312 } };

  it("drops into the lower blank when the pointer is on it", () => {
    const drag = { x: 450, y: 280, width: 116, height: 36 };
    expect(bestDropZone([upper, lower], drag, 508, 297)).toBe(1);
  });

  it("drops into the upper blank when the pointer is on it", () => {
    const drag = { x: 460, y: 240, width: 116, height: 36 };
    expect(bestDropZone([upper, lower], drag, 518, 258)).toBe(0);
  });

  it("picks the nearer blank when the pointer is between them", () => {
    expect(bestDropZone([upper, lower], null, 500, 280)).toBe(1);
    expect(bestDropZone([upper, lower], null, 500, 277)).toBe(0);
  });
});
