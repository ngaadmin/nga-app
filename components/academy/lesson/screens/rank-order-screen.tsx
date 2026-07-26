"use client";

import { LessonRankOrderGame } from "@/components/academy/lesson/lesson-rank-order-game";
import { useLessonScreenFlow } from "@/components/academy/lesson/hooks/use-lesson-screen-flow";
import { LessonScreenLayout } from "@/components/academy/lesson/lesson-ui";
import type { RankOrderScreenConfig } from "@/lib/academy/lessons/types";
import type { StandardScreenProps } from "./types";

export function RankOrderScreen({
  screen,
  screenIndex,
  flow,
  onPersistentError,
  onDismissPersistentError,
}: StandardScreenProps<RankOrderScreenConfig> & {
  onPersistentError?: (message: string) => void;
  onDismissPersistentError?: () => void;
}) {
  const { completeMessage, handleComplete, handleMistake, handleSuccess } =
    useLessonScreenFlow({
      screenIndex,
      flow,
      successMessage: screen.successMessage,
      onBeforeComplete: onDismissPersistentError,
    });

  return (
    <LessonScreenLayout
      successMessage={completeMessage}
      emphasizeInstruction={screen.emphasizeInstruction === true}
    >
      <LessonRankOrderGame
        intro={screen.intro}
        dragHint={screen.dragHint}
        axisLabel={screen.axisLabel}
        submitLabel={screen.submitLabel}
        items={screen.items}
        correctOrder={screen.correctOrder}
        errors={screen.errors}
        onComplete={handleComplete}
        onMistake={handleMistake}
        onSuccess={handleSuccess}
        onPersistentError={onPersistentError}
        onDismissError={onDismissPersistentError}
      />
    </LessonScreenLayout>
  );
}
