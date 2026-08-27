"use client";

import { LessonAllocationSliderGame } from "@/components/academy/lesson/lesson-allocation-slider-game";
import { useLessonScreenFlow } from "@/components/academy/lesson/hooks/use-lesson-screen-flow";
import { LessonScreenLayout } from "@/components/academy/lesson/lesson-ui";
import type { AllocationSliderScreenConfig } from "@/lib/academy/lessons/types";
import type { StandardScreenProps } from "./types";

export function AllocationSliderScreen({
  screen,
  screenIndex,
  flow,
}: StandardScreenProps<AllocationSliderScreenConfig>) {
  const {
    showSuccess,
    handleComplete,
    handleIncomplete,
    handleSuccess,
  } = useLessonScreenFlow({
    screenIndex,
    flow,
  });

  return (
    <LessonScreenLayout
      success={showSuccess}
      emphasizeInstruction={screen.emphasizeInstruction === true}
      fill
    >
      <LessonAllocationSliderGame
        intro={screen.intro}
        total={screen.total}
        targetMin={screen.targetMin}
        reserveGoals={screen.reserveGoals}
        spendItems={screen.spendItems}
        sliderError={screen.sliderError}
        onComplete={handleComplete}
        onIncomplete={handleIncomplete}
        onSuccess={handleSuccess}
      />
    </LessonScreenLayout>
  );
}
