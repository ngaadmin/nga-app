"use client";

import { LessonBudgetSelectGame } from "@/components/academy/lesson/lesson-budget-select-game";
import { useLessonScreenFlow } from "@/components/academy/lesson/hooks/use-lesson-screen-flow";
import { LessonScreenLayout } from "@/components/academy/lesson/lesson-ui";
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
  const { completeMessage, handleComplete, handleMistake } = useLessonScreenFlow(
    {
      screenIndex,
      flow,
      successMessage: screen.successMessage,
      onBeforeComplete: onDismissPersistentError,
    },
  );

  return (
    <LessonScreenLayout
      successMessage={completeMessage}
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
        onMistake={handleMistake}
        onPersistentError={onPersistentError}
        onDismissError={onDismissPersistentError}
      />
    </LessonScreenLayout>
  );
}
