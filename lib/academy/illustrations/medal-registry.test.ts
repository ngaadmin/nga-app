import { describe, expect, it } from "vitest";
import {
  medalIdForModuleLesson,
  resolveCompletionMedalId,
} from "@/lib/academy/illustrations/medal-registry";

describe("lesson overview and screen 8 medals", () => {
  it("uses the unlocked medal on intro lessons 1–3", () => {
    expect(medalIdForModuleLesson(1, 1)).toBe("medal-skill1-unlocked");
    expect(medalIdForModuleLesson(1, 2)).toBe("medal-skill2-unlocked");
    expect(medalIdForModuleLesson(1, 3)).toBe("medal-skill3-unlocked");
  });

  it("uses the bronze medal on deepen lessons 4–6", () => {
    expect(medalIdForModuleLesson(1, 4)).toBe("medal-skill1-bronze");
    expect(medalIdForModuleLesson(1, 5)).toBe("medal-skill2-bronze");
    expect(medalIdForModuleLesson(1, 6)).toBe("medal-skill3-bronze");
  });

  it("repeats the pairing in later modules", () => {
    expect(medalIdForModuleLesson(2, 1)).toBe("medal-skill4-unlocked");
    expect(medalIdForModuleLesson(2, 3)).toBe("medal-skill6-unlock");
    expect(medalIdForModuleLesson(2, 4)).toBe("medal-skill4-bronze");
  });

  it("ignores an authored bronze medal on an intro lesson", () => {
    expect(
      resolveCompletionMedalId({
        medalId: "medal-skill1-bronze",
        moduleNumber: 1,
        lessonNumber: 1,
      }),
    ).toBe("medal-skill1-unlocked");
  });

  it("does not award a medal on lesson 9", () => {
    expect(medalIdForModuleLesson(1, 9)).toBeUndefined();
    expect(
      resolveCompletionMedalId({
        medalId: "medal-skill1-unlocked",
        moduleNumber: 1,
        lessonNumber: 9,
      }),
    ).toBeUndefined();
  });

  it("keeps bronze on deepen lessons even if the sheet used an unlocked file", () => {
    expect(
      resolveCompletionMedalId({
        medalId: "medal-skill2-unlocked",
        moduleNumber: 1,
        lessonNumber: 5,
      }),
    ).toBe("medal-skill2-bronze");
  });
});
