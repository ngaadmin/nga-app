"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLessonScreenFlow } from "@/components/academy/lesson/hooks/use-lesson-screen-flow";
import {
  LessonWordDropGame,
  type LessonWordDropGameHandle,
} from "@/components/academy/lesson/lesson-word-drop-game";
import { usePublishLessonHint } from "@/components/academy/lesson/lesson-hint";
import { lessonFeedbackCopy } from "@/components/academy/lesson/lesson-ui";
import type { WordDropScreenConfig } from "@/lib/academy/lessons/types";
import type { CoreScreenProps } from "./types";

type WordDropNextHandler = () => boolean;

let activeWordDropNextHandler: WordDropNextHandler | null = null;

/** Used by the lesson runner Next control. No-ops unless a word-drop screen is active. */
export function runWordDropNextHandler(): boolean {
  if (!activeWordDropNextHandler) return true;
  return activeWordDropNextHandler();
}

export function WordDropScreen({
  screen,
  screenIndex,
  flow,
}: CoreScreenProps<WordDropScreenConfig>) {
  const {
    handleComplete,
    handleIncomplete,
    handleSuccess,
    handleMistake,
  } = useLessonScreenFlow({
    screenIndex,
    flow,
  });
  const flowRef = useRef(flow);
  flowRef.current = flow;
  const gameRef = useRef<LessonWordDropGameHandle>(null);
  const [feedback, setFeedback] = useState<"error" | null>(null);

  const prompt =
    screen.prompt && screen.blanks?.length
      ? screen.prompt
      : `${screen.narrativeBefore} [blank] ${screen.narrativeAfter}`;
  const blanks =
    screen.prompt && screen.blanks?.length
      ? screen.blanks
      : [
          {
            options: screen.options,
            correctOption: screen.correctOption,
          },
        ];

  const errorCopy = lessonFeedbackCopy(screen.wrongError);
  usePublishLessonHint(feedback === "error" ? errorCopy : null);

  const handleChoicesChange = useCallback(() => {
    setFeedback(null);
  }, []);

  const handleSolved = useCallback(() => {
    setFeedback(null);
    handleSuccess();
    handleComplete();
  }, [handleComplete, handleSuccess]);

  const handleWrongPlacement = useCallback(() => {
    setFeedback("error");
    handleMistake();
  }, [handleMistake]);

  useEffect(() => {
    flowRef.current.clearScreenReady(screenIndex);
  }, [screenIndex]);

  useEffect(() => {
    activeWordDropNextHandler = () => gameRef.current?.evaluate() === true;

    return () => {
      activeWordDropNextHandler = null;
    };
  }, []);

  return (
    <>
      <LessonWordDropGame
        ref={gameRef}
        prompt={prompt}
        blanks={blanks}
        promptLabel={screen.promptLabel}
        onChoicesChange={handleChoicesChange}
        onComplete={handleSolved}
        onIncomplete={handleIncomplete}
        onMismatch={handleWrongPlacement}
      />
    </>
  );
}
