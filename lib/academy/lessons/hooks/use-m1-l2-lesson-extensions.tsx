"use client";

import { useCallback, useMemo, useState } from "react";
import { M1L2CustomScreen } from "@/components/academy/lesson/m1-l2-custom-screens";
import type { LessonFlow } from "@/lib/academy/lessons/hooks/use-lesson-flow";
import {
  celebrateLessonCorrectAnswer,
  signalLessonIncorrectAnswer,
} from "@/lib/academy/lessons/utils";
import type { ResolvedLessonContent } from "@/lib/academy/lessons/types";
import type { ReactNode } from "react";

export function useM1L2LessonExtensions(
  content: ResolvedLessonContent,
  flow: LessonFlow,
) {
  const hasGiftReveal = content.screens.some(
    (screen) =>
      screen.type === "custom" && screen.renderer === "m1-l2-gift-reveal",
  );

  const [persistentError, setPersistentError] = useState<string | null>(null);

  const showPersistentError = useCallback(
    (message: string) => {
      setPersistentError(message);
      signalLessonIncorrectAnswer(flow.flashScreen);
    },
    [flow],
  );

  const dismissPersistentError = useCallback(() => {
    setPersistentError(null);
    flow.flashScreen("none");
  }, [flow]);

  const flashSuccess = useCallback(() => {
    celebrateLessonCorrectAnswer(flow.flashScreen);
  }, [flow]);

  const renderCustomScreen = useCallback(
    (screenIndex: number, renderer: string): ReactNode => (
      <M1L2CustomScreen
        renderer={renderer}
        screenIndex={screenIndex}
        flow={flow}
        onFlashSuccess={flashSuccess}
      />
    ),
    [flashSuccess, flow],
  );

  const noop = useMemo(
    () => ({
      persistentError: null,
      dismissPersistentError: undefined,
      canAdvance: undefined,
      onNext: undefined,
      onPersistentError: undefined,
      renderCustomScreen: undefined,
    }),
    [],
  );

  if (!hasGiftReveal) {
    return noop;
  }

  return {
    persistentError,
    dismissPersistentError,
    canAdvance: undefined,
    onNext: undefined,
    onPersistentError: showPersistentError,
    renderCustomScreen,
  };
}
