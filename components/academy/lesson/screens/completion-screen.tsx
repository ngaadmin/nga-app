"use client";

import { LessonSkillMedal } from "@/components/academy/lesson/lesson-skill-medal";
import { LessonCompletionPane } from "@/components/academy/lesson/lesson-completion-pane";
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
    <div className="flex flex-1 flex-col items-center justify-center text-center">
      {screen.skillLearnedLabel ? (
        <p className="font-heading text-xl font-extrabold uppercase tracking-wide text-[#031F82]">
          {screen.skillLearnedLabel}
        </p>
      ) : (
        <p className="font-heading text-xl font-extrabold uppercase tracking-wide text-[#031F82]">
          Lesson Complete!
        </p>
      )}
      {screen.pointsLabel ? (
        <p className="mt-6 font-heading text-base font-extrabold text-[#FFA503]">
          {screen.pointsLabel}
        </p>
      ) : (
        <p className="mt-8 font-heading text-base font-extrabold text-[#FFA503]">
          Points Awarded: {rewards.xpReward} XP
        </p>
      )}
      {screen.bodyCopy ? (
        <p className="mt-6 font-sans text-sm leading-relaxed text-[#1E3A5F]">
          {screen.bodyCopy}
        </p>
      ) : null}
      {flow.skillMedalTier ? (
        <div className="mt-10">
          <LessonSkillMedal
            skillSlug={flow.progressSkillSlug}
            tier={flow.skillMedalTier}
            medalId={screen.medalId}
          />
        </div>
      ) : null}
      {!screen.skillLearnedLabel && flow.skillMedalTier ? (
        <p className="mt-3 font-heading text-sm font-extrabold text-[#031F82]">
          {formatLessonSkillUnlockLine(
            flow.progressSkillSlug,
            flow.skillMedalTier,
          )}
        </p>
      ) : null}
    </div>
  );
}
