"use client";

import { useEffect, useRef, useState } from "react";
import { AnswerEmoji } from "@/components/academy/lesson/answer-emoji";
import { useLessonScreenFlow } from "@/components/academy/lesson/hooks/use-lesson-screen-flow";
import {
  LessonAnswerTick,
  LessonPromptParagraphs,
  lessonFeedbackCopy,
} from "@/components/academy/lesson/lesson-ui";
import {
  lessonHoldButtonClass,
  lessonHoldButtonCompleteClass,
  lessonPromptClass,
} from "@/components/academy/lesson/lesson-shared-styles";
import { usePublishLessonHint } from "@/components/academy/lesson/lesson-hint";
import { peelEdgeEmojis } from "@/lib/academy/lessons/peel-leading-emoji";
import type { HoldToFillScreenConfig } from "@/lib/academy/lessons/types";
import { cn } from "@/lib/utils/cn";
import type { StandardScreenProps } from "./types";

const DEFAULT_HOLD_MS = 2000;

function HoldLabel({ text }: { text: string }) {
  const parts = peelEdgeEmojis(text);
  if (!parts.leading && !parts.trailing) return text;
  return (
    <>
      {parts.leading ? <AnswerEmoji emoji={parts.leading} /> : null}
      {parts.label ? <span>{parts.label}</span> : null}
      {parts.trailing ? <AnswerEmoji emoji={parts.trailing} /> : null}
    </>
  );
}

