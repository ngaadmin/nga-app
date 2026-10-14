"use client";

import { useLessonScreenFlow } from "@/components/academy/lesson/hooks/use-lesson-screen-flow";
import { LessonIllustrationSlot } from "@/components/academy/lesson/lesson-illustration-slot";
import { LessonBucketSortGame } from "@/components/academy/lesson/lesson-bucket-sort-game";
import { LessonSequenceSortGame } from "@/components/academy/lesson/lesson-sequence-sort-game";
import { LessonScreenLayout } from "@/components/academy/lesson/lesson-ui";
import { resolveLessonScreenIllustration } from "@/lib/academy/lessons/resolve-lesson-screen-illustration";
import type { BucketSortScreenConfig } from "@/lib/academy/lessons/types";
import type { StandardScreenProps } from "./types";

export function BucketSortScreen({
  screen,
  screenIndex,
  flow,
}: StandardScreenProps<BucketSortScreenConfig>) {
  const { showSuccess, handleComplete, handleSuccess, handleMismatch } =
    useLessonScreenFlow({
      screenIndex,
      flow,
    });

  const handleSolved = () => {
    handleSuccess();
    handleComplete();
  };

  const sortLayout = screen.layout ?? "statement-sort";
  const illustration = resolveLessonScreenIllustration(screen);

  const game =
    sortLayout === "steps-row" ? (
      <LessonSequenceSortGame
        items={screen.items}
        steps={screen.buckets}
        onComplete={handleSolved}
        onMismatch={handleMismatch}
      />
    ) : (
      <LessonBucketSortGame
        items={screen.items}
        buckets={screen.buckets}
        layout={sortLayout}
        targetTotal={screen.targetTotal}
        poolColumnLabel={screen.poolColumnLabel}
        onComplete={handleSolved}
        onMismatch={handleMismatch}
      />
    );

  return (
    <LessonScreenLayout
      title={screen.title}
      intro={screen.intro}
      cta={screen.cta}
      emphasizeInstruction={screen.emphasizeInstruction === true}
      success={showSuccess}
      fill={sortLayout === "steps-row" || sortLayout === "statement-sort"}
    >
      {illustration?.src ? <LessonIllustrationSlot {...illustration} /> : null}
      {game}
    </LessonScreenLayout>
  );
}
