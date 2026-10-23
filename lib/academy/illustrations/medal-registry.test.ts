import { describe, expect, it } from "vitest";
import {
  medalIdForModuleLesson,
  moduleCloserGoldMedals,
  resolveCompletionMedalId,
} from "@/lib/academy/illustrations/medal-registry";

describe("lesson overview and screen 8 medals", () => {
  it("uses the bronze medal on lessons 1–3", () => {
    expect(medalIdForModuleLesson(1, 1)).toBe("medal-skill1-bronze");
    expect(medalIdForModuleLesson(1, 2)).toBe("medal-skill2-bronze");
    expect(medalIdForModuleLesson(1, 3)).toBe("medal-skill3-bronze");
  });

  it("uses the silver medal on lessons 4–6", () => {
    expect(medalIdForModuleLesson(1, 4)).toBe("medal-skill1-silver");
    expect(medalIdForModuleLesson(1, 5)).toBe("medal-skill2-silver");
    expect(medalIdForModuleLesson(1, 6)).toBe("medal-skill3-silver");
  });

  it("repeats the pairing in later modules", () => {
    expect(medalIdForModuleLesson(2, 1)).toBe("medal-skill4-bronze");
    expect(medalIdForModuleLesson(2, 3)).toBe("medal-skill6-bronze");
    expect(medalIdForModuleLesson(2, 4)).toBe("medal-skill4-silver");
  });

  it("keeps bronze on lessons 1–3 even if a sheet named an unlocked file", () => {
    expect(
      resolveCompletionMedalId({
        medalId: "medal-skill1-unlocked",
        moduleNumber: 1,
        lessonNumber: 1,
      }),
    ).toBe("medal-skill1-bronze");
  });

  it("keeps a gold file for each lesson 9 skill and does not let the sheet pick the closer medal", () => {
    expect(medalIdForModuleLesson(1, 9)).toBeUndefined();
    expect(medalIdForModuleLesson(1, 7)).toBeUndefined();
    expect(medalIdForModuleLesson(1, 8)).toBeUndefined();
    expect(
      resolveCompletionMedalId({
        medalId: "medal-skill1-unlocked",
        moduleNumber: 1,
        lessonNumber: 9,
      }),
    ).toBeUndefined();
    expect(moduleCloserGoldMedals(1)).toEqual([
      { skillSlug: "stop-and-think", medalId: "medal-skill1-gold" },
      { skillSlug: "put-needs-first", medalId: "medal-skill2-gold" },
      { skillSlug: "smart-saving", medalId: "medal-skill3-gold" },
    ]);
  });

  it("keeps silver on lessons 4–6 even if the sheet used a bronze file", () => {
    expect(
      resolveCompletionMedalId({
        medalId: "medal-skill2-bronze",
        moduleNumber: 1,
        lessonNumber: 5,
      }),
    ).toBe("medal-skill2-silver");
  });
});
