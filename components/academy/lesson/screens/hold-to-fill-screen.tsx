"use client";

import { useEffect, useRef, useState } from "react";
import { useLessonScreenFlow } from "@/components/academy/lesson/hooks/use-lesson-screen-flow";
import {
  lessonHoldButtonClass,
  lessonHoldButtonCompleteClass,
} from "@/components/academy/lesson/lesson-shared-styles";
import { LessonScreenLayout } from "@/components/academy/lesson/lesson-ui";
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
  const { completeMessage, handleComplete, handleSuccess } = useLessonScreenFlow({
    screenIndex,
    flow,
    successMessage: screen.successMessage,
  });

  const [progress, setProgress] = useState(0);
  const [complete, setComplete] = useState(false);
  const [isHolding, setIsHolding] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const holdStartRef = useRef<number | null>(null);
  const holdFrameRef = useRef<number | null>(null);

  const startHold = () => {
    if (complete) return;
    holdStartRef.current = performance.now();
    setIsHolding(true);
    setHint(null);

    const tick = (now: number) => {
      const start = holdStartRef.current;
      if (start === null) return;
      const elapsed = now - start;
      const nextProgress = Math.min(1, elapsed / holdMs);
      setProgress(nextProgress);
      if (nextProgress >= 1) {
        setComplete(true);
        setIsHolding(false);
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
    setIsHolding(false);
    if (holdFrameRef.current !== null) {
      cancelAnimationFrame(holdFrameRef.current);
      holdFrameRef.current = null;
    }
    const start = holdStartRef.current;
    holdStartRef.current = null;
    if (start !== null && performance.now() - start < holdMs) {
      setProgress(0);
      signalLessonIncorrectAnswer(flow.flashScreen, { flash: true });
      setHint(
        screen.releaseHint ??
          "Hold down fully for 2 seconds to activate.",
      );
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
    <LessonScreenLayout intro={screen.narrative} successMessage={completeMessage} fill>
      <div className="relative flex flex-1 flex-col items-center justify-center">
        <button
          type="button"
          disabled={complete}
          onPointerDown={startHold}
          onPointerUp={endHold}
          onPointerLeave={endHold}
          onPointerCancel={endHold}
          style={{ touchAction: "none" }}
          className={cn(
            lessonHoldButtonClass,
            complete && lessonHoldButtonCompleteClass,
          )}
        >
          {complete ? screen.frozenLabel : screen.holdLabel}
        </button>
        <div className="mt-3 h-3 w-full max-w-xs overflow-hidden rounded-full border border-[#BDE9FB]/60 bg-[#E8F7FC]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#0CC1E0] to-[#099FB8]"
            style={{
              width: `${progress * 100}%`,
              transition: isHolding ? "none" : "width 150ms ease-out",
            }}
          />
        </div>
        {hint ? (
          <p className="mt-2 font-sans text-sm font-medium text-[#1E3A5F]/80">
            {hint}
          </p>
        ) : null}
      </div>
    </LessonScreenLayout>
  );
}
