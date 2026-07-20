"use client";

import type { LessonFlow } from "@/lib/academy/lessons/hooks/use-lesson-flow";
import type { LessonRewards, ScreenConfig } from "@/lib/academy/lessons/types";
import { LESSON_CASH_IN_LABEL } from "@/components/academy/lesson/lesson-shared-styles";
import { BinaryChoiceScreen } from "./screens/binary-choice-screen";
import { BucketSortScreen } from "./screens/bucket-sort-screen";
import { CompletionScreen } from "./screens/completion-screen";
import { DragToTargetScreen } from "./screens/drag-to-target-screen";
import { HoldToFillScreen } from "./screens/hold-to-fill-screen";
import { LinkMatchScreen } from "./screens/link-match-screen";
import { NarrativeBonusScreen } from "./screens/narrative-bonus-screen";
import { SavingsGoalScreen } from "./screens/savings-goal-screen";
import { SpotlightRoundsScreen } from "./screens/spotlight-rounds-screen";
import { TapRevealScreen } from "./screens/tap-reveal-screen";
import { TrueFalseScreen } from "./screens/true-false-screen";
import { WordDropScreen } from "./screens/word-drop-screen";

export type LessonScreenRendererProps = {
  screen: ScreenConfig;
  screenIndex: number;
  flow: LessonFlow;
  rewards: LessonRewards;
  awardBonusXp?: (amount: number) => void;
  onPersistentError?: (message: string) => void;
  onDismissPersistentError?: () => void;
};

export function LessonScreenRenderer({
  screen,
  screenIndex,
  flow,
  rewards,
  awardBonusXp,
  onPersistentError,
  onDismissPersistentError,
}: LessonScreenRendererProps) {
  switch (screen.type) {
    case "word-drop":
      return (
        <WordDropScreen
          screen={screen}
          screenIndex={screenIndex}
          flow={flow}
        />
      );
    case "binary-choice":
      return (
        <BinaryChoiceScreen
          screen={screen}
          screenIndex={screenIndex}
          flow={flow}
          rewards={rewards}
        />
      );
    case "true-false":
      return (
        <TrueFalseScreen
          screen={screen}
          screenIndex={screenIndex}
          flow={flow}
          rewards={rewards}
          onPersistentError={onPersistentError}
        />
      );
    case "tap-reveal":
      return (
        <TapRevealScreen
          screen={screen}
          screenIndex={screenIndex}
          flow={flow}
          rewards={rewards}
        />
      );
    case "link-match":
      return (
        <LinkMatchScreen
          screen={screen}
          screenIndex={screenIndex}
          flow={flow}
          rewards={rewards}
        />
      );
    case "bucket-sort":
      return (
        <BucketSortScreen
          screen={screen}
          screenIndex={screenIndex}
          flow={flow}
          rewards={rewards}
          onPersistentError={onPersistentError}
          onDismissPersistentError={onDismissPersistentError}
        />
      );
    case "drag-to-target":
      return (
        <DragToTargetScreen
          screen={screen}
          screenIndex={screenIndex}
          flow={flow}
          rewards={rewards}
        />
      );
    case "savings-goal":
      return (
        <SavingsGoalScreen
          screen={screen}
          screenIndex={screenIndex}
          flow={flow}
          rewards={rewards}
        />
      );
    case "hold-to-fill":
      return (
        <HoldToFillScreen
          screen={screen}
          screenIndex={screenIndex}
          flow={flow}
          rewards={rewards}
        />
      );
    case "narrative-bonus":
      return (
        <NarrativeBonusScreen
          screen={screen}
          screenIndex={screenIndex}
          flow={flow}
          rewards={rewards}
          awardBonusXp={awardBonusXp}
        />
      );
    case "spotlight-rounds":
      return (
        <SpotlightRoundsScreen
          screen={screen}
          screenIndex={screenIndex}
          flow={flow}
          rewards={rewards}
          onPersistentError={onPersistentError}
          onDismissError={onDismissPersistentError}
        />
      );
    case "completion":
      return (
        <CompletionScreen
          screen={screen}
          screenIndex={screenIndex}
          flow={flow}
          rewards={rewards}
        />
      );
    case "custom":
      return null;
    default:
      return null;
  }
}

export function getCompletionFooterLabel(
  screens: readonly ScreenConfig[],
  lessonComplete: boolean,
): string {
  const completion = screens.find((s) => s.type === "completion");
  if (lessonComplete) return "Returning...";
  if (completion?.type === "completion" && completion.returnButtonLabel) {
    return completion.returnButtonLabel;
  }
  return LESSON_CASH_IN_LABEL;
}
