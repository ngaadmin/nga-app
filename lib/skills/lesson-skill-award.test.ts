import { describe, expect, it } from "vitest";
import {
  skillNumberForMilestoneId,
  skillNumberForModuleLesson,
  skillSlotForLessonNumber,
  skillTierForLessonNumber,
} from "@/lib/skills/lesson-skill-award";

describe("lesson skill reveal vs bronze", () => {
  it("reveals skills 1–3 on lessons 1–3 and bronzes them on 4–6", () => {
    expect(skillTierForLessonNumber(1)).toBe("unlocked");
    expect(skillTierForLessonNumber(2)).toBe("unlocked");
    expect(skillTierForLessonNumber(3)).toBe("unlocked");
    expect(skillTierForLessonNumber(4)).toBe("bronze");
    expect(skillTierForLessonNumber(5)).toBe("bronze");
    expect(skillTierForLessonNumber(6)).toBe("bronze");
    expect(skillTierForLessonNumber(7)).toBeNull();
    expect(skillTierForLessonNumber(9)).toBeNull();
  });

  it("does not award a skill medal on lesson 9", () => {
    expect(skillSlotForLessonNumber(9)).toBeNull();
    expect(skillNumberForModuleLesson(1, 9)).toBeNull();
    expect(skillNumberForMilestoneId(9)).toBeNull();
    expect(skillNumberForMilestoneId(18)).toBeNull();
  });

  it("never maps intro lessons to bronze", () => {
    for (const lessonNumber of [1, 2, 3]) {
      expect(skillTierForLessonNumber(lessonNumber)).not.toBe("bronze");
    }
  });

  it("pairs deepen lessons with the intro skill slot", () => {
    expect(skillSlotForLessonNumber(1)).toBe(1);
    expect(skillSlotForLessonNumber(4)).toBe(1);
    expect(skillSlotForLessonNumber(2)).toBe(2);
    expect(skillSlotForLessonNumber(5)).toBe(2);
    expect(skillSlotForLessonNumber(3)).toBe(3);
    expect(skillSlotForLessonNumber(6)).toBe(3);
  });

  it("applies the same pairing in every module", () => {
    expect(skillNumberForModuleLesson(1, 1)).toBe(1);
    expect(skillNumberForModuleLesson(1, 4)).toBe(1);
    expect(skillNumberForModuleLesson(1, 2)).toBe(2);
    expect(skillNumberForModuleLesson(1, 5)).toBe(2);
    expect(skillNumberForModuleLesson(1, 3)).toBe(3);
    expect(skillNumberForModuleLesson(1, 6)).toBe(3);
    expect(skillNumberForModuleLesson(2, 1)).toBe(4);
    expect(skillNumberForModuleLesson(2, 4)).toBe(4);
    expect(skillNumberForModuleLesson(6, 3)).toBe(18);
    expect(skillNumberForModuleLesson(6, 6)).toBe(18);
  });

  it("uses milestone ids so module 2 lesson 1 is skill 4, not skill 1", () => {
    expect(skillNumberForMilestoneId(1)).toBe(1);
    expect(skillNumberForMilestoneId(4)).toBe(1);
    expect(skillNumberForMilestoneId(5)).toBe(2);
    expect(skillNumberForMilestoneId(10)).toBe(4);
    expect(skillNumberForMilestoneId(13)).toBe(4);
  });
});
