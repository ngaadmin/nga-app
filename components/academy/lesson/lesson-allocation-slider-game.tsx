"use client";

import { useEffect, useRef, useState } from "react";
import { lessonIntroClass } from "@/components/academy/lesson/lesson-shared-styles";
import {
  allocationNextEnabled,
  allocationSavedBadge,
  clampSaveAmount,
} from "@/lib/academy/lessons/allocation-slider";
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

/** Range fallback used outside the lesson screen. Next unlocks with no lock button. */
export function LessonAllocationSliderGame({
  intro,
  total,
  targetMin,
  reserveGoals,
  onComplete,
  onIncomplete,
  onSuccess,
}: LessonAllocationSliderGameProps) {
  const [reservedAmount, setReservedAmount] = useState(0);
  const metRef = useRef(false);
  const spendableToday = total - reservedAmount;
  const primaryGoal = reserveGoals[0];
  const meetsTarget = allocationNextEnabled(reservedAmount, targetMin);

  useEffect(() => {
    if (meetsTarget && !metRef.current) {
      metRef.current = true;
      onSuccess?.();
      onComplete();
      return;
    }
    if (!meetsTarget && metRef.current) {
      metRef.current = false;
      onIncomplete?.();
    }
  }, [meetsTarget, onComplete, onIncomplete, onSuccess]);

  return (
    <>
      <div className={cn("mb-5 space-y-1", lessonIntroClass())}>
        {intro.split("\n").map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>
      <div className="mt-2 mb-4">
        <div className="mb-1.5 flex justify-between text-sm font-semibold text-[#031F82]">
          <span>
            Save
            <span className="mt-0.5 block text-xs font-bold text-[#031F82]">
              needs ${targetMin}
            </span>
          </span>
          <span>${reservedAmount}</span>
        </div>
        <input
          type="range"
          min={0}
          max={total}
          step={1}
          value={reservedAmount}
          onChange={(event) => {
            event.stopPropagation();
            setReservedAmount(clampSaveAmount(Number.parseInt(event.target.value, 10), total));
          }}
          className="h-11 w-full"
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
      {meetsTarget ? (
        <p className="text-center font-heading text-lg font-extrabold text-[#031F82]" role="status">
          {allocationSavedBadge(targetMin)}
        </p>
      ) : null}
    </>
  );
}
