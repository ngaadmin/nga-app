"use client";

import { useState } from "react";
import { LessonChoiceButton } from "@/components/academy/lesson/lesson-choice-button";
import {
  resolveChoiceVariant,
  usesNeutralChoiceFeedback,
} from "@/components/academy/lesson/lesson-shared-styles";
import { LessonScreenLayout } from "@/components/academy/lesson/lesson-ui";
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
  onPersistentError,
}: StandardScreenProps<TrueFalseScreenConfig> & {
  onPersistentError?: (message: string) => void;
}) {
  const [choice, setChoice] = useState<"true" | "false" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const neutralSelected = usesNeutralChoiceFeedback(screen.choiceFeedback);

  const pick = (option: "true" | "false") => {
    setChoice(option);
    if (option === screen.correctAnswer) {
      setError(null);
      celebrateLessonCorrectAnswer(flow.flashScreen);
      flow.markScreenReady(screenIndex);
      return;
    }
    setError(screen.wrongError);
    flow.incrementMistake();
    if (onPersistentError) {
      onPersistentError(screen.wrongError);
    }
    signalLessonIncorrectAnswer(flow.flashScreen);
  };

  return (
    <LessonScreenLayout
      prompt={screen.prompt}
      emphasizeInstruction={screen.emphasizeInstruction === true}
      errorMessage={error}
    >
      <div className="mt-4 flex gap-3">
        {(["true", "false"] as const).map((option) => (
          <LessonChoiceButton
            key={option}
            onClick={() => pick(option)}
            selected={choice === option}
            variant={resolveChoiceVariant(
              choice === option,
              option === screen.correctAnswer,
              neutralSelected,
            )}
            className="flex-1"
          >
            {option === "true" ? "True" : "False"}
          </LessonChoiceButton>
        ))}
      </div>
    </LessonScreenLayout>
  );
}
