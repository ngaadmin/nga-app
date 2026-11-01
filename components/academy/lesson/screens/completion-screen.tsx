"use client";

import { LessonCompletionPane } from "@/components/academy/lesson/lesson-completion-pane";
import { useDashboardWallet } from "@/lib/dashboard/dashboard-wallet-context";
import type { CompletionScreenConfig } from "@/lib/academy/lessons/types";
import type { StandardScreenProps } from "./types";

export function CompletionScreen({
  screen,
  flow,
  rewards,
}: StandardScreenProps<CompletionScreenConfig>) {
  const { spendableXp } = useDashboardWallet();
  return (
    <LessonCompletionPane
      spendableXp={spendableXp}
      xpReward={rewards.xpReward}
      perfectStreakBonus={rewards.perfectStreakBonus}
      perfectStreak={flow.perfectStreak}
      bonusCoins={flow.bonusCoins}
      bonusRuns={flow.bonusRuns}
      achievementSkillId={flow.progressSkillSlug}
      lessonNumber={flow.lessonNumber}
      moduleNumber={flow.moduleNumber}
      skillMedalTier={
        screen.suppressMedal ? null : (screen.medalTier ?? flow.skillMedalTier)
      }
      medalId={screen.suppressMedal ? undefined : screen.medalId}
      medalSrc={screen.suppressMedal ? undefined : screen.medalSrc}
      authoredMedal={screen.suppressMedal ? false : screen.authoredMedal}
      suppressMedal={screen.suppressMedal === true}
      skillName={screen.skillName}
      leadCharacter={screen.leadCharacter}
      portraitSrc={screen.portraitSrc}
      skillLearnedLabel={screen.skillLearnedLabel}
      onCashIn={flow.handleCashInPoints}
      onContinue={flow.handleContinueAfterCashIn}
      cashInDisabled={flow.lessonComplete}
    />
  );
}
