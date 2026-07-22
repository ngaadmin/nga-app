"use client";

import { useCallback, useRef, useState } from "react";
import { LessonBucketSortGame } from "@/components/academy/lesson/lesson-bucket-sort-game";
import { lessonSuccessMessageClass } from "@/components/academy/lesson/lesson-shared-styles";
import type { BucketSortScreenConfig } from "@/lib/academy/lessons/types";
import {
  celebrateLessonCorrectAnswer,
  signalLessonIncorrectAnswer,
} from "@/lib/academy/lessons/utils";
import type { StandardScreenProps } from "./types";

export function BucketSortScreen({
  screen,
  screenIndex,
  flow,
  onPersistentError,
  onDismissPersistentError,
}: StandardScreenProps<BucketSortScreenConfig> & {
  onPersistentError?: (message: string) => void;
  onDismissPersistentError?: () => void;
}) {
  const [completeMessage, setCompleteMessage] = useState<string | null>(null);
  const flowRef = useRef(flow);
  flowRef.current = flow;

  const handleComplete = useCallback(() => {
    onDismissPersistentError?.();
    if (screen.successMessage) {
      setCompleteMessage(screen.successMessage);
    }
    flowRef.current.markScreenReady(screenIndex);
  }, [onDismissPersistentError, screen.successMessage, screenIndex]);

  const handleMistake = useCallback(() => {
    flowRef.current.incrementMistake();
    signalLessonIncorrectAnswer(flowRef.current.flashScreen);
  }, []);

  const handleSuccess = useCallback(() => {
    celebrateLessonCorrectAnswer(flowRef.current.flashScreen);
  }, []);

  const handleWrongDrop = useCallback(
    (itemId: string) => {
      const item = screen.items.find((entry) => entry.id === itemId);
      if (item?.wrongDropError) {
        onPersistentError?.(item.wrongDropError);
      }
    },
    [onPersistentError, screen.items],
  );

  const isStepsRow = screen.layout === "steps-row";

  if (isStepsRow) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <p className="font-sans text-sm leading-relaxed text-[#1E3A5F]">{screen.intro}</p>
        <div className="mt-3 flex min-h-0 flex-1 flex-col">
          <LessonBucketSortGame
            items={screen.items}
            buckets={screen.buckets}
            layout={screen.layout}
            targetTotal={screen.targetTotal}
            onComplete={handleComplete}
            onMistake={handleMistake}
            onSuccess={handleSuccess}
            onWrongDrop={handleWrongDrop}
          />
        </div>
        {completeMessage ? (
          <p className={lessonSuccessMessageClass}>{completeMessage}</p>
        ) : null}
      </div>
    );
  }

  return (
    <>
      <p className="font-sans text-sm leading-relaxed text-[#1E3A5F]">{screen.intro}</p>
      <LessonBucketSortGame
        items={screen.items}
        buckets={screen.buckets}
        layout={screen.layout}
        targetTotal={screen.targetTotal}
        onComplete={handleComplete}
        onMistake={handleMistake}
        onSuccess={handleSuccess}
        onWrongDrop={handleWrongDrop}
      />
      {completeMessage ? (
        <p className={lessonSuccessMessageClass}>{completeMessage}</p>
      ) : null}
    </>
  );
}
