"use client";

import { LessonDragToTargetGame } from "@/components/academy/lesson/lesson-drag-to-target-game";
import { useState } from "react";
import { useLessonScreenFlow } from "@/components/academy/lesson/hooks/use-lesson-screen-flow";
import { LessonScreenLayout, lessonFeedbackCopy } from "@/components/academy/lesson/lesson-ui";
import {
  getIllustrationPath,
  getPairSheetImagePath,
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
  const [error, setError] = useState<string | null>(null);

  return (
    <LessonScreenLayout
      intro={screen.intro}
      emphasizeInstruction={screen.emphasizeInstruction === true}
      success={showSuccess}
      errorMessage={error}
    >
      <LessonDragToTargetGame
        sourceLabel={screen.sourceLabel}
        targetLabel={screen.targetLabel}
        itemEmoji={screen.itemEmoji}
        itemSize={screen.itemSize}
        coinCount={screen.coinCount}
        targetEmoji={screen.targetEmoji}
        sourceIllustrationSrc={
          screen.sourceImageFile
            ? getPairSheetImagePath(screen.sourceImageFile)
            : screen.sourceIllustrationId &&
                isIllustrationId(screen.sourceIllustrationId)
              ? getIllustrationPath(screen.sourceIllustrationId)
              : undefined
        }
        sourceIllustrationAlt={
          screen.sourceIllustrationAlt ?? screen.sourceLabel
        }
        targetIllustrationSrc={
          screen.targetImageFile
            ? getPairSheetImagePath(screen.targetImageFile)
            : screen.targetIllustrationId &&
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
        onSuccess={() => {
          setError(null);
          handleSuccess();
        }}
        onMiss={() => {
          setError(lessonFeedbackCopy(screen.wrongError) ?? null);
          handleMismatch();
        }}
      />
    </LessonScreenLayout>
  );
}
