"use client";

import { useEffect, useRef, useState } from "react";
import {
  lessonIntroClass,
  lessonRangeSliderClass,
  lessonSubmitAnswerClass,
} from "@/components/academy/lesson/lesson-shared-styles";
import {
  LessonErrorBanner,
  lessonFeedbackCopy,
} from "@/components/academy/lesson/lesson-ui";
import { cn } from "@/lib/utils/cn";
import type { AllocationSliderItem } from "@/lib/academy/lessons/types/screens/allocation-slider";

type LessonAllocationSliderGameProps = {
  intro: string;
  total: number;
  targetMin: number;
  reserveGoals: readonly AllocationSliderItem[];
  spendItems?: readonly AllocationSliderItem[];
  sliderError: string;
  onComplete: () => void;
  onIncomplete?: () => void;
  onSuccess?: () => void;
};

export function LessonAllocationSliderGame({
  intro,
  total,
  targetMin,
  reserveGoals,
  sliderError,
  onComplete,
  onIncomplete,
  onSuccess,
}: LessonAllocationSliderGameProps) {
  const [reservedAmount, setReservedAmount] = useState(0);
  const [locked, setLocked] = useState(false);
  const [commitError, setCommitError] = useState<string | null>(null);
  const spendableToday = total - reservedAmount;
  const primaryGoal = reserveGoals[0];
  const wasCompleteRef = useRef(false);

  useEffect(() => {
    if (!locked && wasCompleteRef.current) {
      wasCompleteRef.current = false;
      onIncomplete?.();
    }
  }, [locked, onIncomplete]);

  const handleLock = () => {
    if (locked) return;
    if (reservedAmount >= targetMin) {
      setCommitError(null);
      setLocked(true);
      if (!wasCompleteRef.current) {
        wasCompleteRef.current = true;
        onSuccess?.();
        onComplete();
      }
      return;
    }
    setCommitError(lessonFeedbackCopy(sliderError) ?? "");
  };

  return (
    <>
      <p className={cn("mb-5", lessonIntroClass())}>{intro}</p>
      <div className="mt-2 mb-4">
        <div className="mb-1.5 flex justify-between text-sm font-semibold text-[#031F82]">
          <span>Save</span>
          <span>${reservedAmount}</span>
        </div>
        <input
          type="range"
          min={0}
          max={total}
          step={1}
          value={reservedAmount}
          disabled={locked}
          onChange={(event) => {
            event.stopPropagation();
            const next = Number.parseInt(event.target.value, 10);
            setReservedAmount(next);
            setCommitError(null);
            if (locked) {
              setLocked(false);
            }
          }}
          className={lessonRangeSliderClass}
          style={{
            background: `linear-gradient(90deg,#FFA503 0%,#FFA503 ${(reservedAmount / Math.max(total, 1)) * 100}%,#031F82 ${(reservedAmount / Math.max(total, 1)) * 100}%,#031F82 100%)`,
          }}
          aria-label={
            primaryGoal
              ? `Reserve amount for ${primaryGoal.label}`
              : "Reserve amount"
          }
        />
        <div className="mt-1.5 flex justify-between text-sm font-semibold text-[#031F82]">
          <span>Spend</span>
          <span>${spendableToday}</span>
        </div>
      </div>
      {!locked ? (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            handleLock();
          }}
          className={lessonSubmitAnswerClass}
        >
          Lock it in
        </button>
      ) : null}
      {commitError !== null ? (
        <LessonErrorBanner>{lessonFeedbackCopy(commitError)}</LessonErrorBanner>
      ) : null}
    </>
  );
}
