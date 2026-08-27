"use client";

import { useState } from "react";
import { LessonBudgetSelectGame } from "@/components/academy/lesson/lesson-budget-select-game";
import { useLessonScreenFlow } from "@/components/academy/lesson/hooks/use-lesson-screen-flow";
import {
  LessonScreenLayout,
  lessonFeedbackCopy,
} from "@/components/academy/lesson/lesson-ui";
import type { BudgetSelectScreenConfig } from "@/lib/academy/lessons/types";
import type { StandardScreenProps } from "./types";

export function BudgetSelectScreen({
  screen,
  screenIndex,
  flow,
  onPersistentError,
  onDismissPersistentError,
}: StandardScreenProps<BudgetSelectScreenConfig> & {
  onPersistentError?: (message: string) => void;
  onDismissPersistentError?: () => void;
}) {
  const { showSuccess, handleComplete, handleIncomplete, handleMistake } =
    useLessonScreenFlow({
      screenIndex,
      flow,
      onBeforeComplete: onDismissPersistentError,
    });

  const [error, setError] = useState<string | null>(null);

  return (
    <LessonScreenLayout
      success={showSuccess}
      errorMessage={error}
      emphasizeInstruction={screen.emphasizeInstruction === true}
    >
      <LessonBudgetSelectGame
        intro={screen.intro}
        walletLabel={screen.walletLabel}
        total={screen.total}
        items={screen.items}
        correctIds={screen.correctIds}
        errors={screen.errors}
        onComplete={handleComplete}
        onIncomplete={handleIncomplete}
        onMistake={handleMistake}
        onPersistentError={(message) => {
          const copy = lessonFeedbackCopy(message) ?? "";
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
