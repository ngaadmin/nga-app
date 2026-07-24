"use client";

import type { ReactNode } from "react";
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

type ScreenRenderer = (props: LessonScreenRendererProps) => ReactNode;

/** Maps each shipped screen type to its adapter component. */
const LESSON_SCREEN_RENDERERS: Partial<
  Record<ScreenConfig["type"], ScreenRenderer>
> = {
  "word-drop": ({ screen, screenIndex, flow }) => (
    <WordDropScreen
      screen={screen as Extract<ScreenConfig, { type: "word-drop" }>}
      screenIndex={screenIndex}
      flow={flow}
    />
  ),
  "binary-choice": ({ screen, screenIndex, flow, rewards }) => (
    <BinaryChoiceScreen
      screen={screen as Extract<ScreenConfig, { type: "binary-choice" }>}
      screenIndex={screenIndex}
      flow={flow}
      rewards={rewards}
    />
  ),
  "true-false": ({ screen, screenIndex, flow, rewards, onPersistentError }) => (
    <TrueFalseScreen
      screen={screen as Extract<ScreenConfig, { type: "true-false" }>}
      screenIndex={screenIndex}
      flow={flow}
      rewards={rewards}
      onPersistentError={onPersistentError}
    />
  ),
  "tap-reveal": ({ screen, screenIndex, flow, rewards }) => (
    <TapRevealScreen
      screen={screen as Extract<ScreenConfig, { type: "tap-reveal" }>}
      screenIndex={screenIndex}
      flow={flow}
      rewards={rewards}
    />
  ),
  "link-match": ({ screen, screenIndex, flow, rewards }) => (
    <LinkMatchScreen
      screen={screen as Extract<ScreenConfig, { type: "link-match" }>}
      screenIndex={screenIndex}
      flow={flow}
      rewards={rewards}
    />
  ),
  "bucket-sort": ({
    screen,
    screenIndex,
    flow,
    rewards,
    onPersistentError,
    onDismissPersistentError,
  }) => (
    <BucketSortScreen
      screen={screen as Extract<ScreenConfig, { type: "bucket-sort" }>}
      screenIndex={screenIndex}
      flow={flow}
      rewards={rewards}
      onPersistentError={onPersistentError}
      onDismissPersistentError={onDismissPersistentError}
    />
  ),
  "drag-to-target": ({ screen, screenIndex, flow, rewards }) => (
    <DragToTargetScreen
      screen={screen as Extract<ScreenConfig, { type: "drag-to-target" }>}
      screenIndex={screenIndex}
      flow={flow}
      rewards={rewards}
    />
  ),
  "savings-goal": ({ screen, screenIndex, flow, rewards }) => (
    <SavingsGoalScreen
      screen={screen as Extract<ScreenConfig, { type: "savings-goal" }>}
      screenIndex={screenIndex}
      flow={flow}
      rewards={rewards}
    />
  ),
  "hold-to-fill": ({ screen, screenIndex, flow, rewards }) => (
    <HoldToFillScreen
      screen={screen as Extract<ScreenConfig, { type: "hold-to-fill" }>}
      screenIndex={screenIndex}
      flow={flow}
      rewards={rewards}
    />
  ),
  "narrative-bonus": ({
    screen,
    screenIndex,
    flow,
    rewards,
    awardBonusXp,
  }) => (
    <NarrativeBonusScreen
      screen={screen as Extract<ScreenConfig, { type: "narrative-bonus" }>}
      screenIndex={screenIndex}
      flow={flow}
      rewards={rewards}
      awardBonusXp={awardBonusXp}
    />
  ),
  "spotlight-rounds": ({
    screen,
    screenIndex,
    flow,
    rewards,
    onPersistentError,
    onDismissPersistentError,
  }) => (
    <SpotlightRoundsScreen
      screen={screen as Extract<ScreenConfig, { type: "spotlight-rounds" }>}
      screenIndex={screenIndex}
      flow={flow}
      rewards={rewards}
      onPersistentError={onPersistentError}
      onDismissError={onDismissPersistentError}
    />
  ),
  completion: ({ screen, screenIndex, flow, rewards }) => (
    <CompletionScreen
      screen={screen as Extract<ScreenConfig, { type: "completion" }>}
      screenIndex={screenIndex}
      flow={flow}
      rewards={rewards}
    />
  ),
  custom: () => null,
};

export function LessonScreenRenderer(props: LessonScreenRendererProps) {
  const render = LESSON_SCREEN_RENDERERS[props.screen.type];
  return render ? render(props) : null;
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

/** Screen types registered in the renderer (for audits and tooling). */
export const REGISTERED_LESSON_SCREEN_TYPES = Object.keys(
  LESSON_SCREEN_RENDERERS,
) as ScreenConfig["type"][];
