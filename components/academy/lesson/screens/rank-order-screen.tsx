"use client";

import { useState } from "react";
import { LessonRankOrderGame } from "@/components/academy/lesson/lesson-rank-order-game";
import { useLessonScreenFlow } from "@/components/academy/lesson/hooks/use-lesson-screen-flow";
import {
  LessonScreenLayout,
  lessonFeedbackCopy,
} from "@/components/academy/lesson/lesson-ui";
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
  const { handleComplete, handleIncomplete, handleMistake, handleSuccess } =
    useLessonScreenFlow({
      screenIndex,
      flow,
      onBeforeComplete: onDismissPersistentError,
    });

  const [error, setError] = useState<string | null>(null);

  return (
    <LessonScreenLayout errorMessage={error}>
      <LessonRankOrderGame
        intro={screen.intro}
        dragHint={screen.dragHint}
        axisLabel={screen.axisLabel}
        submitLabel={screen.submitLabel}
        items={screen.items}
        correctOrder={screen.correctOrder}
        errors={screen.errors}
        onComplete={handleComplete}
        onIncomplete={handleIncomplete}
        onMistake={handleMistake}
        onSuccess={handleSuccess}
        onPersistentError={(message) => {
          const copy = lessonFeedbackCopy(message) ?? null;
          setError(copy);
          if (copy) onPersistentError?.(copy);
        }}
        onDismissError={() => {
          setError(null);
          onDismissPersistentError?.();
        }}
      />
    </LessonScreenLayout>
  );
}
