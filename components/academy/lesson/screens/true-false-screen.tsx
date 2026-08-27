"use client";

import { useState } from "react";
import { useLessonSuccessFlash } from "@/components/academy/lesson/hooks/use-lesson-screen-flow";
import { LessonChoiceButton } from "@/components/academy/lesson/lesson-choice-button";
import {
  LessonScreenLayout,
  lessonFeedbackCopy,
} from "@/components/academy/lesson/lesson-ui";
import type { TrueFalseScreenConfig } from "@/lib/academy/lessons/types";
import {
  celebrateLessonCorrectAnswer,
  signalLessonIncorrectAnswer,
} from "@/lib/academy/lessons/utils";
import type { StandardScreenProps } from "./types";

export function TrueFalseScreen({
  screen,
  screenIndex,
  flow,
}: StandardScreenProps<TrueFalseScreenConfig> & {
  onPersistentError?: (message: string) => void;
}) {
  const [choice, setChoice] = useState<"true" | "false" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [solved, setSolved] = useState(false);
  const showSuccess = useLessonSuccessFlash(solved);

  const pick = (option: "true" | "false") => {
    if (solved) return;

    setChoice(option);
    if (option === screen.correctAnswer) {
      setError(null);
      setSolved(true);
      celebrateLessonCorrectAnswer(flow.flashScreen);
      flow.markScreenReady(screenIndex);
      return;
    }

    setError(lessonFeedbackCopy(screen.wrongError) ?? "");
    flow.clearScreenReady(screenIndex);
    flow.incrementMistake();
    signalLessonIncorrectAnswer(flow.flashScreen);
  };

  return (
    <LessonScreenLayout
      prompt={screen.prompt}
      emphasizeInstruction={screen.emphasizeInstruction === true}
      errorMessage={error}
      success={showSuccess}
    >
      <div className="mt-2.5 flex justify-between gap-7 px-1">
        {(["true", "false"] as const).map((option) => (
          <LessonChoiceButton
            key={option}
            onClick={() => pick(option)}
            selected={choice === option}
            orbLabel={option === "true" ? "T" : "F"}
            className="w-[calc(50%-14px)] flex-col gap-2 [&>span:last-child]:flex-none"
          >
            <span className="whitespace-normal text-center text-sm font-semibold leading-[1.3]">
              {option === "true" ? "True" : "False"}
            </span>
          </LessonChoiceButton>
        ))}
      </div>
    </LessonScreenLayout>
  );
}
