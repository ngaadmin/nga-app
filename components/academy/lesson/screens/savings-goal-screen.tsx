"use client";

import { useEffect, useRef, useState } from "react";
import { LessonSavingsGoalGame } from "@/components/academy/lesson/lesson-savings-goal-game";
import { LessonSuccessBanner } from "@/components/academy/lesson/lesson-ui";
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
  const celebratedGoalRef = useRef(false);
  const [goalReady, setGoalReady] = useState(false);

  useEffect(() => {
    flowRef.current.clearScreenReady(screenIndex);
  }, [screenIndex]);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <p className={cn("shrink-0", lessonIntroClass(screen.emphasizeInstruction === true))}>
        {screen.intro}
      </p>

      <div className="mt-2 flex min-h-0 flex-1 flex-col">
        <LessonSavingsGoalGame
          meterLabel={screen.meterLabel}
          targetAmount={screen.targetAmount}
          showsRemaining={screen.showsRemaining === true}
          poolColumnLabel={screen.poolColumnLabel}
          dropZoneLabel={screen.dropZoneLabel}
          items={screen.items}
          workshopSignTitle={screen.workshopSignTitle}
          lockedLabel={screen.lockedLabel}
          unlockedLabel={screen.unlockedLabel}
          goalAchievedLabel={screen.goalAchievedLabel}
          onGoalReady={() => {
            setGoalReady(true);
            if (!celebratedGoalRef.current) {
              celebratedGoalRef.current = true;
              celebrateLessonCorrectAnswer(flowRef.current.flashScreen);
            }
            flowRef.current.markScreenReady(screenIndex);
          }}
          onGoalLost={() => {
            celebratedGoalRef.current = false;
            setGoalReady(false);
            flowRef.current.clearScreenReady(screenIndex);
          }}
          onAdvance={() => undefined}
        />
      </div>
      {goalReady ? <LessonSuccessBanner /> : null}
    </div>
  );
}
