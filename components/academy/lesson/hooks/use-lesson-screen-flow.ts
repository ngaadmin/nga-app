"use client";

import { useCallback, useRef, useState } from "react";
import type { LessonFlow } from "@/lib/academy/lessons/hooks/use-lesson-flow";
import {
  celebrateLessonCorrectAnswer,
  signalLessonIncorrectAnswer,
} from "@/lib/academy/lessons/utils";

type UseLessonScreenFlowOptions = {
  screenIndex: number;
  flow: LessonFlow;
  successMessage?: string;
  onBeforeComplete?: () => void;
  flashOnMistake?: boolean;
  flashOnMismatch?: boolean;
};

/**
 * Standard lesson-screen flow wiring: mark ready, celebrate success, track mistakes.
 */
export function useLessonScreenFlow({
  screenIndex,
  flow,
  successMessage,
  onBeforeComplete,
  flashOnMistake = true,
  flashOnMismatch = true,
}: UseLessonScreenFlowOptions) {
  const [completeMessage, setCompleteMessage] = useState<string | null>(null);
  const flowRef = useRef(flow);
  flowRef.current = flow;

  const handleComplete = useCallback(() => {
    onBeforeComplete?.();
    if (successMessage?.trim()) {
      setCompleteMessage(successMessage);
    }
    flowRef.current.markScreenReady(screenIndex);
  }, [onBeforeComplete, screenIndex, successMessage]);

  const handleIncomplete = useCallback(() => {
    setCompleteMessage(null);
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
    completeMessage,
    flowRef,
    handleComplete,
    handleIncomplete,
    handleSuccess,
    handleMistake,
    handleMismatch,
  };
}
