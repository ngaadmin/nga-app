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
      <div className="mt-3 grid grid-cols-2 gap-3">
        {(["true", "false"] as const).map((option) => (
          <LessonChoiceButton
            key={option}
            onClick={() => pick(option)}
            selected={choice === option}
            emoji={option === "true" ? "✅" : "❌"}
            className="justify-center text-center [&>span:last-child]:flex-none [&>span:last-child]:text-center"
          >
            {option === "true" ? "True" : "False"}
          </LessonChoiceButton>
        ))}
      </div>
    </LessonScreenLayout>
  );
}
