"use client";

import { useCallback, useRef, useState } from "react";
import { LessonChoiceButton } from "@/components/academy/lesson/lesson-choice-button";
import { LessonWordDropGame } from "@/components/academy/lesson/lesson-word-drop-game";
import {
  lessonInstructionClass,
  lessonNarrativeClass,
  resolveChoiceVariant,
  usesNeutralChoiceFeedback,
} from "@/components/academy/lesson/lesson-shared-styles";
import { LessonErrorBanner } from "@/components/academy/lesson/lesson-ui";
import type { WordDropScreenConfig } from "@/lib/academy/lessons/types";
import {
  celebrateLessonCorrectAnswer,
  signalLessonIncorrectAnswer,
} from "@/lib/academy/lessons/utils";
import { cn } from "@/lib/utils/cn";
import type { CoreScreenProps } from "./types";

function SingleBlankWordDropScreen({
  screen,
  screenIndex,
  flow,
}: CoreScreenProps<WordDropScreenConfig>) {
  const [choice, setChoice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const neutralSelected = usesNeutralChoiceFeedback(screen.choiceFeedback);

  const handleChoice = (option: string) => {
    setChoice(option);
    if (option === screen.correctOption) {
      setError(null);
      celebrateLessonCorrectAnswer(flow.flashScreen);
      flow.markScreenReady(screenIndex);
      return;
    }
    setError(screen.wrongError);
    flow.incrementMistake();
    signalLessonIncorrectAnswer(flow.flashScreen);
  };

  return (
    <>
      <p className={lessonNarrativeClass}>
        {screen.narrativeBefore}{" "}
        <span className="inline-block min-w-[4.5rem] border-b-2 border-dashed border-[#0CC1E0] px-2 text-center font-heading text-base font-medium text-[#031F82]">
          {choice ?? "______"}
        </span>{" "}
        {screen.narrativeAfter}
      </p>
      <p className={cn("mt-2", lessonInstructionClass)}>
        {screen.promptLabel ?? "Pick the word that fits"}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {screen.options.map((option) => (
          <LessonChoiceButton
            key={option}
            onClick={() => handleChoice(option)}
            selected={choice === option}
            variant={resolveChoiceVariant(
              choice === option,
              option === screen.correctOption,
              neutralSelected,
            )}
            className="w-auto px-6 py-3"
          >
            {option}
          </LessonChoiceButton>
        ))}
      </div>
      {error ? <LessonErrorBanner>{error}</LessonErrorBanner> : null}
    </>
  );
}

export function WordDropScreen({
  screen,
  screenIndex,
  flow,
}: CoreScreenProps<WordDropScreenConfig>) {
  const flowRef = useRef(flow);
  flowRef.current = flow;

  const handleComplete = useCallback(() => {
    flowRef.current.markScreenReady(screenIndex);
  }, [screenIndex]);

  const handleSuccess = useCallback(() => {
    celebrateLessonCorrectAnswer(flowRef.current.flashScreen);
  }, []);

  const handleMistake = useCallback(() => {
    flowRef.current.incrementMistake();
    signalLessonIncorrectAnswer(flowRef.current.flashScreen);
  }, []);

  if (screen.prompt && screen.blanks?.length) {
    return (
      <LessonWordDropGame
        prompt={screen.prompt}
        blanks={screen.blanks}
        wrongError={screen.wrongError}
        successMessage={screen.successMessage}
        promptLabel={screen.promptLabel}
        onComplete={handleComplete}
        onMistake={handleMistake}
        onSuccess={handleSuccess}
      />
    );
  }

  return (
    <SingleBlankWordDropScreen
      screen={screen}
      screenIndex={screenIndex}
      flow={flow}
    />
  );
}
