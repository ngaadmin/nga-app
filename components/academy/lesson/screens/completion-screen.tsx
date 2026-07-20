"use client";

import { LessonCompletionPane } from "@/components/academy/lesson/lesson-completion-pane";
import type { CompletionScreenConfig } from "@/lib/academy/lessons/types";
import { formatLessonBronzeSkillLine } from "@/lib/dashboard/skill-trophies";
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
        achievementSkillId={rewards.achievementSkillSlug}
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
      <p className="mt-10 text-4xl" aria-hidden>
        🥉
      </p>
      {!screen.skillLearnedLabel ? (
        <p className="mt-3 font-heading text-sm font-extrabold text-[#031F82]">
          {formatLessonBronzeSkillLine(rewards.achievementSkillSlug)}
        </p>
      ) : null}
    </div>
  );
}
