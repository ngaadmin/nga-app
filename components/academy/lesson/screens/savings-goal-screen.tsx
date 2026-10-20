"use client";

import { useEffect, useRef, useState } from "react";
import { useLessonScreenFlow } from "@/components/academy/lesson/hooks/use-lesson-screen-flow";
import { LessonSavingsGoalGame } from "@/components/academy/lesson/lesson-savings-goal-game";
import { usePublishLessonHint } from "@/components/academy/lesson/lesson-hint";
import { lessonIntroClass } from "@/components/academy/lesson/lesson-shared-styles";
import { LessonPromptParagraphs, lessonFeedbackCopy } from "@/components/academy/lesson/lesson-ui";
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
  const [, setGoalReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  usePublishLessonHint(error);
  const { handleMistake } = useLessonScreenFlow({ screenIndex, flow });

  useEffect(() => {
    flowRef.current.clearScreenReady(screenIndex);
  }, [screenIndex]);

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <LessonPromptParagraphs
        text={screen.intro}
        className={cn("shrink-0", lessonIntroClass(screen.emphasizeInstruction === true))}
      />

      <div className="mt-3 flex min-h-0 flex-1 flex-col">
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
              celebrateLessonCorrectAnswer();
              flowRef.current.recordBonusRunCorrect();
            }
            flowRef.current.markScreenReady(screenIndex);
          }}
          onGoalLost={() => {
            celebratedGoalRef.current = false;
            setGoalReady(false);
            flowRef.current.clearScreenReady(screenIndex);
          }}
          onAdvance={() => undefined}
          onMiss={() => {
            setError(lessonFeedbackCopy(screen.wrongError) ?? null);
            handleMistake();
          }}
        />
      </div>
    </div>
  );
}
