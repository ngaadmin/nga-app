"use client";

import { useCallback, useState } from "react";
import { useLessonScreenFlow } from "@/components/academy/lesson/hooks/use-lesson-screen-flow";
import { LessonIllustrationSlot } from "@/components/academy/lesson/lesson-illustration-slot";
import { LessonBucketSortGame } from "@/components/academy/lesson/lesson-bucket-sort-game";
import { LessonSequenceSortGame } from "@/components/academy/lesson/lesson-sequence-sort-game";
import { PairedZoneSort } from "@/components/academy/lesson/paired-zone-sort";
import {
  LessonScreenLayout,
  lessonFeedbackCopy,
} from "@/components/academy/lesson/lesson-ui";
import { isPairedZoneSortScreen } from "@/lib/academy/lessons/paired-zone-sort";
import { resolveLessonScreenIllustration } from "@/lib/academy/lessons/resolve-lesson-screen-illustration";
import type { BucketSortScreenConfig } from "@/lib/academy/lessons/types";
import type { StandardScreenProps } from "./types";

export function BucketSortScreen({
  screen,
  screenIndex,
  flow,
}: StandardScreenProps<BucketSortScreenConfig>) {
  const { handleComplete, handleMistake, handleSuccess } = useLessonScreenFlow({
    screenIndex,
    flow,
  });
  const [error, setError] = useState<string | null>(null);

  const reportWrongDrop = () => {
    handleMistake();
    setError(lessonFeedbackCopy(screen.wrongError) ?? null);
  };

  const handleSolved = useCallback(() => {
    handleSuccess();
    handleComplete();
  }, [handleComplete, handleSuccess]);

  const pairedZones = isPairedZoneSortScreen(screen);

  if (pairedZones) {
    const prompt = [screen.intro, screen.cta].filter(Boolean).join("\n");
    return (
      <LessonScreenLayout fill errorMessage={error}>
        <PairedZoneSort
          intro={prompt}
          items={screen.items}
          buckets={screen.buckets}
          orderKey={screen.id}
          mode="drag"
          onComplete={handleSolved}
          onMismatch={reportWrongDrop}
        />
      </LessonScreenLayout>
    );
  }

  const sortLayout = screen.layout ?? "statement-sort";
  const illustration = resolveLessonScreenIllustration(screen);

  const game =
    sortLayout === "steps-row" ? (
      <LessonSequenceSortGame
        items={screen.items}
        steps={screen.buckets}
        orderKey={screen.id}
        onComplete={handleSolved}
        onMismatch={reportWrongDrop}
      />
    ) : (
      <LessonBucketSortGame
        items={screen.items}
        buckets={screen.buckets}
        orderKey={screen.id}
        layout={sortLayout}
        targetTotal={screen.targetTotal}
        poolColumnLabel={screen.poolColumnLabel}
        onComplete={handleSolved}
        onMismatch={reportWrongDrop}
      />
    );

  return (
    <LessonScreenLayout
      title={screen.title}
      intro={screen.intro}
      cta={screen.cta}
      emphasizeInstruction={screen.emphasizeInstruction === true}
      fill={sortLayout === "steps-row" || sortLayout === "statement-sort"}
      errorMessage={error}
    >
      {illustration?.src ? <LessonIllustrationSlot {...illustration} /> : null}
      {game}
    </LessonScreenLayout>
  );
}
