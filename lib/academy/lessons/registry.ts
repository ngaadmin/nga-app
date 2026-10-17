import type { MasteryCohort } from "@/lib/dashboard/mastery-cohort";
import {
  DESIGN_SHELL_LESSON_DEFINITION,
  DESIGN_SHELL_MILESTONE_ID,
} from "@/lib/academy/lessons/content/design-shell";
import {
  LESSON_COMPLETION_XP,
  LESSON_PERFECT_STREAK_BONUS,
} from "@/lib/academy/lessons/completion-xp";
import {
  resolveLessonDefinition,
  type CohortLessonDefinition,
  type ResolvedLessonContent,
} from "@/lib/academy/lessons/types";

export {
  ACADEMY_DESIGN_SHELL_PATH,
  bundledPayloadMilestone,
  canLaunchAcademyLesson,
  hasShippedLesson,
  isDevAcademyDesignShellPath,
  listPlayableLessonMilestoneIds,
} from "@/lib/academy/lessons/lesson-availability";

/** Hard-coded lessons the player still opens. Module 1 files stay on disk and are not registered. */
export const LESSON_DEFINITIONS: Record<number, CohortLessonDefinition> = {};

export const SHIPPED_ACADEMY_LESSON_IDS = new Set<number>(
  Object.keys(LESSON_DEFINITIONS).map((key) => Number.parseInt(key, 10)),
);

const DEFAULT_SHIPPED_COHORTS: readonly MasteryCohort[] = [
  "explorer",
  "pathfinder",
  "maverick",
];

export function getShippedCohortsForLesson(
  milestoneId: number,
): readonly MasteryCohort[] {
  const definition = getLessonDefinition(milestoneId);
  if (!definition) return [];
  return definition.meta.shippedCohorts ?? DEFAULT_SHIPPED_COHORTS;
}

export function isLessonShippedForCohort(
  milestoneId: number,
  cohort: MasteryCohort,
): boolean {
  if (!SHIPPED_ACADEMY_LESSON_IDS.has(milestoneId)) {
    return false;
  }
  return getShippedCohortsForLesson(milestoneId).includes(cohort);
}

export function getShippedLessonIdsForCohort(
  cohort: MasteryCohort,
): number[] {
  return [...SHIPPED_ACADEMY_LESSON_IDS]
    .filter((id) => isLessonShippedForCohort(id, cohort))
    .sort((a, b) => a - b);
}

export function isDesignShellLesson(milestoneId: number): boolean {
  return milestoneId === DESIGN_SHELL_MILESTONE_ID;
}

export function getLessonDefinition(
  milestoneId: number,
): CohortLessonDefinition | null {
  if (isDesignShellLesson(milestoneId)) {
    return DESIGN_SHELL_LESSON_DEFINITION;
  }
  return LESSON_DEFINITIONS[milestoneId] ?? null;
}

export { DESIGN_SHELL_MILESTONE_ID };

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

/** Live skill slugs from Lesson-Details.csv. Module 1 is not loaded from content files. */
export const M1_L1_SKILL_ID = "stop-and-think";
export const M1_L1_ACHIEVEMENT_SKILL_ID = M1_L1_SKILL_ID;
export const M1_L1_XP_REWARD = LESSON_COMPLETION_XP;
export const M1_L1_PERFECT_STREAK_BONUS = LESSON_PERFECT_STREAK_BONUS;

export const M1_L2_SKILL_ID = "put-needs-first";
export const M1_L2_ACHIEVEMENT_SKILL_ID = M1_L2_SKILL_ID;
export const M1_L2_XP_REWARD = LESSON_COMPLETION_XP;
export const M1_L2_PERFECT_STREAK_BONUS = LESSON_PERFECT_STREAK_BONUS;

export const M1_L3_SKILL_ID = "keep-spare-cash";
export const M1_L3_ACHIEVEMENT_SKILL_ID = M1_L3_SKILL_ID;
export const M1_L3_XP_REWARD = LESSON_COMPLETION_XP;
export const M1_L3_PERFECT_STREAK_BONUS = LESSON_PERFECT_STREAK_BONUS;

export const M1_L4_SKILL_ID = "stop-and-think";
export const M1_L4_ACHIEVEMENT_SKILL_ID = M1_L4_SKILL_ID;
export const M1_L4_XP_REWARD = LESSON_COMPLETION_XP;
export const M1_L4_PERFECT_STREAK_BONUS = LESSON_PERFECT_STREAK_BONUS;

export const M1_L5_SKILL_ID = "put-needs-first";
export const M1_L5_ACHIEVEMENT_SKILL_ID = M1_L5_SKILL_ID;
export const M1_L5_XP_REWARD = LESSON_COMPLETION_XP;
export const M1_L5_PERFECT_STREAK_BONUS = LESSON_PERFECT_STREAK_BONUS;

