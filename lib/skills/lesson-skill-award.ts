import type { MasteryCohort } from "@/lib/dashboard/mastery-cohort";
import {
  lessonNumberForMilestoneId,
  levelGroupForMilestoneId,
} from "@/lib/dashboard/academy-state";
import {
  getSkillRegistryRecordByNumber,
  skillsForLevel,
  SKILLS_PER_LEVEL,
  type SkillLevelId,
} from "@/lib/skills/skills-registry";

export type LessonSkillAwardTier = "unlocked" | "bronze" | "silver" | "gold";

/**
 * Each module has three skills.
 * Lessons 1–3 award one skill at bronze. Lessons 4–6 award that same skill at silver.
 * Lessons 7–8 practise all three and do not change a medal.
 * Lesson 9 awards gold on all three module skills.
 */
export function skillSlotForLessonNumber(
  lessonNumber: number,
): 1 | 2 | 3 | null {
  if (lessonNumber >= 1 && lessonNumber <= 3) {
    return lessonNumber as 1 | 2 | 3;
  }
  if (lessonNumber >= 4 && lessonNumber <= 6) {
    return (lessonNumber - 3) as 1 | 2 | 3;
  }
  return null;
}

/** Bronze on 1–3, silver on 4–6, gold on 9. Lessons 7–8 award nothing. */
export function skillTierForLessonNumber(
  lessonNumber: number,
): LessonSkillAwardTier | null {
  if (lessonNumber >= 1 && lessonNumber <= 3) return "bronze";
  if (lessonNumber >= 4 && lessonNumber <= 6) return "silver";
  if (lessonNumber === 9) return "gold";
  return null;
}

export function skillNumberForModuleLesson(
  moduleNumber: number,
  lessonNumber: number,
): number | null {
  const numbers = skillNumbersForModuleLesson(moduleNumber, lessonNumber);
  return numbers.length === 1 ? numbers[0]! : null;
}

/** One skill on lessons 1–6. All three module skills on lesson 9. */
export function skillNumbersForModuleLesson(
  moduleNumber: number,
  lessonNumber: number,
): number[] {
  if (moduleNumber < 1) return [];
  const base = (moduleNumber - 1) * SKILLS_PER_LEVEL;
  if (lessonNumber === 9) return [base + 1, base + 2, base + 3];
  const slot = skillSlotForLessonNumber(lessonNumber);
  if (!slot) return [];
  return [base + slot];
}

/**
 * Display names for the three skills a module turns gold on lesson 9.
 * Names are the same for every cohort today. `cohort` is accepted so a
 * future cohort-specific name still has one lookup.
 */
export function moduleCloserSkillNames(
  moduleNumber: number,
  cohort?: MasteryCohort,
): string[] {
  void cohort;
  if (moduleNumber < 1 || moduleNumber > 6) return [];
  return skillsForLevel(moduleNumber as SkillLevelId).map((skill) => skill.skillName);
}

export function lessonSkillAwards(
  moduleNumber: number,
  lessonNumber: number,
): { slug: string; tier: LessonSkillAwardTier }[] {
  const tier = skillTierForLessonNumber(lessonNumber);
  if (!tier) return [];
  return skillNumbersForModuleLesson(moduleNumber, lessonNumber).flatMap(
    (skillNumber) => {
      const slug = getSkillRegistryRecordByNumber(skillNumber)?.skillSlug;
      return slug ? [{ slug, tier }] : [];
    },
  );
}

export function skillNumberForMilestoneId(milestoneId: number): number | null {
  return skillNumberForModuleLesson(
    levelGroupForMilestoneId(milestoneId),
    lessonNumberForMilestoneId(milestoneId),
  );
}
