"use client";

import { useState } from "react";
import { lessonCardClass } from "@/components/academy/lesson/academy-lesson-shell";
import { LessonChoiceButton } from "@/components/academy/lesson/lesson-choice-button";
import type { TrueFalseScreenConfig } from "@/lib/academy/lessons/types";
import {
  celebrateLessonCorrectAnswer,
  signalLessonIncorrectAnswer,
} from "@/lib/academy/lessons/utils";
import { cn } from "@/lib/utils/cn";
import type { StandardScreenProps } from "./types";

export function TrueFalseScreen({
  screen,
  screenIndex,
  flow,
  onPersistentError,
}: StandardScreenProps<TrueFalseScreenConfig> & {
  onPersistentError?: (message: string) => void;
}) {
  const [choice, setChoice] = useState<"true" | "false" | null>(null);

  const pick = (option: "true" | "false") => {
    setChoice(option);
    if (option === screen.correctAnswer) {
      celebrateLessonCorrectAnswer(flow.flashScreen);
      flow.markScreenReady(screenIndex);
      return;
    }
    flow.incrementMistake();
    if (onPersistentError) {
      onPersistentError(screen.wrongError);
    } else {
      signalLessonIncorrectAnswer(flow.flashScreen);
    }
  };

  return (
    <>
      <p className="font-sans text-sm leading-relaxed text-[#1E3A5F]">{screen.prompt}</p>
      <div className={cn(lessonCardClass, "mt-5")}>
        <p className="font-heading text-[10px] font-bold uppercase tracking-wide text-[#0CC1E0]">
          {screen.promptLabel ?? "True or False"}
        </p>
        <div className="mt-3 flex gap-3">
          {(["true", "false"] as const).map((option) => (
            <LessonChoiceButton
              key={option}
              onClick={() => pick(option)}
              selected={choice === option}
              variant={
                choice === option
                  ? option === screen.correctAnswer
                    ? "correct"
                    : "wrong"
                  : "neutral"
              }
              className="flex-1 text-center uppercase"
            >
              {option}
            </LessonChoiceButton>
          ))}
        </div>
      </div>
    </>
  );
}
