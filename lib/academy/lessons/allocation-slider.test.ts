import { describe, expect, it } from "vitest";
import {
  allocationGoalCaption,
  allocationNextEnabled,
  allocationSavedBadge,
  allocationSliderValueText,
  allocationTrackInsetPx,
  saveAmountFromClientX,
} from "@/lib/academy/lessons/allocation-slider";
import { loadExplorerM1Payload } from "@/lib/academy/lessons/payload/explorer-m1/load-explorer-m1-payload";
import { selectLessonPayload } from "@/lib/academy/lessons/payload/explorer-m1/select-payload";
import { loadBundledLessonPayload } from "@/lib/academy/lessons/payload/load-lesson-payload";
import { resolvePayloadLesson } from "@/lib/academy/lessons/payload/map-payload-lesson";

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

  it("insets the track by half the knob and captions a keep goal as at least", () => {
    expect(allocationTrackInsetPx(44)).toBe(22);
    expect(allocationGoalCaption(20, "at-least")).toBe("🎯 $20+");
    expect(allocationGoalCaption(9, "exact")).toBe("🎯 $9");
    expect(allocationSliderValueText(22, 20, "at-least")).toBe(
      "$22 saved, goal is at least $20, goal met",
    );
    expect(allocationSliderValueText(10, 20, "at-least")).toBe(
      "$10 saved, goal is at least $20",
    );
    expect(allocationSliderValueText(15, 9, "exact")).toBe("$15 saved, goal is $9");
  });

  it("badges the amount that was saved, not the amount spent", () => {
    expect(allocationSavedBadge(20)).toBe("🔒 $20 saved!");
    expect(allocationSavedBadge(9)).toBe("🔒 $9 saved!");
  });

  it("treats a KEEP line as at-least on the gift and cinema sliders", () => {
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
          ? { total: 30, targetMin: 18, match: "at-least" }
          : { total: 15, targetMin: 9, match: "at-least" },
      );
    }
  });

  it("gives the live lesson 2 slider the at-least line and short sort labels", () => {
    const lesson = resolvePayloadLesson(loadBundledLessonPayload(1, 2), "explorer", 2);
    const slider = lesson.screens.find((screen) => screen.type === "allocation-slider");
    expect(slider).toMatchObject({
      match: "at-least",
      total: 25,
      targetMin: 20,
    });
    expect(slider && "intro" in slider ? slider.intro.replace(/\r\n/g, "\n") : "").toBe(
      "Lars has $25 💰\nHe needs $20 for Senna's phone case 🎁\nSlide to save at least $20 👇",
    );
    const sort = lesson.screens.find(
      (screen) =>
        screen.type === "bucket-sort" &&
        screen.buckets.some((bucket) => bucket.id === "want"),
    );
    expect(sort?.type).toBe("bucket-sort");
    if (sort?.type !== "bucket-sort") return;
    expect(sort.items.map((item) => item.label)).toEqual([
      "Phone case (birthday present)",
      "Phone cable",
      "Beast Munch",
      "New game skin",
    ]);
    expect(sort.buckets.map((bucket) => bucket.label)).toEqual([
      "Things Lars needs",
      "Things Lars wants",
    ]);
  });

  it("plays the Explorer lesson 2 slider from the live Explorer payload", () => {
    const bundled = loadBundledLessonPayload(1, 2);
    const explorer = loadExplorerM1Payload(2);
    const selected = selectLessonPayload("explorer", bundled, explorer);
    expect(selected).toBe(explorer);
    expect(selected).toBeTruthy();
    if (!selected) return;

    const lesson = resolvePayloadLesson(selected, "explorer", 2);
    const slider = lesson.screens.find((screen) => screen.type === "allocation-slider");
    // The archived baked lesson expected total 25, targetMin 20, and the
    // Senna phone-case intro. The payload Explorer plays today is below.
    expect(slider).toMatchObject({
      type: "allocation-slider",
      total: 15,
      targetMin: 10,
      match: "at-least",
    });
    expect(slider && "intro" in slider ? slider.intro.replace(/\r\n/g, "\n") : "").toBe(
      "On Friday, Lars earns $10 helping Mom with chores. Now he has $15. The phone case costs $10.\n\nSlide to keep at least $10 for the gift.",
    );
  });
});
