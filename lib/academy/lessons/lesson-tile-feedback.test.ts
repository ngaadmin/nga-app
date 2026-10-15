import { describe, expect, it } from "vitest";
import {
  lessonTileSelection,
  lessonTileShowsTick,
} from "@/lib/academy/lessons/lesson-tile-feedback";

describe("lesson tile selection", () => {
  it("highlights a tapped tile and ticks the correct one on either side", () => {
    for (const side of ["left", "right"] as const) {
      const idle = lessonTileSelection({ selected: false, variant: "neutral" });
      const tapped = lessonTileSelection({ selected: true, variant: "neutral" });
      const correct = lessonTileSelection({ selected: true, variant: "correct" });
      const wrong = lessonTileSelection({ selected: true, variant: "wrong" });

      expect(side).toMatch(/left|right/);
      expect(idle).toBe("idle");
      expect(lessonTileShowsTick(idle)).toBe(false);
      expect(tapped).toBe("selected");
      expect(lessonTileShowsTick(tapped)).toBe(false);
      expect(correct).toBe("correct");
      expect(lessonTileShowsTick(correct)).toBe(true);
      expect(wrong).toBe("wrong");
      expect(lessonTileShowsTick(wrong)).toBe(false);
    }
  });

  it("does not treat an untapped correct answer as selected", () => {
    expect(lessonTileSelection({ selected: false, variant: "correct" })).toBe("idle");
    expect(lessonTileSelection({ selected: false, variant: "wrong" })).toBe("idle");
  });
});
