"use client";

import { useEffect, useRef, useState } from "react";
import { useLessonScreenFlow } from "@/components/academy/lesson/hooks/use-lesson-screen-flow";
import {
  lessonHoldButtonClass,
  lessonHoldButtonCompleteClass,
  lessonPromptClass,
} from "@/components/academy/lesson/lesson-shared-styles";
import {
  LessonErrorBanner,
  LessonSuccessBanner,
  lessonFeedbackCopy,
} from "@/components/academy/lesson/lesson-ui";
import type { HoldToFillScreenConfig } from "@/lib/academy/lessons/types";
import {
  signalLessonIncorrectAnswer,
} from "@/lib/academy/lessons/utils";
import { cn } from "@/lib/utils/cn";
import type { StandardScreenProps } from "./types";

const DEFAULT_HOLD_MS = 2000;

export function HoldToFillScreen({
  screen,
  screenIndex,
  flow,
}: StandardScreenProps<HoldToFillScreenConfig>) {
  const holdMs = screen.holdDurationMs ?? DEFAULT_HOLD_MS;
  const { showSuccess, handleComplete, handleSuccess } = useLessonScreenFlow({
    screenIndex,
    flow,
  });

  const [progress, setProgress] = useState(0);
  const [complete, setComplete] = useState(false);
  const [releaseError, setReleaseError] = useState<string | null>(null);
  const holdStartRef = useRef<number | null>(null);
  const holdFrameRef = useRef<number | null>(null);

  const startHold = () => {
    if (complete) return;
    holdStartRef.current = performance.now();
    setReleaseError(null);

    const tick = (now: number) => {
      const start = holdStartRef.current;
      if (start === null) return;
      const elapsed = now - start;
      const nextProgress = Math.min(1, elapsed / holdMs);
      setProgress(nextProgress);
      if (nextProgress >= 1) {
        setComplete(true);
        handleSuccess();
        handleComplete();
        holdStartRef.current = null;
        return;
      }
      holdFrameRef.current = requestAnimationFrame(tick);
    };

    holdFrameRef.current = requestAnimationFrame(tick);
  };

  const endHold = () => {
    if (complete) return;
    if (holdFrameRef.current !== null) {
      cancelAnimationFrame(holdFrameRef.current);
      holdFrameRef.current = null;
    }
    const start = holdStartRef.current;
    holdStartRef.current = null;
    if (start !== null && performance.now() - start < holdMs) {
      setProgress(0);
      signalLessonIncorrectAnswer(flow.flashScreen, { flash: true });
      setReleaseError(lessonFeedbackCopy(screen.releaseHint) ?? "");
    }
  };

  useEffect(
    () => () => {
      if (holdFrameRef.current !== null) {
        cancelAnimationFrame(holdFrameRef.current);
      }
    },
    [],
  );

  return (
    <div className="flex flex-col items-center gap-4">
      <p className={cn(lessonPromptClass, "mb-0 text-center")}>
        {screen.narrative}
      </p>
      {screen.cta ? (
        <p className={cn(lessonPromptClass, "mb-0 text-center")}>{screen.cta}</p>
      ) : null}
      <button
        type="button"
        disabled={complete}
        onPointerDown={(event) => {
          event.preventDefault();
          startHold();
        }}
        onPointerUp={endHold}
        onPointerLeave={endHold}
        onPointerCancel={endHold}
        style={{ touchAction: "none" }}
        className={cn(
          lessonHoldButtonClass,
          complete && lessonHoldButtonCompleteClass,
        )}
      >
        <span
          className="absolute inset-y-0 left-0 bg-white/35"
          style={{ width: `${progress * 100}%` }}
          aria-hidden
        />
        <span className="relative z-raised">
          {complete ? screen.frozenLabel : screen.holdLabel}
        </span>
      </button>
      {releaseError !== null ? (
        <LessonErrorBanner>{lessonFeedbackCopy(releaseError)}</LessonErrorBanner>
      ) : null}
      {showSuccess ? <LessonSuccessBanner /> : null}
    </div>
  );
}
