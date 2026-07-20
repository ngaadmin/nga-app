"use client";

import { useCallback, useRef } from "react";
import { LessonSavingsGoalGame } from "@/components/academy/lesson/lesson-savings-goal-game";
import type { SavingsGoalScreenConfig } from "@/lib/academy/lessons/types";
import { celebrateLessonCorrectAnswer } from "@/lib/academy/lessons/utils";
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
      <p className="shrink-0 font-sans text-xs leading-snug text-[#1E3A5F]">
        {screen.intro}
      </p>

      {screen.imagePlaceholder ? (
        <div
          className="mt-2 flex h-20 w-full shrink-0 flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#BDE9FB] bg-[#F7FBFF] px-3 text-center"
          role="img"
          aria-label={screen.imagePlaceholder.alt ?? screen.imagePlaceholder.label}
        >
          <p className="font-heading text-[9px] font-bold uppercase tracking-wide text-[#0CC1E0]">
            Image placeholder
          </p>
          <p className="mt-0.5 font-heading text-[11px] font-bold leading-tight text-[#031F82]">
            {screen.imagePlaceholder.label}
          </p>
        </div>
      ) : null}

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
