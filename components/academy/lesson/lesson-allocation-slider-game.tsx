"use client";

import { useEffect, useState } from "react";
import {
  lessonIntroClass,
  lessonRangeSliderClass,
} from "@/components/academy/lesson/lesson-shared-styles";
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
  onMistake: () => void;
  onPersistentError?: (message: string) => void;
  onDismissError?: () => void;
};

export function LessonAllocationSliderGame({
  intro,
  total,
  targetMin,
  reserveGoals,
  spendItems = [],
  sliderError,
  onComplete,
  onMistake,
  onPersistentError,
  onDismissError,
}: LessonAllocationSliderGameProps) {
  const [reservedAmount, setReservedAmount] = useState(0);
  const spendableToday = total - reservedAmount;

  const primaryGoal = reserveGoals[0];
  const primarySpend = spendItems[0];
  const spendLocked =
    primarySpend !== undefined &&
    reservedAmount >= targetMin &&
    spendableToday < primarySpend.amount;

  useEffect(() => {
    if (reservedAmount >= targetMin) {
      onDismissError?.();
      onComplete();
    }
  }, [onComplete, onDismissError, reservedAmount, targetMin]);

  return (
    <>
      <p className={lessonIntroClass()}>{intro}</p>
      <div className="mt-5 flex justify-center gap-6">
        {reserveGoals.map((goal) => (
          <div
            key={goal.id}
            className={cn(
              "flex w-28 shrink-0 flex-col items-center text-center transition-opacity",
              reservedAmount >= targetMin ? "opacity-100" : "opacity-80",
            )}
          >
            {goal.emoji ? (
              <span className="text-4xl leading-none" aria-hidden>
                {goal.emoji}
              </span>
            ) : null}
            <p className="mt-2 font-sans text-base font-medium text-[#031F82] sm:text-lg">
              {goal.label}
            </p>
            <p className="font-heading text-base font-bold text-[#0CC1E0]">
              ${goal.amount}
            </p>
          </div>
        ))}
        {spendItems.map((item) => (
          <div
            key={item.id}
            className={cn(
              "flex w-28 shrink-0 flex-col items-center text-center transition-all",
              spendLocked
                ? "pointer-events-none opacity-35 grayscale"
                : "opacity-100",
            )}
          >
            {item.emoji ? (
              <span className="text-4xl leading-none" aria-hidden>
                {item.emoji}
              </span>
            ) : null}
            <p className="mt-2 font-sans text-base font-medium text-[#031F82] sm:text-lg">
              {item.label}
            </p>
            <p className="font-heading text-base font-bold text-[#FFA503]">
              ${item.amount}
            </p>
          </div>
        ))}
      </div>
      <div className="mt-auto pt-6">
        <input
          type="range"
          min={0}
          max={total}
          step={1}
          value={reservedAmount}
          onChange={(event) => {
            event.stopPropagation();
            onDismissError?.();
            const next = Number.parseInt(event.target.value, 10);
            setReservedAmount(next);
            if (next < targetMin) {
              onMistake();
              onPersistentError?.(sliderError);
            }
          }}
          className={lessonRangeSliderClass}
          aria-label={
            primaryGoal
              ? `Reserve amount for ${primaryGoal.label}`
              : "Reserve amount"
          }
        />
        <p className="mt-3 text-center font-sans text-base font-medium text-[#031F82] sm:text-lg">
          ${reservedAmount} secured · ${spendableToday} free today
        </p>
      </div>
    </>
  );
}
