import {
  MONTHLY_CHALLENGES,
  type MonthlyChallenge,
} from "@/lib/dashboard/achievements-state";

/**
 * Weekly and monthly challenges shown under the streak detail view.
 *
 * Data today:
 * - Monthly: only the 12 named monthly challenges in `MONTHLY_CHALLENGES`.
 *   They have no rules, progress, or completion record per learner, so the
 *   "achieved" list is always empty. The old alternating demo flag
 *   (`isDemoMonthlyChallengeAchieved`) is not used, so nobody sees a fake win.
 * - Weekly: no weekly challenge content or tracking exists yet.
 */

export type UpcomingMonthlyChallenge = MonthlyChallenge & {
  /** 0-11 calendar month. */
  monthIndex: number;
  isCurrentMonth: boolean;
};

export type WeeklyChallenge = {
  id: string;
  name: string;
  icon: string;
};

export type StreakChallengesView = {
  weekly: {
    upcoming: readonly WeeklyChallenge[];
    achieved: readonly WeeklyChallenge[];
  };
  monthly: {
    upcoming: readonly UpcomingMonthlyChallenge[];
    achieved: readonly MonthlyChallenge[];
  };
};

/** How many months to show: this month plus the next two. */
export const UPCOMING_MONTHLY_CHALLENGE_COUNT = 3;

export function buildStreakChallengesView(now: Date): StreakChallengesView {
  const currentMonth = now.getMonth();
  const upcoming: UpcomingMonthlyChallenge[] = [];
  for (let offset = 0; offset < UPCOMING_MONTHLY_CHALLENGE_COUNT; offset += 1) {
    const monthIndex = (currentMonth + offset) % 12;
    const challenge = MONTHLY_CHALLENGES[monthIndex];
    if (!challenge) continue;
    upcoming.push({
      ...challenge,
      monthIndex,
      isCurrentMonth: offset === 0,
    });
  }

  return {
    weekly: { upcoming: [], achieved: [] },
    monthly: { upcoming, achieved: [] },
  };
}
