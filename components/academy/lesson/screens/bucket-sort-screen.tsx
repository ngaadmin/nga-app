"use client";

import { LessonBucketSortGame } from "@/components/academy/lesson/lesson-bucket-sort-game";
import { LessonSequenceSortGame } from "@/components/academy/lesson/lesson-sequence-sort-game";
import { LessonScreenLayout } from "@/components/academy/lesson/lesson-ui";
import type { BucketSortScreenConfig } from "@/lib/academy/lessons/types";
import type { StandardScreenProps } from "./types";

export function BucketSortScreen({
  screen,
  screenIndex,
  flow,
}: StandardScreenProps<BucketSortScreenConfig>) {
  const handleComplete = () => {
    flow.markScreenReady(screenIndex);
  };

  const sortLayout = screen.layout ?? "statement-sort";

  const game =
    sortLayout === "steps-row" ? (
      <LessonSequenceSortGame
        items={screen.items}
        steps={screen.buckets}
        onComplete={handleComplete}
      />
    ) : (
      <LessonBucketSortGame
        items={screen.items}
        buckets={screen.buckets}
        layout={sortLayout}
        targetTotal={screen.targetTotal}
        poolColumnLabel={screen.poolColumnLabel}
        onComplete={handleComplete}
      />
    );

  return (
    <LessonScreenLayout
      title={screen.title}
      intro={screen.intro}
      cta={screen.cta}
      emphasizeInstruction={screen.emphasizeInstruction === true}
      fill={sortLayout === "steps-row" || sortLayout === "statement-sort"}
    >
      {game}
    </LessonScreenLayout>
  );
}
