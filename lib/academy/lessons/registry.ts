/** Milestone ids with a shipped interactive lesson flow. */
export const SHIPPED_ACADEMY_LESSON_IDS = new Set<number>([1, 2]);

export const M1_L1_SKILL_ID = "stop-and-think";
export const M1_L1_ACHIEVEMENT_SKILL_ID = "stop-and-think";
export const M1_L1_XP_REWARD = 150;
export const M1_L1_PERFECT_STREAK_BONUS = 50;

export const M1_L2_SKILL_ID = "put-needs-first";
export const M1_L2_ACHIEVEMENT_SKILL_ID = "put-needs-first";
export const M1_L2_XP_REWARD = 100;
export const M1_L2_PERFECT_STREAK_BONUS = 50;

export function hasShippedLesson(milestoneId: number): boolean {
  return SHIPPED_ACADEMY_LESSON_IDS.has(milestoneId);
}

/** Shipped lessons stay open for replay after completion (testing + review). */
export function canLaunchAcademyLesson(
  milestoneId: number,
  status: "active" | "completed" | "locked",
): boolean {
  return (
    hasShippedLesson(milestoneId) &&
    (status === "active" || status === "completed")
  );
}
