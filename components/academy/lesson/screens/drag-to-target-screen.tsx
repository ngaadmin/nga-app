"use client";

import { LessonDragToTargetGame } from "@/components/academy/lesson/lesson-drag-to-target-game";
import { useLessonScreenFlow } from "@/components/academy/lesson/hooks/use-lesson-screen-flow";
import { LessonScreenLayout } from "@/components/academy/lesson/lesson-ui";
import {
  getIllustrationPath,
  isIllustrationId,
} from "@/lib/academy/illustrations/illustration-registry";
import type { DragToTargetScreenConfig } from "@/lib/academy/lessons/types";
import type { StandardScreenProps } from "./types";

export function DragToTargetScreen({
  screen,
  screenIndex,
  flow,
}: StandardScreenProps<DragToTargetScreenConfig>) {
  const { showSuccess, handleComplete, handleSuccess, handleMismatch } =
    useLessonScreenFlow({
      screenIndex,
      flow,
    });

  return (
    <LessonScreenLayout
      intro={screen.intro}
      emphasizeInstruction={screen.emphasizeInstruction === true}
      success={showSuccess}
    >
      <LessonDragToTargetGame
        sourceLabel={screen.sourceLabel}
        targetLabel={screen.targetLabel}
        itemEmoji={screen.itemEmoji}
        itemSize={screen.itemSize}
        coinCount={screen.coinCount}
        targetEmoji={screen.targetEmoji}
        targetIllustrationSrc={
          screen.targetIllustrationId &&
          isIllustrationId(screen.targetIllustrationId)
            ? getIllustrationPath(screen.targetIllustrationId)
            : undefined
        }
        targetIllustrationAlt={
          screen.targetIllustrationAlt ?? screen.targetLabel
        }
        targetImagePlaceholder={screen.targetImagePlaceholder}
        sourceEmptyMessage={screen.sourceEmptyMessage}
        showZoneLabels={screen.showZoneLabels}
        onComplete={handleComplete}
        onSuccess={handleSuccess}
        onMiss={handleMismatch}
      />
    </LessonScreenLayout>
  );
}
