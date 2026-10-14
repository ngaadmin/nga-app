"use client";

import { useEffect, useRef, useState } from "react";
import { useLessonScreenFlow } from "@/components/academy/lesson/hooks/use-lesson-screen-flow";
import {
  lessonIntroClass,
  lessonRangeSliderClass,
  lessonSubmitAnswerClass,
} from "@/components/academy/lesson/lesson-shared-styles";
import {
  LessonScreenLayout,
  lessonFeedbackCopy,
} from "@/components/academy/lesson/lesson-ui";
import { cn } from "@/lib/utils/cn";
import type { AllocationSliderScreenConfig } from "@/lib/academy/lessons/types";
import type { StandardScreenProps } from "./types";

const TRACK_GOLD = "#FFA503";
const TRACK_NAVY = "#031F82";

function dollar(amount: number) {
  return `$${amount}`;
}

export function AllocationSliderScreen({
  screen,
  screenIndex,
  flow,
}: StandardScreenProps<AllocationSliderScreenConfig>) {
  const { showSuccess, handleComplete, handleIncomplete, handleSuccess, handleMistake } =
    useLessonScreenFlow({ screenIndex, flow });

  const total = Math.max(0, screen.total);
  const targetMin = Math.max(0, screen.targetMin);
  const [reservedAmount, setReservedAmount] = useState(0);
  const [locked, setLocked] = useState(false);
  const [commitError, setCommitError] = useState<string | null>(null);

  const spendableToday = Math.max(0, total - reservedAmount);
  const meetsTarget = reservedAmount >= targetMin;
  const savePct = total > 0 ? (reservedAmount / total) * 100 : 0;
  const targetPct = total > 0 ? (targetMin / total) * 100 : 0;
  const showTargetTick = targetMin > 0 && total > 0;
  const saveNarrow = savePct < 18;
  const spendNarrow = 100 - savePct < 18;
  const tickLabelPct = Math.min(88, Math.max(12, targetPct));
  const underTargetCopy = lessonFeedbackCopy(screen.sliderError) ?? "";
  const sliderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = sliderRef.current;
    if (!node) return;
    const blockHorizontalSwipe = (event: TouchEvent) => {
      if (event.cancelable) event.preventDefault();
    };
    node.addEventListener("touchmove", blockHorizontalSwipe, { passive: false });
    return () => node.removeEventListener("touchmove", blockHorizontalSwipe);
  }, []);

  const handleSlide = (next: number) => {
    const clamped = Math.min(total, Math.max(0, next));
    setReservedAmount(clamped);
    if (locked) {
      setLocked(false);
      handleIncomplete();
    }
    if (clamped < targetMin) {
      setCommitError(underTargetCopy);
    } else {
      setCommitError(null);
    }
  };

  const handleLock = () => {
    if (locked) return;
    if (reservedAmount < targetMin) {
      setCommitError(underTargetCopy);
      handleMistake();
      return;
    }
    setCommitError(null);
    setLocked(true);
    handleSuccess();
    handleComplete();
  };

  return (
    <LessonScreenLayout success={showSuccess} errorMessage={commitError}>
      <div className="mt-3">
        <p className={cn("mb-2", lessonIntroClass(screen.emphasizeInstruction === true))}>
          {screen.intro}
        </p>
        {screen.instruction ? (
          <p className="mb-5 font-heading text-[18px] font-extrabold leading-snug text-[#031F82]">
            {screen.instruction}
          </p>
        ) : (
          <div className="mb-3" />
        )}
        <div className="relative mb-1.5 min-h-[2.6rem] px-10">
          <div
            className={cn(
              "absolute left-10 top-0 z-raised text-left",
              saveNarrow && "-translate-x-0.5",
            )}
          >
            <p className="font-heading text-[11px] font-extrabold uppercase tracking-wide text-[#031F82]">
              💰 Save
            </p>
            <p className="font-heading text-sm font-extrabold tabular-nums text-[#031F82]">
              {dollar(reservedAmount)}
            </p>
          </div>
          <div
            className={cn(
              "absolute right-10 top-0 z-raised text-right",
              spendNarrow && "translate-x-0.5",
            )}
          >
            <p className="font-heading text-[11px] font-extrabold uppercase tracking-wide text-[#031F82]">
              🛍️ Spend
            </p>
            <p className="font-heading text-sm font-extrabold tabular-nums text-[#031F82]">
              {dollar(spendableToday)}
            </p>
          </div>
        </div>

        <div
          ref={sliderRef}
          className="relative px-10"
          style={{ touchAction: "none" }}
        >
          <div
            className="pointer-events-none absolute inset-x-10 top-1/2 z-base h-3 -translate-y-1/2 overflow-hidden rounded-full"
            style={{ backgroundColor: TRACK_NAVY }}
            aria-hidden
          >
            <div
              className="h-full rounded-full"
              style={{ width: `${savePct}%`, backgroundColor: TRACK_GOLD }}
            />
          </div>
          {showTargetTick ? (
            <div
              className="pointer-events-none absolute inset-x-10 top-0 z-base h-11"
              aria-hidden
            >
              <span
                className="absolute top-1/2 h-5 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_0_1px_rgb(3_31_130_/_0.35)]"
                style={{ left: `${targetPct}%` }}
              />
            </div>
          ) : null}
          <input
            type="range"
            min={0}
            max={total}
            step={1}
            value={reservedAmount}
            disabled={locked}
            aria-label="Save and spend divider"
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={reservedAmount}
            onChange={(event) => handleSlide(Number(event.target.value))}
            className={cn(lessonRangeSliderClass, "relative z-raised")}
            style={{ background: "transparent", touchAction: "none" }}
          />
        </div>
        {showTargetTick ? (
          <p className="relative mt-1 h-4 overflow-visible text-center font-sans text-[10px] font-bold text-[#031F82]/70">
            <span
              className="absolute top-0 -translate-x-1/2 whitespace-nowrap"
              style={{ left: `${tickLabelPct}%` }}
            >
              needs {dollar(targetMin)}
            </span>
          </p>
        ) : null}

        {locked ? null : (
          <button
            type="button"
            onClick={handleLock}
            disabled={!meetsTarget}
            className={lessonSubmitAnswerClass}
          >
            Lock it in
          </button>
        )}
      </div>
    </LessonScreenLayout>
  );
}
