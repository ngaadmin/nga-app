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
      moduleNumber={flow.moduleNumber}
      skillMedalTier={
        screen.suppressMedal ? null : (screen.medalTier ?? flow.skillMedalTier)
      }
      medalId={screen.suppressMedal ? undefined : screen.medalId}
      authoredMedal={screen.suppressMedal ? false : screen.authoredMedal}
      suppressMedal={screen.suppressMedal === true}
      skillName={screen.skillName}
      skillLearnedLabel={screen.skillLearnedLabel}
      onCashIn={flow.handleCashInPoints}
      onContinue={flow.handleContinueAfterCashIn}
      cashInDisabled={flow.lessonComplete}
    />
  );
}
