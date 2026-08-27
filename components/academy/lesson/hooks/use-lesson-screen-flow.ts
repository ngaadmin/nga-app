"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { LessonFlow } from "@/lib/academy/lessons/hooks/use-lesson-flow";
import {
  celebrateLessonCorrectAnswer,
  signalLessonIncorrectAnswer,
} from "@/lib/academy/lessons/utils";

/** Green drawer only — short flash, no success copy. */
export const LESSON_SUCCESS_FLASH_MS = 550;

type UseLessonScreenFlowOptions = {
  screenIndex: number;
  flow: LessonFlow;
  onBeforeComplete?: () => void;
  flashOnMistake?: boolean;
  flashOnMismatch?: boolean;
};

/** Shows the green bar briefly when `active` becomes true. */
export function useLessonSuccessFlash(active: boolean): boolean {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!active) {
      setVisible(false);
      return;
    }
    setVisible(true);
    const timeoutId = window.setTimeout(() => {
      setVisible(false);
    }, LESSON_SUCCESS_FLASH_MS);
    return () => window.clearTimeout(timeoutId);
  }, [active]);

  return visible;
}

/**
 * Standard lesson-screen flow wiring: mark ready, celebrate success, track mistakes.
 */
export function useLessonScreenFlow({
  screenIndex,
  flow,
  onBeforeComplete,
  flashOnMistake = true,
  flashOnMismatch = true,
}: UseLessonScreenFlowOptions) {
  const [completed, setCompleted] = useState(false);
  const flowRef = useRef(flow);
  flowRef.current = flow;
  const showSuccess = useLessonSuccessFlash(completed);

  const handleComplete = useCallback(() => {
    onBeforeComplete?.();
    setCompleted(true);
    flowRef.current.markScreenReady(screenIndex);
  }, [onBeforeComplete, screenIndex]);

  const handleIncomplete = useCallback(() => {
    setCompleted(false);
    flowRef.current.clearScreenReady(screenIndex);
  }, [screenIndex]);

  const handleSuccess = useCallback(() => {
    celebrateLessonCorrectAnswer(flowRef.current.flashScreen);
  }, []);

  const handleMistake = useCallback(() => {
    flowRef.current.incrementMistake();
    signalLessonIncorrectAnswer(flowRef.current.flashScreen, {
      flash: flashOnMistake,
    });
  }, [flashOnMistake]);

  const handleMismatch = useCallback(() => {
    signalLessonIncorrectAnswer(flowRef.current.flashScreen, {
      flash: flashOnMismatch,
    });
  }, [flashOnMismatch]);

  return {
    showSuccess,
    flowRef,
    handleComplete,
    handleIncomplete,
    handleSuccess,
    handleMistake,
    handleMismatch,
  };
}
