"use client";

import { useCallback, useRef, useState } from "react";
import { LessonBucketSortGame } from "@/components/academy/lesson/lesson-bucket-sort-game";
import {
  lessonInstructionClass,
  lessonIntroClass,
  lessonSuccessMessageClass,
} from "@/components/academy/lesson/lesson-shared-styles";
import type { BucketSortScreenConfig } from "@/lib/academy/lessons/types";
import {
  celebrateLessonCorrectAnswer,
  signalLessonIncorrectAnswer,
} from "@/lib/academy/lessons/utils";
import { cn } from "@/lib/utils/cn";
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
    signalLessonIncorrectAnswer(flowRef.current.flashScreen, { flash: false });
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

  const introClass = lessonIntroClass(screen.emphasizeInstruction === true);
  const sortLayout = screen.layout ?? "stable-grid";

  if (isStepsRow) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        {screen.title ? (
          <p className={lessonInstructionClass}>{screen.title}</p>
        ) : null}
        <p className={cn(screen.title && "mt-2", introClass)}>{screen.intro}</p>
        <div className="mt-3 flex min-h-0 flex-1 flex-col">
          <LessonBucketSortGame
            items={screen.items}
            buckets={screen.buckets}
            layout={sortLayout}
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
      {screen.title ? (
        <p className={lessonInstructionClass}>{screen.title}</p>
      ) : null}
      <p className={cn(screen.title && "mt-2", introClass)}>{screen.intro}</p>
      <LessonBucketSortGame
        items={screen.items}
        buckets={screen.buckets}
        layout={sortLayout}
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
