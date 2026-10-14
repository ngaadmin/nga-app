import { describe, expect, it } from "vitest";
import {
  allocationNextEnabled,
  allocationSavedBadge,
  saveAmountFromClientX,
} from "@/lib/academy/lessons/allocation-slider";
import { M1_L2_LESSON_DEFINITION } from "@/lib/academy/lessons/content/m1-l2";
import { resolveLessonDefinition } from "@/lib/academy/lessons/types";

describe("allocation slider", () => {
  it("enables Next once Save covers $20 and not before", () => {
    expect(allocationNextEnabled(0, 20)).toBe(false);
    expect(allocationNextEnabled(19, 20)).toBe(false);
    expect(allocationNextEnabled(20, 20)).toBe(true);
    expect(allocationNextEnabled(25, 20)).toBe(true);
  });

  it("treats the left edge as save $0 and the right edge as the full amount", () => {
    expect(saveAmountFromClientX(0, 0, 100, 25)).toBe(0);
    expect(saveAmountFromClientX(80, 0, 100, 25)).toBe(20);
    expect(saveAmountFromClientX(100, 0, 100, 25)).toBe(25);
    expect(saveAmountFromClientX(-10, 0, 100, 25)).toBe(0);
  });

  it("badges the amount that was saved, not the amount spent", () => {
    expect(allocationSavedBadge(20)).toBe("🔒 $20 saved!");
    expect(allocationSavedBadge(9)).toBe("🔒 $9 saved!");
  });

  it("gives Lars three short lines and a $20 save target", () => {
    const lesson = resolveLessonDefinition(M1_L2_LESSON_DEFINITION, "explorer");
    const slider = lesson.screens.find((screen) => screen.type === "allocation-slider");
    expect(slider).toMatchObject({
      type: "allocation-slider",
      total: 25,
      targetMin: 20,
      intro:
        "Lars has $25 💰\nHe needs $20 for Senna's phone case 🎁\nSlide to save $20 👇",
    });
  });
});
