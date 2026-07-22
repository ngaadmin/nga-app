"use client";

import { useCallback, useRef, useState } from "react";
import { LessonDragToTargetGame } from "@/components/academy/lesson/lesson-drag-to-target-game";
import { lessonSuccessMessageClass } from "@/components/academy/lesson/lesson-shared-styles";
import type { DragToTargetScreenConfig } from "@/lib/academy/lessons/types";
import {
  celebrateLessonCorrectAnswer,
  signalLessonIncorrectAnswer,
} from "@/lib/academy/lessons/utils";
import type { StandardScreenProps } from "./types";

export function DragToTargetScreen({
  screen,
  screenIndex,
  flow,
}: StandardScreenProps<DragToTargetScreenConfig>) {
  const [completeMessage, setCompleteMessage] = useState<string | null>(null);
  const flowRef = useRef(flow);
  flowRef.current = flow;

  const handleComplete = useCallback(() => {
    if (screen.successMessage) {
      setCompleteMessage(screen.successMessage);
    }
    flowRef.current.markScreenReady(screenIndex);
  }, [screen.successMessage, screenIndex]);

  const handleSuccess = useCallback(() => {
    celebrateLessonCorrectAnswer(flowRef.current.flashScreen);
  }, []);

  const handleMiss = useCallback(() => {
    signalLessonIncorrectAnswer(flowRef.current.flashScreen);
  }, []);

  return (
    <>
      <p className="font-sans text-sm leading-relaxed text-[#1E3A5F]">{screen.intro}</p>
      <LessonDragToTargetGame
        sourceLabel={screen.sourceLabel}
        targetLabel={screen.targetLabel}
        itemEmoji={screen.itemEmoji}
        coinCount={screen.coinCount}
        onComplete={handleComplete}
        onSuccess={handleSuccess}
        onMiss={handleMiss}
      />
      {completeMessage ? (
        <p className={lessonSuccessMessageClass}>{completeMessage}</p>
      ) : null}
    </>
  );
}
