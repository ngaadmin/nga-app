"use client";

import { useEffect, useState } from "react";
import { GoldCoinIcon } from "@/lib/dashboard/icons";
import {
  COIN_RUN_METER_SLOTS,
  coinRunMeterFilledCount,
  coinRunMeterLabel,
} from "@/lib/academy/lessons/coin-run-meter";
import {
  coinRunRewardCue,
  coinRunRewardFlySpanMs,
  COIN_RUN_REWARD_STAGGER_MS,
  type CoinRunRewardCue,
} from "@/lib/academy/lessons/coin-run-reward";
import { cn } from "@/lib/utils/cn";

/**
 * Same box as the old four-heart row (74×14), so the progress bar does not move.
 * Five 14px slots with a 1px gap: 5×14 + 4×1 = 74.
 */
const METER_CLASS = "flex h-[14px] w-[74px] shrink-0 items-center gap-px";

type LessonCoinRunMeterProps = {
  /** Correct answers toward the next 10-coin bonus. */
  streak: number;
  /** Completed runs. A rise plays the payout chip once. */
  runs?: number;
};

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function LessonCoinRunMeter({ streak, runs = 0 }: LessonCoinRunMeterProps) {
  const filled = coinRunMeterFilledCount(streak);
  const [trackedRuns, setTrackedRuns] = useState(runs);
  const [reward, setReward] = useState<CoinRunRewardCue | null>(null);

  if (runs !== trackedRuns) {
    const cue = coinRunRewardCue({
      previousRuns: trackedRuns,
      runs,
      prefersReducedMotion: prefersReducedMotion(),
    });
    setTrackedRuns(runs);
    setReward(cue);
  }

  useEffect(() => {
    if (!reward) return;
    const timeoutId = window.setTimeout(() => setReward(null), reward.durationMs);
    return () => window.clearTimeout(timeoutId);
  }, [reward]);

  const showFilled = (index: number) => reward !== null || index < filled;

  return (
    <div className="relative h-[14px] w-[74px] shrink-0">
      <div
        className={cn(METER_CLASS, "h-full w-full")}
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
                reward && "lesson-coin-run-clear",
              )}
              style={
                reward
                  ? { animationDuration: `${reward.durationMs}ms` }
                  : undefined
              }
              aria-hidden
            >
              {slotFilled ? (
                <span
                  className={cn(reward && "lesson-coin-run-clear-glyph")}
                  style={
                    reward
                      ? { animationDuration: `${reward.durationMs}ms` }
                      : undefined
                  }
                >
                  <GoldCoinIcon className="size-[11px]" />
                </span>
              ) : null}
            </span>
          );
        })}
      </div>
      {reward ? (
        <CoinRunRewardChip cue={reward} />
      ) : null}
    </div>
  );
}

function CoinRunRewardChip({ cue }: { cue: CoinRunRewardCue }) {
  const flySpan = coinRunRewardFlySpanMs();
  return (
    <div className="pointer-events-none absolute left-0 top-0 z-raised h-[14px] w-[74px]" aria-hidden>
      <span
        className={cn(
          "absolute left-1/2 top-7 inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-[#FFC933] px-2 py-1 font-heading text-[12px] font-extrabold leading-none text-[#9A6200] shadow-[inset_0_0_0_1px_#E08A00]",
          cue.motion === "fly" ? "lesson-coin-reward-chip" : "lesson-coin-reward-fade",
        )}
        style={{ animationDuration: `${cue.durationMs}ms` }}
      >
        <GoldCoinIcon className="size-3" />
        {cue.label}
      </span>
      {cue.motion === "fly"
        ? Array.from({ length: COIN_RUN_METER_SLOTS }, (_, index) => (
            <span
              key={index}
              className="lesson-coin-reward-fly absolute top-0 grid size-[14px] place-items-center text-[#9A6200]"
              style={{
                left: index * 15,
                animationDuration: `${flySpan}ms`,
                animationDelay: `${index * COIN_RUN_REWARD_STAGGER_MS}ms`,
                ["--fly-x" as string]: `${5 + index}px`,
              }}
            >
              <span className="grid size-[14px] place-items-center rounded-full bg-[#FFC933] shadow-[inset_0_0_0_1px_#E08A00]">
                <GoldCoinIcon className="size-[11px]" />
              </span>
            </span>
          ))
        : null}
    </div>
  );
}
