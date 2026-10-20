"use client";

import { useLayoutEffect, useState } from "react";
import {
  clearCoinCounterTick,
  COIN_COUNTER_ATTR,
  lessonMotionEnabled,
  readCoinCounterTick,
} from "@/lib/academy/lessons/coin-counter-flight";
import { coinWord } from "@/lib/copy/coin-word";
import { cn } from "@/lib/utils/cn";

const BUMP_MS = 200;

const COIN_STYLE = {
  background:
    "radial-gradient(circle at 35% 30%, #FFE08A 0%, #FFB822 55%, #E89B00 100%)",
  boxShadow: "inset 0 0 0 2px #E89B00",
} as const;

type LessonCloseCoinCounterProps = {
  balance: number;
};

/** Coins balance on the lesson close screen. This is the fly target. */
export function LessonCloseCoinCounter({ balance }: LessonCloseCoinCounterProps) {
  const [bump, setBump] = useState(false);
  const unit = coinWord(balance);

  useLayoutEffect(() => {
    const pending = readCoinCounterTick();
    if (pending > 0) clearCoinCounterTick();
    if (pending > 0 && lessonMotionEnabled()) {
      setBump(true);
      const timer = window.setTimeout(() => setBump(false), BUMP_MS);
      return () => window.clearTimeout(timer);
    }
    setBump(false);
  }, [balance]);

  return (
    <div
      {...{ [COIN_COUNTER_ATTR]: "" }}
      data-coin-balance={balance}
      className={cn(
        "inline-flex items-center gap-2",
        bump && "lesson-close-counter-bump",
      )}
      aria-label={`${balance} ${unit}`}
    >
      <span className="size-7 shrink-0 rounded-full" style={COIN_STYLE} aria-hidden />
      <span className="font-heading text-[16px] font-extrabold tabular-nums text-[#031F82]">
        {balance.toLocaleString()}
      </span>
      <span className="font-sans text-[14px] font-semibold text-[#5A6A99]">{unit}</span>
    </div>
  );
}
