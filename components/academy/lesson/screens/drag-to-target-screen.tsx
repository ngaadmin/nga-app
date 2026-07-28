"use client";

import { LessonDragToTargetGame } from "@/components/academy/lesson/lesson-drag-to-target-game";
import { useLessonScreenFlow } from "@/components/academy/lesson/hooks/use-lesson-screen-flow";
import { LessonScreenLayout } from "@/components/academy/lesson/lesson-ui";
import type { DragToTargetScreenConfig } from "@/lib/academy/lessons/types";
import type { StandardScreenProps } from "./types";

export function DragToTargetScreen({
  screen,
  screenIndex,
  flow,
}: StandardScreenProps<DragToTargetScreenConfig>) {
  const { completeMessage, handleComplete, handleSuccess, handleMismatch } =
    useLessonScreenFlow({
      screenIndex,
      flow,
      successMessage: screen.successMessage,
    });

  return (
    <LessonScreenLayout
      intro={screen.intro}
      emphasizeInstruction={screen.emphasizeInstruction === true}
      successMessage={completeMessage}
    >
      <LessonDragToTargetGame
        sourceLabel={screen.sourceLabel}
        targetLabel={screen.targetLabel}
        itemEmoji={screen.itemEmoji}
        coinCount={screen.coinCount}
        targetEmoji={screen.targetEmoji}
        targetImagePlaceholder={screen.targetImagePlaceholder}
        sourceEmptyMessage={screen.sourceEmptyMessage}
        onComplete={handleComplete}
        onSuccess={handleSuccess}
        onMiss={handleMismatch}
      />
    </LessonScreenLayout>
  );
}
