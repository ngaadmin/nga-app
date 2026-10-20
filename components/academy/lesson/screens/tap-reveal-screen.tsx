"use client";

import { useCallback } from "react";
import { useLessonScreenFlow } from "@/components/academy/lesson/hooks/use-lesson-screen-flow";
import { PairedZoneSort } from "@/components/academy/lesson/paired-zone-sort";
import { LessonScreenLayout } from "@/components/academy/lesson/lesson-ui";
import type { TapRevealScreenConfig } from "@/lib/academy/lessons/types";
import type { StandardScreenProps } from "./types";

/**
 * Short Fun vs More Fun for Longer. A tap flies each item into its zone.
 * Next stays in the lesson footer and turns on when every item has landed.
 */
export function TapRevealScreen({
  screen,
  screenIndex,
  flow,
}: StandardScreenProps<TapRevealScreenConfig>) {
  const { handleComplete } = useLessonScreenFlow({ screenIndex, flow });
  const finish = useCallback(() => {
    handleComplete();
  }, [handleComplete]);

  return (
    <LessonScreenLayout fill gameClassName="min-h-0">
      <PairedZoneSort
        intro={screen.intro}
        items={screen.items}
        buckets={screen.buckets}
        mode="tap"
        onComplete={finish}
      />
    </LessonScreenLayout>
  );
}
