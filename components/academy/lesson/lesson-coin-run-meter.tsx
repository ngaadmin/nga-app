"use client";

import { useEffect, useState } from "react";
import { GoldCoinIcon } from "@/lib/dashboard/icons";
import {
  COIN_RUN_METER_SLOTS,
  coinRunMeterFilledCount,
  coinRunMeterLabel,
} from "@/lib/academy/lessons/coin-run-meter";
import { cn } from "@/lib/utils/cn";

/**
 * Same box as the old four-heart row (74×14), so the progress bar does not move.
 * Five 14px slots with a 1px gap: 5×14 + 4×1 = 74.
 */
const METER_CLASS = "flex h-[14px] w-[74px] shrink-0 items-center gap-px";

/** Hold the fifth coin, then fade the row back to empty outlines. */
const CLEAR_MS = 420;

type LessonCoinRunMeterProps = {
  /** Correct answers toward the next 10-coin bonus. */
  streak: number;
  /** Completed runs. A rise plays the clear animation inside the meter. */
  runs?: number;
};

export function LessonCoinRunMeter({ streak, runs = 0 }: LessonCoinRunMeterProps) {
  const filled = coinRunMeterFilledCount(streak);
  const [trackedRuns, setTrackedRuns] = useState(runs);
  const [clearing, setClearing] = useState(false);

  if (runs !== trackedRuns) {
    setTrackedRuns(runs);
    const paid = runs > trackedRuns;
    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setClearing(paid && !reduceMotion);
  }

  useEffect(() => {
    if (!clearing) return;
    const timeoutId = window.setTimeout(() => setClearing(false), CLEAR_MS);
    return () => window.clearTimeout(timeoutId);
  }, [clearing]);

  const showFilled = (index: number) => clearing || index < filled;

  return (
    <div
      className={METER_CLASS}
      role="meter"
      aria-live="off"
      aria-valuemin={0}
      aria-valuemax={COIN_RUN_METER_SLOTS}
      aria-valuenow={filled}
      aria-label={coinRunMeterLabel(streak)}
    >
      {Array.from({ length: COIN_RUN_METER_SLOTS }, (_, index) => {
        const slotFilled = showFilled(index);
        return (
          <span
            key={index}
            className={cn(
              "grid size-[14px] shrink-0 place-items-center rounded-full",
              slotFilled
                ? "bg-[#FFC933] text-[#9A6200] shadow-[inset_0_0_0_1px_#E08A00]"
                : "bg-transparent shadow-[inset_0_0_0_1.25px_#C5D0E4]",
              clearing && "lesson-coin-run-clear",
            )}
            aria-hidden
          >
            {slotFilled ? (
              <GoldCoinIcon
                className={cn(
                  "size-[11px]",
                  clearing && "lesson-coin-run-clear-glyph",
                )}
              />
            ) : null}
          </span>
        );
      })}
    </div>
  );
}
