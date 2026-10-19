import { describe, expect, it } from "vitest";
import {
  allocationNextEnabled,
  allocationSavedBadge,
  allocationTargetMarker,
  allocationTrackInsetPx,
  saveAmountFromClientX,
} from "@/lib/academy/lessons/allocation-slider";
import { M1_L2_LESSON_DEFINITION } from "@/lib/academy/lessons/content/m1-l2";
import { loadBundledLessonPayload } from "@/lib/academy/lessons/payload/load-lesson-payload";
import { resolvePayloadLesson } from "@/lib/academy/lessons/payload/map-payload-lesson";
import { resolveLessonDefinition } from "@/lib/academy/lessons/types";

describe("allocation slider", () => {
  it("enables Next only when Save is exactly the target", () => {
    expect(allocationNextEnabled(0, 20)).toBe(false);
    expect(allocationNextEnabled(19, 20)).toBe(false);
    expect(allocationNextEnabled(20, 20)).toBe(true);
    expect(allocationNextEnabled(25, 20)).toBe(false);
    expect(allocationNextEnabled(15, 9)).toBe(false);
    expect(allocationNextEnabled(9, 9)).toBe(true);
  });

  it("treats the left edge as save $0 and the right edge as the full amount", () => {
    expect(saveAmountFromClientX(0, 0, 100, 25)).toBe(0);
    expect(saveAmountFromClientX(80, 0, 100, 25)).toBe(20);
    expect(saveAmountFromClientX(100, 0, 100, 25)).toBe(25);
    expect(saveAmountFromClientX(-10, 0, 100, 25)).toBe(0);
  });

  it("insets the track by half the knob and labels the save target on the bar", () => {
    expect(allocationTrackInsetPx(44)).toBe(22);
    expect(allocationTargetMarker(20)).toBe("Save $20 🎯");
  });

  it("badges the amount that was saved, not the amount spent", () => {
    expect(allocationSavedBadge(20)).toBe("🔒 $20 saved!");
    expect(allocationSavedBadge(9)).toBe("🔒 $9 saved!");
  });

  it("treats a KEEP line as at-least and a move line as exact", () => {
    expect(allocationNextEnabled(19, 20, "at-least")).toBe(false);
    expect(allocationNextEnabled(20, 20, "at-least")).toBe(true);
    expect(allocationNextEnabled(25, 20, "at-least")).toBe(true);
    expect(allocationNextEnabled(10, 9, "exact")).toBe(false);

    for (const cohort of ["explorer", "pathfinder", "maverick"] as const) {
      const keep = resolvePayloadLesson(
        loadBundledLessonPayload(1, 2),
        cohort,
        2,
      ).screens.find((screen) => screen.type === "allocation-slider");
      expect(keep, cohort).toMatchObject({
        total: 25,
        targetMin: 20,
        match: "at-least",
      });

      const pay = resolvePayloadLesson(
        loadBundledLessonPayload(1, 6),
        cohort,
        6,
      ).screens.find((screen) => screen.type === "allocation-slider");
      expect(pay, cohort).toMatchObject(
        cohort === "maverick"
          ? { total: 30, targetMin: 18, match: "exact" }
          : { total: 15, targetMin: 9, match: "exact" },
      );
    }
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
