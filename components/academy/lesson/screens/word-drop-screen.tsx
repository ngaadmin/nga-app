"use client";

import { useCallback, useRef, useState } from "react";
import { lessonCardClass } from "@/components/academy/lesson/academy-lesson-shell";
import { LessonChoiceButton } from "@/components/academy/lesson/lesson-choice-button";
import { LessonWordDropGame } from "@/components/academy/lesson/lesson-word-drop-game";
import type { WordDropScreenConfig } from "@/lib/academy/lessons/types";
import { celebrateLessonCorrectAnswer } from "@/lib/academy/lessons/utils";
import { cn } from "@/lib/utils/cn";
import type { CoreScreenProps } from "./types";

function SingleBlankWordDropScreen({
  screen,
  screenIndex,
  flow,
}: CoreScreenProps<WordDropScreenConfig>) {
  const [choice, setChoice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
  };

  return (
    <>
      <p className="font-sans text-sm leading-relaxed text-[#1E3A5F]">
        {screen.narrativeBefore}{" "}
        <span className="inline-block min-w-[5rem] border-b-2 border-dashed border-[#0CC1E0] px-2 font-heading font-extrabold text-[#031F82]">
          {choice ?? "______"}
        </span>{" "}
        {screen.narrativeAfter}
      </p>
      <div className={cn(lessonCardClass, "mt-5 space-y-2")}>
        <p className="font-heading text-[10px] font-bold uppercase tracking-wide text-[#0CC1E0]">
          {screen.promptLabel ?? "Word Drop"}
        </p>
        <div className="flex flex-wrap gap-2">
          {screen.options.map((option) => (
            <LessonChoiceButton
              key={option}
              onClick={() => handleChoice(option)}
              selected={choice === option}
              variant={
                choice === option
                  ? option === screen.correctOption
                    ? "correct"
                    : "wrong"
                  : "neutral"
              }
              className="w-auto px-5 py-2 text-xs"
            >
              {option}
            </LessonChoiceButton>
          ))}
        </div>
      </div>
      {error ? (
        <p className="mt-4 rounded-xl bg-[#FFF7ED] px-3 py-2 font-sans text-xs text-[#031F82]">
          {error}
        </p>
      ) : null}
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
