"use client";

import { useCallback, useRef } from "react";
import { LessonSavingsGoalGame } from "@/components/academy/lesson/lesson-savings-goal-game";
import { lessonIntroClass } from "@/components/academy/lesson/lesson-shared-styles";
import type { SavingsGoalScreenConfig } from "@/lib/academy/lessons/types";
import { celebrateLessonCorrectAnswer } from "@/lib/academy/lessons/utils";
import { cn } from "@/lib/utils/cn";
import type { StandardScreenProps } from "./types";

export function SavingsGoalScreen({
  screen,
  screenIndex,
  flow,
}: StandardScreenProps<SavingsGoalScreenConfig>) {
  const flowRef = useRef(flow);
  flowRef.current = flow;

  const handleGoalReady = useCallback(() => {
    flowRef.current.markScreenReady(screenIndex);
  }, [screenIndex]);

  const handleAdvance = useCallback(() => {
    flowRef.current.handleNext();
  }, []);

  const handleItemSaved = useCallback(() => {
    celebrateLessonCorrectAnswer(flowRef.current.flashScreen);
  }, []);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <p className={cn("shrink-0", lessonIntroClass(screen.emphasizeInstruction === true))}>
        {screen.intro}
      </p>

      <div className="mt-2 flex min-h-0 flex-1 flex-col">
        <LessonSavingsGoalGame
          meterLabel={screen.meterLabel}
          targetAmount={screen.targetAmount}
          poolColumnLabel={screen.poolColumnLabel}
          dropZoneLabel={screen.dropZoneLabel}
          items={screen.items}
          workshopSignTitle={screen.workshopSignTitle}
          lockedLabel={screen.lockedLabel}
          unlockedLabel={screen.unlockedLabel}
          goalAchievedLabel={screen.goalAchievedLabel}
          onGoalReady={handleGoalReady}
          onAdvance={handleAdvance}
          onItemSaved={handleItemSaved}
        />
      </div>
    </div>
  );
}
