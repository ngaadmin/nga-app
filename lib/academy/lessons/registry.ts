import type { MasteryCohort } from "@/lib/dashboard/mastery-cohort";
import { M1_L1_LESSON_DEFINITION } from "@/lib/academy/lessons/content/m1-l1";
import { M1_L2_LESSON_DEFINITION } from "@/lib/academy/lessons/content/m1-l2";
import { M1_L3_LESSON_DEFINITION } from "@/lib/academy/lessons/content/m1-l3";
import {
  resolveLessonDefinition,
  type CohortLessonDefinition,
  type ResolvedLessonContent,
} from "@/lib/academy/lessons/types";
import { isDevClient } from "@/lib/dev/client-persist";

/** Shipped lesson definitions keyed by academy milestone id. */
export const LESSON_DEFINITIONS: Record<number, CohortLessonDefinition> = {
  1: M1_L1_LESSON_DEFINITION,
  2: M1_L2_LESSON_DEFINITION,
  3: M1_L3_LESSON_DEFINITION,
};

export const SHIPPED_ACADEMY_LESSON_IDS = new Set<number>(
  Object.keys(LESSON_DEFINITIONS).map((key) => Number.parseInt(key, 10)),
);

export function getLessonDefinition(
  milestoneId: number,
): CohortLessonDefinition | null {
  return LESSON_DEFINITIONS[milestoneId] ?? null;
}

export function resolveLessonForMilestone(
  milestoneId: number,
  cohort: MasteryCohort,
): ResolvedLessonContent {
  const definition = getLessonDefinition(milestoneId);
  if (!definition) {
    throw new Error(`No lesson definition for milestone ${milestoneId}`);
  }
  return resolveLessonDefinition(definition, cohort);
}

// ─── Backward-compatible reward/skill exports (registry mirrors) ─────────────

export const M1_L1_SKILL_ID = LESSON_DEFINITIONS[1]!.rewards.skillSlug;
export const M1_L1_ACHIEVEMENT_SKILL_ID =
  LESSON_DEFINITIONS[1]!.rewards.achievementSkillSlug;
export const M1_L1_XP_REWARD = LESSON_DEFINITIONS[1]!.rewards.xpReward;
export const M1_L1_PERFECT_STREAK_BONUS =
  LESSON_DEFINITIONS[1]!.rewards.perfectStreakBonus;

export const M1_L2_SKILL_ID = LESSON_DEFINITIONS[2]!.rewards.skillSlug;
export const M1_L2_ACHIEVEMENT_SKILL_ID =
  LESSON_DEFINITIONS[2]!.rewards.achievementSkillSlug;
export const M1_L2_XP_REWARD = LESSON_DEFINITIONS[2]!.rewards.xpReward;
export const M1_L2_PERFECT_STREAK_BONUS =
  LESSON_DEFINITIONS[2]!.rewards.perfectStreakBonus;

export const M1_L3_SKILL_ID = LESSON_DEFINITIONS[3]!.rewards.skillSlug;
export const M1_L3_ACHIEVEMENT_SKILL_ID =
  LESSON_DEFINITIONS[3]!.rewards.achievementSkillSlug;
export const M1_L3_XP_REWARD = LESSON_DEFINITIONS[3]!.rewards.xpReward;
export const M1_L3_PERFECT_STREAK_BONUS =
  LESSON_DEFINITIONS[3]!.rewards.perfectStreakBonus;

export function hasShippedLesson(milestoneId: number): boolean {
  return SHIPPED_ACADEMY_LESSON_IDS.has(milestoneId);
}

/** Shipped lessons stay open for replay after completion (testing + review). */
export function canLaunchAcademyLesson(
  milestoneId: number,
  status: "active" | "completed" | "locked",
): boolean {
  if (!hasShippedLesson(milestoneId)) {
    return false;
  }

  if (isDevClient()) {
    return true;
  }

  return status === "active" || status === "completed";
}
