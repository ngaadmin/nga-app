/** Milestone ids with a shipped interactive lesson flow. */
export const SHIPPED_ACADEMY_LESSON_IDS = new Set<number>([1]);

export const M1_L1_SKILL_ID = "cash-stash-basics";
export const M1_L1_XP_REWARD = 150;

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
