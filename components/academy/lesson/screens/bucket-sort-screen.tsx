"use client";

import { LessonBucketSortGame } from "@/components/academy/lesson/lesson-bucket-sort-game";
import { LessonSequenceSortGame } from "@/components/academy/lesson/lesson-sequence-sort-game";
import { useLessonScreenFlow } from "@/components/academy/lesson/hooks/use-lesson-screen-flow";
import { LessonScreenLayout } from "@/components/academy/lesson/lesson-ui";
import type { BucketSortScreenConfig } from "@/lib/academy/lessons/types";
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
  const { completeMessage, handleComplete, handleMistake, handleSuccess } =
    useLessonScreenFlow({
      screenIndex,
      flow,
      successMessage: screen.successMessage,
      onBeforeComplete: onDismissPersistentError,
    });

  const handleWrongDrop = (itemId: string) => {
    const item = screen.items.find((entry) => entry.id === itemId);
    if (item?.wrongDropError) {
      onPersistentError?.(item.wrongDropError);
    }
  };

  const sortLayout = screen.layout ?? "statement-sort";

  const game =
    sortLayout === "steps-row" ? (
      <LessonSequenceSortGame
        items={screen.items}
        steps={screen.buckets}
        onComplete={handleComplete}
        onMistake={handleMistake}
        onSuccess={handleSuccess}
        onWrongDrop={handleWrongDrop}
      />
    ) : (
      <LessonBucketSortGame
        items={screen.items}
        buckets={screen.buckets}
        layout={sortLayout}
        targetTotal={screen.targetTotal}
        poolColumnLabel={screen.poolColumnLabel}
        onComplete={handleComplete}
        onMistake={handleMistake}
        onSuccess={handleSuccess}
        onWrongDrop={handleWrongDrop}
      />
    );

  return (
    <LessonScreenLayout
      title={screen.title}
      intro={screen.intro}
      emphasizeInstruction={screen.emphasizeInstruction === true}
      successMessage={completeMessage}
      fill={sortLayout === "steps-row" || sortLayout === "statement-sort"}
    >
      {game}
    </LessonScreenLayout>
  );
}
