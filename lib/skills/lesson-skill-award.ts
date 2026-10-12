import {
  lessonNumberForMilestoneId,
  levelGroupForMilestoneId,
} from "@/lib/dashboard/academy-state";
import { SKILLS_PER_LEVEL } from "@/lib/skills/skills-registry";

export type LessonSkillAwardTier = "unlocked" | "bronze";

/**
 * Each module has three skills. Lessons 1–3 reveal them (unlocked medal).
 * Lessons 4–6 deepen the same trio (bronze). Lesson 9 golds the module node
 * and does not award a medal. Lessons 7–8 also skip skill medals.
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

/** Intro lessons reveal the skill. Deepen lessons award bronze. Never bronze on 1–3. */
export function skillTierForLessonNumber(
  lessonNumber: number,
): LessonSkillAwardTier | null {
  if (lessonNumber >= 1 && lessonNumber <= 3) return "unlocked";
  if (lessonNumber >= 4 && lessonNumber <= 6) return "bronze";
  return null;
}

export function skillNumberForModuleLesson(
  moduleNumber: number,
  lessonNumber: number,
): number | null {
  const slot = skillSlotForLessonNumber(lessonNumber);
  if (!slot || moduleNumber < 1) return null;
  return (moduleNumber - 1) * SKILLS_PER_LEVEL + slot;
}

export function skillNumberForMilestoneId(milestoneId: number): number | null {
  return skillNumberForModuleLesson(
    levelGroupForMilestoneId(milestoneId),
    lessonNumberForMilestoneId(milestoneId),
  );
}
