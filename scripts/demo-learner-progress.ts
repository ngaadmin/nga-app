import {
  ACCOUNT_PROGRESS_SCHEMA_VERSION,
  type AccountProgressPayload,
} from "@/lib/dashboard/account-progress";
import { createPhase1MilestoneScaffold } from "@/lib/dashboard/academy-state";
import { WALLET_SCHEMA_VERSION } from "@/lib/dashboard/dashboard-wallet-storage";
import {
  LESSON_COMPLETION_XP,
  LESSON_PERFECT_STREAK_BONUS,
} from "@/lib/academy/lessons/completion-xp";
import { lessonSkillAwards } from "@/lib/skills/lesson-skill-award";

const DEMO_LESSONS_COMPLETE = 3;

/**
 * Lessons 1–3 finished with a perfect cash-in, bronze medals on those three
 * skills, and a practice streak. Lesson 4 stays the next tile.
 */
export function buildDemoLearnerProgress(
  dayStreak: number,
  now = new Date("2026-10-14T00:00:00.000Z"),
): AccountProgressPayload {
  const perLesson = LESSON_COMPLETION_XP + LESSON_PERFECT_STREAK_BONUS;
  const lifetime = perLesson * DEMO_LESSONS_COMPLETE;
  const skillProgress: NonNullable<AccountProgressPayload["skillProgress"]> = {};
  for (let lesson = 1; lesson <= DEMO_LESSONS_COMPLETE; lesson += 1) {
    for (const award of lessonSkillAwards(1, lesson)) {
      skillProgress[award.slug] = award.tier;
    }
  }

  return {
    schemaVersion: ACCOUNT_PROGRESS_SCHEMA_VERSION,
    academyProgress: createPhase1MilestoneScaffold(DEMO_LESSONS_COMPLETE + 1),
    wallet: {
      schemaVersion: WALLET_SCHEMA_VERSION,
      totalPoints: lifetime,
      lifetimePointsEarned: lifetime,
      audSliderIndex: 0,
      xpExchangeRateSet: false,
      updatedAt: now.toISOString(),
      ledger: [1, 2, 3].map((lesson) => ({
        id: `demo-lesson-${lesson}`,
        kind: "earn" as const,
        points: perLesson,
        at: new Date(now.getTime() - (DEMO_LESSONS_COMPLETE - lesson) * 86_400_000).toISOString(),
      })),
    },
    skillProgress,
    vaultProfile: null,
    vaultSession: null,
    dayStreak: Math.max(1, Math.floor(dayStreak)),
  };
}
