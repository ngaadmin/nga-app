"use client";

import { LessonCompletionConfetti } from "@/components/academy/lesson/lesson-completion-confetti";
import { LessonCompletionRewardsCard } from "@/components/academy/lesson/lesson-completion-rewards-card";
import { LessonCompletionPane } from "@/components/academy/lesson/lesson-completion-pane";
import { LessonSkillMedal } from "@/components/academy/lesson/lesson-skill-medal";
import {
  lessonCompletionHeaderClass,
  lessonCompletionShellClass,
  lessonCompletionSkillLineClass,
  lessonNarrativeClass,
} from "@/components/academy/lesson/lesson-shared-styles";
import type { CompletionScreenConfig } from "@/lib/academy/lessons/types";
import { formatLessonSkillUnlockLine } from "@/lib/dashboard/skill-trophies";
import type { StandardScreenProps } from "./types";

export function CompletionScreen({
  screen,
  flow,
  rewards,
}: StandardScreenProps<CompletionScreenConfig>) {
  if (screen.useStandardPane !== false && !screen.skillLearnedLabel) {
    return (
      <LessonCompletionPane
        xpReward={rewards.xpReward}
        perfectStreakBonus={rewards.perfectStreakBonus}
        perfectStreak={flow.perfectStreak}
        achievementSkillId={flow.progressSkillSlug}
        skillMedalTier={flow.skillMedalTier}
        medalId={screen.medalId}
      />
    );
  }

  return (
    <>
      <LessonCompletionConfetti />

      <div className={lessonCompletionShellClass}>
        {screen.skillLearnedLabel ? (
          <h2 className={lessonCompletionHeaderClass}>{screen.skillLearnedLabel}</h2>
        ) : (
          <h2 className={lessonCompletionHeaderClass}>Lesson Complete!</h2>
        )}

        {flow.skillMedalTier ? (
          <div className="mt-5 flex w-full justify-center sm:mt-6">
            <LessonSkillMedal
              skillSlug={flow.progressSkillSlug}
              tier={flow.skillMedalTier}
              medalId={screen.medalId}
              size="hero"
            />
          </div>
        ) : null}

        {!screen.skillLearnedLabel && flow.skillMedalTier ? (
          <p className={lessonCompletionSkillLineClass}>
            {formatLessonSkillUnlockLine(
              flow.progressSkillSlug,
              flow.skillMedalTier,
            )}
          </p>
        ) : null}

        {screen.bodyCopy ? (
          <p className={`${lessonNarrativeClass} mt-4 max-w-sm`}>{screen.bodyCopy}</p>
        ) : null}

        <LessonCompletionRewardsCard
          xpReward={rewards.xpReward}
          perfectStreakBonus={rewards.perfectStreakBonus}
          perfectStreak={flow.perfectStreak}
          className={screen.pointsLabel ? "mt-5" : undefined}
        />

        {screen.pointsLabel ? (
          <p className="mt-2 font-heading text-sm font-semibold text-[#1E3A5F]/75">
            {screen.pointsLabel}
          </p>
        ) : null}
      </div>
    </>
  );
}
