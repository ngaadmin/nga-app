"use client";

import { LessonCompletionConfetti } from "@/components/academy/lesson/lesson-completion-confetti";
import { LessonCompletionRewardsCard } from "@/components/academy/lesson/lesson-completion-rewards-card";
import { LessonSkillMedal } from "@/components/academy/lesson/lesson-skill-medal";
import {
  lessonCompletionEyebrowClass,
  lessonCompletionHeaderClass,
  lessonCompletionShellClass,
  lessonCompletionSkillLineClass,
} from "@/components/academy/lesson/lesson-shared-styles";
import {
  formatLessonSkillUnlockLine,
} from "@/lib/dashboard/skill-trophies";
import type { MedalIllustrationId } from "@/lib/academy/illustrations/medal-registry";
import type { SkillTrophyTier } from "@/lib/dashboard/skill-trophies";

type LessonCompletionPaneProps = {
  xpReward: number;
  perfectStreakBonus: number;
  perfectStreak: boolean;
  achievementSkillId: string;
  skillMedalTier: Extract<SkillTrophyTier, "unlocked" | "bronze"> | null;
  medalId?: MedalIllustrationId;
};

export function LessonCompletionPane({
  xpReward,
  perfectStreakBonus,
  perfectStreak,
  achievementSkillId,
  skillMedalTier,
  medalId,
}: LessonCompletionPaneProps) {
  return (
    <>
      <LessonCompletionConfetti />

      <div className={lessonCompletionShellClass}>
        <p className={lessonCompletionEyebrowClass}>Achievement Unlocked</p>
        <h2 className={`${lessonCompletionHeaderClass} mt-1`}>Lesson Complete!</h2>

        {skillMedalTier ? (
          <>
            <div className="mt-5 flex w-full justify-center sm:mt-6">
              <LessonSkillMedal
                skillSlug={achievementSkillId}
                tier={skillMedalTier}
                medalId={medalId}
                size="hero"
              />
            </div>

            <p className={lessonCompletionSkillLineClass}>
              {formatLessonSkillUnlockLine(achievementSkillId, skillMedalTier)}
            </p>
          </>
        ) : null}

        <LessonCompletionRewardsCard
          xpReward={xpReward}
          perfectStreakBonus={perfectStreakBonus}
          perfectStreak={perfectStreak}
        />
      </div>
    </>
  );
}