export function HoldToFillScreen({
  screen,
  screenIndex,
  flow,
}: StandardScreenProps<HoldToFillScreenConfig>) {
  const holdMs = screen.holdDurationMs ?? DEFAULT_HOLD_MS;
  const { handleComplete, handleMistake, handleSuccess } = useLessonScreenFlow({
    screenIndex,
    flow,
  });

  const [progress, setProgress] = useState(0);
  const [complete, setComplete] = useState(false);
  const [releaseError, setReleaseError] = useState<string | null>(null);
  const [shaking, setShaking] = useState(false);
  const shakeTimerRef = useRef<number | null>(null);
  usePublishLessonHint(releaseError);
  const holdStartRef = useRef<number | null>(null);
  const holdFrameRef = useRef<number | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const [pressed, setPressed] = useState(false);
  /** A system cancel (call, scroll, gesture) stopped the hold, not the learner. */
  const [interrupted, setInterrupted] = useState(false);

  const startHold = () => {
    if (complete || holdStartRef.current !== null) return;
    holdStartRef.current = performance.now();
    setPressed(true);
    setProgress(0);
    setReleaseError(null);
    setInterrupted(false);

    const tick = (now: number) => {
      const start = holdStartRef.current;
      if (start === null) return;
      const elapsed = now - start;
      const nextProgress = Math.min(1, elapsed / holdMs);
      setProgress(nextProgress);
      if (nextProgress >= 1) {
        setPressed(false);
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

  const endHold = (countMistake: boolean) => {
    if (complete) return;
    setPressed(false);
    if (holdFrameRef.current !== null) {
      cancelAnimationFrame(holdFrameRef.current);
      holdFrameRef.current = null;
    }
    const start = holdStartRef.current;
    holdStartRef.current = null;
    if (start !== null && performance.now() - start < holdMs) {
      setProgress(0);
      if (!countMistake) {
        // Say why the bar emptied instead of resetting it silently.
        setInterrupted(true);
        return;
      }
      handleMistake();
      setReleaseError(lessonFeedbackCopy(screen.releaseHint) ?? null);
      if (shakeTimerRef.current !== null) window.clearTimeout(shakeTimerRef.current);
      setShaking(false);
      window.requestAnimationFrame(() => {
        setShaking(true);
        shakeTimerRef.current = window.setTimeout(() => {
          setShaking(false);
          shakeTimerRef.current = null;
        }, 360);
      });
    }
  };

  // Touch runs on native listeners. On iPhone a held press was cancelled by
  // the system long-press gesture, so the hold never got going; a
  // non-passive touchstart that calls preventDefault keeps the press ours.
  const holdApiRef = useRef({ startHold, endHold });
  holdApiRef.current = { startHold, endHold };

  useEffect(() => {
    const button = buttonRef.current;
    if (!button) return;
    let touchId: number | null = null;

    const has = (list: TouchList, id: number) => {
      for (let index = 0; index < list.length; index += 1) {
        if (list[index]?.identifier === id) return true;
      }
      return false;
    };
    const onEnd = (event: TouchEvent) => {
      if (touchId === null || !has(event.changedTouches, touchId)) return;
      if (event.cancelable) event.preventDefault();
      touchId = null;
      detach();
      // Letting go early is the mistake; a system cancel is not the learner's.
      holdApiRef.current.endHold(event.type === "touchend");
    };
    const detach = () => {
      window.removeEventListener("touchend", onEnd);
      window.removeEventListener("touchcancel", onEnd);
    };
    const onStart = (event: TouchEvent) => {
      if (event.cancelable) event.preventDefault();
      if (touchId !== null) return;
      const touch = event.changedTouches[0];
      if (!touch) return;
      touchId = touch.identifier;
      window.addEventListener("touchend", onEnd, { passive: false });
      window.addEventListener("touchcancel", onEnd, { passive: false });
      holdApiRef.current.startHold();
    };
    const blockMenu = (event: Event) => event.preventDefault();

    button.addEventListener("touchstart", onStart, { passive: false });
    button.addEventListener("contextmenu", blockMenu);
    return () => {
      button.removeEventListener("touchstart", onStart);
      button.removeEventListener("contextmenu", blockMenu);
      detach();
    };
  }, []);

  useEffect(
    () => () => {
      if (holdFrameRef.current !== null) {
        cancelAnimationFrame(holdFrameRef.current);
      }
      if (shakeTimerRef.current !== null) window.clearTimeout(shakeTimerRef.current);
    },
    [],
  );

  return (
    <div className="flex flex-col items-center gap-4">
      <LessonPromptParagraphs
        text={screen.narrative}
        className={cn(lessonPromptClass, "mb-0 text-center")}
      />
      {screen.cta ? (
        <p className={cn(lessonPromptClass, "mb-0 text-center")}>{screen.cta}</p>
      ) : null}
      <div className="flex w-full flex-col items-center gap-2">
        <button
          ref={buttonRef}
          type="button"
          aria-disabled={complete}
          data-hold-state={complete ? "done" : pressed ? "holding" : "idle"}
          onPointerDown={(event) => {
            // Touch runs on the native touch listeners above.
            if (event.pointerType === "touch") return;
            if (event.pointerType === "mouse" && event.button !== 0) return;
            event.preventDefault();
            try {
              event.currentTarget.setPointerCapture(event.pointerId);
            } catch {
              // The pointer can end before the browser accepts capture.
            }
            startHold();
          }}
          onPointerUp={(event) => {
            if (event.pointerType === "touch") return;
            if (event.currentTarget.hasPointerCapture(event.pointerId)) {
              event.currentTarget.releasePointerCapture(event.pointerId);
            }
            endHold(true);
          }}
          onPointerLeave={(event) => {
            if (event.pointerType === "touch") return;
            if (event.currentTarget.hasPointerCapture(event.pointerId)) return;
            endHold(true);
          }}
          onPointerCancel={(event) => {
            if (event.pointerType === "touch") return;
            endHold(false);
          }}
          onKeyDown={(event) => {
            if (event.key !== " " && event.key !== "Enter") return;
            event.preventDefault();
            if (event.repeat) return;
            startHold();
          }}
          onKeyUp={(event) => {
            if (event.key !== " " && event.key !== "Enter") return;
            event.preventDefault();
            endHold(false);
          }}
          onBlur={() => endHold(false)}
          onContextMenu={(event) => {
            event.preventDefault();
          }}
          className={cn(
            lessonHoldButtonClass,
            "lesson-hold-button lesson-touch-target transition-[transform,box-shadow,background-color] duration-100",
            pressed && "translate-y-[3px] bg-[#09B3D0] shadow-[0_2px_0_#099FB8]",
            complete && lessonHoldButtonCompleteClass,
            complete && "cursor-default",
            shaking && "lesson-tile-shake",
          )}
        >
          <span
            className="pointer-events-none absolute inset-y-0 left-0 bg-[#031F82]/25"
            style={{ width: `${progress * 100}%` }}
            aria-hidden
          />
          <span className="pointer-events-none relative z-raised inline-flex items-center gap-2">
            <HoldLabel text={complete ? screen.frozenLabel : screen.holdLabel} />
            {complete ? <LessonAnswerTick /> : null}
          </span>
        </button>
        <div
          className="h-2 w-full max-w-[220px] overflow-hidden rounded-full bg-[#DCE6FA]"
          role="progressbar"
          aria-label="Hold progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress * 100)}
        >
          <div
            className="h-full rounded-full bg-[#031F82]"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <p
          className={cn(
            "m-0 min-h-5 font-heading text-sm font-bold text-[#031F82] transition-opacity duration-150",
            pressed || interrupted ? "opacity-100" : "opacity-0",
          )}
          aria-live="polite"
        >
          {pressed ? "Keep holding…" : interrupted ? "Hold again to finish." : ""}
        </p>
      </div>
    </div>
  );
}
