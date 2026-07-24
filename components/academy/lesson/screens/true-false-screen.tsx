"use client";

import { useState } from "react";
import { LessonChoiceButton } from "@/components/academy/lesson/lesson-choice-button";
import {
  lessonIntroClass,
  usesNeutralChoiceFeedback,
} from "@/components/academy/lesson/lesson-shared-styles";
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
  const neutralSelected = usesNeutralChoiceFeedback(screen.choiceFeedback);

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
      signalLessonIncorrectAnswer(flow.flashScreen, { flash: !neutralSelected });
    }
  };

  return (
    <>
      <p className={lessonIntroClass(screen.emphasizeInstruction === true)}>
        {screen.prompt}
      </p>
      <div className="mt-6 flex gap-3">
        {(["true", "false"] as const).map((option) => (
          <LessonChoiceButton
            key={option}
            onClick={() => pick(option)}
            selected={choice === option}
            variant={
              neutralSelected || choice !== option
                ? "neutral"
                : option === screen.correctAnswer
                  ? "correct"
                  : "wrong"
            }
            className="flex-1"
          >
            {option === "true" ? "True" : "False"}
          </LessonChoiceButton>
        ))}
      </div>
    </>
  );
}
