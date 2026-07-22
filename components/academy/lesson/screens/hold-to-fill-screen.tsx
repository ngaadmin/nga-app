"use client";

import { useEffect, useRef, useState } from "react";
import type { HoldToFillScreenConfig } from "@/lib/academy/lessons/types";
import {
  celebrateLessonCorrectAnswer,
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
        celebrateLessonCorrectAnswer(flow.flashScreen);
        flow.markScreenReady(screenIndex);
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
      signalLessonIncorrectAnswer(flow.flashScreen);
      setHint(
        screen.releaseHint ??
          "(Must hold down fully for 2 seconds to activate)",
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

  if (complete && screen.clearOnSuccess) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <p className="rounded-xl bg-[#DCFCE7] px-5 py-6 font-heading text-base font-extrabold leading-snug text-[#031F82]">
          {screen.successMessage}
        </p>
      </div>
    );
  }

  return (
    <div className="relative flex flex-1 flex-col">
      <p className="font-sans text-sm leading-relaxed text-[#1E3A5F]">{screen.narrative}</p>
      <div className="relative mt-8 flex flex-col items-center">
        <button
          type="button"
          onPointerDown={startHold}
          onPointerUp={endHold}
          onPointerLeave={endHold}
          onPointerCancel={endHold}
          style={{ touchAction: "none" }}
          className={cn(
            "select-none rounded-2xl border-b-4 border-[#099FB8] bg-[#0CC1E0] px-6 py-5 font-heading text-sm font-extrabold uppercase tracking-wide text-[#031F82] shadow-md transition-transform active:scale-[0.98]",
            complete && "border-[#6366F1] bg-[#6366F1] text-white",
          )}
        >
          {complete ? screen.frozenLabel : screen.holdLabel}
        </button>
        <div className="mt-4 h-3 w-full max-w-xs overflow-hidden rounded-full border border-[#BDE9FB]/60 bg-[#E8F7FC]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#0CC1E0] to-[#099FB8]"
            style={{
              width: `${progress * 100}%`,
              transition: isHolding ? "none" : "width 150ms ease-out",
            }}
          />
        </div>
        {complete && !screen.clearOnSuccess ? (
          <p className="mt-4 rounded-xl bg-[#DCFCE7] px-4 py-3 text-center font-heading text-sm font-extrabold text-[#031F82]">
            {screen.successMessage}
          </p>
        ) : null}
        {hint ? (
          <p className="mt-3 font-sans text-xs text-[#1E3A5F]/80">{hint}</p>
        ) : null}
      </div>
    </div>
  );
}
