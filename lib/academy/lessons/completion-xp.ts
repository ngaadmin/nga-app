/** Every cohort earns this for finishing a real Academy lesson. */
export const LESSON_COMPLETION_XP = 100;

/** Extra XP when the lesson is finished with no mistakes. */
export const LESSON_PERFECT_STREAK_BONUS = 50;

/** Cash-in amounts. Not authored per lesson or cohort. */
export function lessonCashInXp(isDesignShell = false): {
  xpReward: number;
  perfectStreakBonus: number;
} {
  if (isDesignShell) {
    return { xpReward: 0, perfectStreakBonus: 0 };
  }
  return {
    xpReward: LESSON_COMPLETION_XP,
    perfectStreakBonus: LESSON_PERFECT_STREAK_BONUS,
  };
}
