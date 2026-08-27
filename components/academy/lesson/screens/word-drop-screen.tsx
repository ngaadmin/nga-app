"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LESSON_SUCCESS_FLASH_MS } from "@/components/academy/lesson/hooks/use-lesson-screen-flow";
import {
  LessonWordDropGame,
  type LessonWordDropGameHandle,
} from "@/components/academy/lesson/lesson-word-drop-game";
import {
  LessonErrorBanner,
  LessonSuccessBanner,
  lessonFeedbackCopy,
} from "@/components/academy/lesson/lesson-ui";
import type { WordDropScreenConfig } from "@/lib/academy/lessons/types";
import {
  celebrateLessonCorrectAnswer,
  signalLessonIncorrectAnswer,
} from "@/lib/academy/lessons/utils";
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
  const flowRef = useRef(flow);
  flowRef.current = flow;
  const gameRef = useRef<LessonWordDropGameHandle>(null);
  const advancingRef = useRef(false);
  const [feedback, setFeedback] = useState<"error" | "success" | null>(null);

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

  useEffect(() => {
    flowRef.current.markScreenReady(screenIndex);
  }, [screenIndex]);

  const handleChoicesChange = useCallback(() => {
    setFeedback(null);
  }, []);

  useEffect(() => {
    advancingRef.current = false;
    let advanceTimer: number | null = null;

    activeWordDropNextHandler = () => {
      if (advancingRef.current) return false;

      const passed = gameRef.current?.evaluate() === true;
      if (!passed) {
        setFeedback("error");
        flowRef.current.incrementMistake();
        signalLessonIncorrectAnswer(flowRef.current.flashScreen);
        return false;
      }

      advancingRef.current = true;
      setFeedback("success");
      celebrateLessonCorrectAnswer(flowRef.current.flashScreen);
      advanceTimer = window.setTimeout(() => {
        flowRef.current.handleNext();
      }, LESSON_SUCCESS_FLASH_MS);
      return false;
    };

    return () => {
      if (advanceTimer !== null) window.clearTimeout(advanceTimer);
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
      />
      {feedback === "success" ? <LessonSuccessBanner /> : null}
      {feedback === "error" ? (
        <LessonErrorBanner>{errorCopy}</LessonErrorBanner>
      ) : null}
    </>
  );
}
