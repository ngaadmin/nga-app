"use client";

import { LessonCompletionPane } from "@/components/academy/lesson/lesson-completion-pane";
import type { CompletionScreenConfig } from "@/lib/academy/lessons/types";
import type { StandardScreenProps } from "./types";

export function CompletionScreen({
  screen,
  flow,
  rewards,
}: StandardScreenProps<CompletionScreenConfig>) {
  return (
    <LessonCompletionPane
      xpReward={rewards.xpReward}
      perfectStreakBonus={rewards.perfectStreakBonus}
      perfectStreak={flow.perfectStreak}
      achievementSkillId={flow.progressSkillSlug}
      lessonNumber={flow.lessonNumber}
      skillMedalTier={flow.skillMedalTier}
      medalId={screen.medalId}
      skillLearnedLabel={screen.skillLearnedLabel}
      onCashIn={flow.handleCashInPoints}
      cashInDisabled={flow.lessonComplete}
    />
  );
}
