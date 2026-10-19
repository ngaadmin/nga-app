/**
 * Coins for finishing a real Academy lesson.
 * The sheet line "XP: standard + perfect bonus" resolves here, not per lesson.
 */
export const LESSON_COMPLETION_XP = 100;

/** Extra coins when the lesson is finished with no mistakes. */
export const LESSON_PERFECT_STREAK_BONUS = 50;

export type LessonCoinAward = {
  base: number;
  perfectBonus: number;
  bonus: number;
  total: number;
};

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

/**
 * Base, perfect, and bonus-run coins for one lesson finish.
 * Lifetime XP rises by the same total when these coins are saved.
 */
export function lessonCoinAward(input: {
  perfect: boolean;
  bonusCoins: number;
  isDesignShell?: boolean;
}): LessonCoinAward {
  if (input.isDesignShell) {
    return { base: 0, perfectBonus: 0, bonus: 0, total: 0 };
  }
  const base = LESSON_COMPLETION_XP;
  const perfectBonus = input.perfect ? LESSON_PERFECT_STREAK_BONUS : 0;
  const bonus = Math.max(0, Math.floor(input.bonusCoins));
  return {
    base,
    perfectBonus,
    bonus,
    total: base + perfectBonus + bonus,
  };
}

/**
 * Ledger rows for one lesson finish. Ids match the existing completion and
 * perfect awards, plus one bonus-run row. A repeated id does not pay again.
 */
export function lessonAwardLedgerEvents(
  milestoneId: number,
  award: LessonCoinAward,
): { id: string; points: number }[] {
  const events: { id: string; points: number }[] = [];
  if (award.base > 0) {
    events.push({
      id: `lesson:${milestoneId}:completion`,
      points: award.base,
    });
  }
  if (award.perfectBonus > 0) {
    events.push({
      id: `lesson:${milestoneId}:perfect`,
      points: award.perfectBonus,
    });
  }
  if (award.bonus > 0) {
    events.push({
      id: `lesson:${milestoneId}:bonus-run`,
      points: award.bonus,
    });
  }
  return events;
}
