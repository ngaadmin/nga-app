import { describe, expect, it } from "vitest";
import {
  lessonSkillAwards,
  skillNumberForMilestoneId,
  skillNumberForModuleLesson,
  skillNumbersForModuleLesson,
  skillSlotForLessonNumber,
  skillTierForLessonNumber,
} from "@/lib/skills/lesson-skill-award";

describe("module skill medal ladder", () => {
  it("awards bronze on lessons 1–3, silver on 4–6, and gold on lesson 9", () => {
    expect(skillTierForLessonNumber(1)).toBe("bronze");
    expect(skillTierForLessonNumber(2)).toBe("bronze");
    expect(skillTierForLessonNumber(3)).toBe("bronze");
    expect(skillTierForLessonNumber(4)).toBe("silver");
    expect(skillTierForLessonNumber(5)).toBe("silver");
    expect(skillTierForLessonNumber(6)).toBe("silver");
    expect(skillTierForLessonNumber(7)).toBeNull();
    expect(skillTierForLessonNumber(8)).toBeNull();
    expect(skillTierForLessonNumber(9)).toBe("gold");
  });

  it("leaves lessons 7 and 8 without a skill medal", () => {
    expect(lessonSkillAwards(1, 7)).toEqual([]);
    expect(lessonSkillAwards(1, 8)).toEqual([]);
    expect(skillNumbersForModuleLesson(1, 7)).toEqual([]);
    expect(skillNumbersForModuleLesson(1, 8)).toEqual([]);
  });

  it("golds all three module skills on lesson 9", () => {
    expect(skillSlotForLessonNumber(9)).toBeNull();
    expect(skillNumberForModuleLesson(1, 9)).toBeNull();
    expect(skillNumberForMilestoneId(9)).toBeNull();
    expect(lessonSkillAwards(1, 9)).toEqual([
      { slug: "stop-and-think", tier: "gold" },
      { slug: "put-needs-first", tier: "gold" },
      { slug: "smart-saving", tier: "gold" },
    ]);
    expect(lessonSkillAwards(2, 9)).toEqual([
      { slug: "stop-the-leak", tier: "gold" },
      { slug: "knowing-debt", tier: "gold" },
      { slug: "safe-guarding", tier: "gold" },
    ]);
  });

  it("pairs each deepen lesson with the same skill at silver", () => {
    expect(skillSlotForLessonNumber(1)).toBe(1);
    expect(skillSlotForLessonNumber(4)).toBe(1);
    expect(lessonSkillAwards(1, 1)).toEqual([
      { slug: "stop-and-think", tier: "bronze" },
    ]);
    expect(lessonSkillAwards(1, 4)).toEqual([
      { slug: "stop-and-think", tier: "silver" },
    ]);
    expect(lessonSkillAwards(1, 3)).toEqual([
      { slug: "smart-saving", tier: "bronze" },
    ]);
    expect(lessonSkillAwards(1, 6)).toEqual([
      { slug: "smart-saving", tier: "silver" },
    ]);
  });

  it("applies the same pairing in every module", () => {
    expect(skillNumberForModuleLesson(1, 1)).toBe(1);
    expect(skillNumberForModuleLesson(1, 4)).toBe(1);
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
