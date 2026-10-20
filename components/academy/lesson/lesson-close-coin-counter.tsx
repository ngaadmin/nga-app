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

const COUNT_MS = 500;
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
  const [shown, setShown] = useState(balance);
  const [bump, setBump] = useState(false);
  const unit = coinWord(shown);

  useLayoutEffect(() => {
    const pending = readCoinCounterTick();
    const motion = lessonMotionEnabled();
    if (pending <= 0 || !motion) {
      if (pending > 0) clearCoinCounterTick();
      setShown(balance);
      setBump(false);
      return;
    }

    const from = Math.max(0, balance - pending);
    setShown(from);
    setBump(true);
    let frame = 0;
    const bumpTimer = window.setTimeout(() => {
      setBump(false);
      const started = performance.now();
      const step = (now: number) => {
        const progress = Math.min(1, (now - started) / COUNT_MS);
        setShown(Math.round(from + (balance - from) * progress));
        if (progress < 1) {
          frame = requestAnimationFrame(step);
          return;
        }
        clearCoinCounterTick();
      };
      frame = requestAnimationFrame(step);
    }, BUMP_MS);

    return () => {
      window.clearTimeout(bumpTimer);
      cancelAnimationFrame(frame);
    };
  }, [balance]);

  return (
    <div
      {...{ [COIN_COUNTER_ATTR]: "" }}
      className={cn(
        "inline-flex items-center gap-2",
        bump && "lesson-close-counter-bump",
      )}
      aria-label={`${shown} ${unit}`}
    >
      <span className="size-7 shrink-0 rounded-full" style={COIN_STYLE} aria-hidden />
      <span className="font-heading text-[16px] font-extrabold tabular-nums text-[#031F82]">
        {shown.toLocaleString()}
      </span>
      <span className="font-sans text-[14px] font-semibold text-[#5A6A99]">{unit}</span>
    </div>
  );
}
