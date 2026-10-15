"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { LessonFlow } from "@/lib/academy/lessons/hooks/use-lesson-flow";
import {
  celebrateLessonCorrectAnswer,
  signalLessonIncorrectAnswer,
} from "@/lib/academy/lessons/utils";

type UseLessonScreenFlowOptions = {
  screenIndex: number;
  flow: LessonFlow;
  onBeforeComplete?: () => void;
};

/**
 * Standard lesson-screen flow wiring: mark ready, celebrate success, track mistakes.
 * Correct plays the ping. Wrong plays the soft buzzer. Neither paints a border.
 */
export function useLessonScreenFlow({
  screenIndex,
  flow,
  onBeforeComplete,
}: UseLessonScreenFlowOptions) {
  const flowRef = useRef(flow);
  flowRef.current = flow;

  const handleComplete = useCallback(() => {
    onBeforeComplete?.();
    flowRef.current.markScreenReady(screenIndex);
  }, [onBeforeComplete, screenIndex]);

  const handleIncomplete = useCallback(() => {
    flowRef.current.clearScreenReady(screenIndex);
  }, [screenIndex]);

  const handleSuccess = useCallback(() => {
    celebrateLessonCorrectAnswer();
  }, []);

  const handleMistake = useCallback(() => {
    flowRef.current.incrementMistake();
    signalLessonIncorrectAnswer();
  }, []);

  const handleMismatch = useCallback(() => {
    signalLessonIncorrectAnswer();
  }, []);

  return {
    flowRef,
    handleComplete,
    handleIncomplete,
    handleSuccess,
    handleMistake,
    handleMismatch,
  };
}

/** Retriggers the shared tile shake on the keyed row. */
export function useLessonShake() {
  const [shakingKey, setShakingKey] = useState<string | null>(null);
  const timer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    },
    [],
  );

  const shake = useCallback((key: string) => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    setShakingKey(null);
    window.requestAnimationFrame(() => {
      setShakingKey(key);
      timer.current = window.setTimeout(() => {
        setShakingKey(null);
        timer.current = null;
      }, 360);
    });
  }, []);

  return { shakingKey, shake };
}
