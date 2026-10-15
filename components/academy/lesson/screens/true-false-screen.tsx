"use client";

import { useState } from "react";
import {
  LessonIconOption,
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

  const pick = (option: "true" | "false") => {
    if (solved) return;

    setChoice(option);
    if (option === screen.correctAnswer) {
      setError(null);
      setSolved(true);
      celebrateLessonCorrectAnswer();
      flow.markScreenReady(screenIndex);
      return;
    }

    setError(lessonFeedbackCopy(screen.wrongError) ?? "");
    flow.clearScreenReady(screenIndex);
    flow.incrementMistake();
    signalLessonIncorrectAnswer();
  };

  return (
    <LessonScreenLayout
      prompt={screen.prompt}
      emphasizeInstruction={screen.emphasizeInstruction === true}
      errorMessage={error}
    >
      <div className="mt-4 grid grid-cols-2 justify-items-center gap-6">
        {(["true", "false"] as const).map((option) => {
          const wrong = choice === option && option !== screen.correctAnswer;
          return (
            <LessonIconOption
              key={option}
              label={option === "true" ? "True" : "False"}
              emoji={option === "true" ? "✅" : "❌"}
              selected={choice === option}
              selectionVariant={
                wrong ? "wrong" : choice === option && solved ? "correct" : "neutral"
              }
              onClick={() => pick(option)}
            />
          );
        })}
      </div>
    </LessonScreenLayout>
  );
}
