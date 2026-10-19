"use client";

import { forwardRef, useLayoutEffect, useRef, useState } from "react";
import { lessonMotionEnabled } from "@/lib/academy/lessons/coin-counter-flight";
import {
  lessonCloseRewardLines,
  lessonCloseRewardTotal,
} from "@/lib/academy/lessons/lesson-close-rewards";
import {
  LessonCloseRewardView,
  REWARD_LINE_STAGGER_MS,
} from "@/lib/academy/lessons/lesson-close-reward-view";

const COUNT_MS = 360;

type LessonCompletionRewardsCardProps = {
  xpReward: number;
  perfectStreakBonus: number;
  perfectStreak: boolean;
  bonusCoins?: number;
  bonusRuns?: number;
  /** Zoom each line in, then count the total up. Off for static summaries. */
  animate?: boolean;
  className?: string;
};

export const LessonCompletionRewardsCard = forwardRef<
  HTMLParagraphElement,
  LessonCompletionRewardsCardProps
>(function LessonCompletionRewardsCard(
  {
    xpReward,
    perfectStreakBonus,
    perfectStreak,
    bonusCoins = 0,
    bonusRuns = 0,
    animate = false,
    className,
  },
  ref,
) {
  const lines = lessonCloseRewardLines({
    base: xpReward,
    perfect: perfectStreak,
    perfectBonus: perfectStreakBonus,
    bonusCoins,
    runs: bonusRuns,
  });
  const finalTotal = lessonCloseRewardTotal(lines);
  const signature = lines.map((line) => `${line.id}:${line.coins}`).join("|");
  const linesRef = useRef(lines);
  linesRef.current = lines;
  const [shown, setShown] = useState(animate ? 0 : finalTotal);

  useLayoutEffect(() => {
    const current = linesRef.current;
    const final = lessonCloseRewardTotal(current);
    if (!animate || !lessonMotionEnabled()) {
      setShown(final);
      return;
    }

    setShown(0);
    const started = performance.now();
    const steps = current.map((_, index) => ({
      at: index * REWARD_LINE_STAGGER_MS,
      from: lessonCloseRewardTotal(current.slice(0, index)),
      to: lessonCloseRewardTotal(current.slice(0, index + 1)),
    }));
    const last = steps[steps.length - 1];
    let frame = 0;
    const tick = (now: number) => {
      const elapsed = now - started;
      let value = 0;
      for (const step of steps) {
        if (elapsed < step.at) break;
        const progress = Math.min(1, (elapsed - step.at) / COUNT_MS);
        value = Math.round(step.from + (step.to - step.from) * progress);
      }
      setShown(value);
      if (last && elapsed < last.at + COUNT_MS) {
        frame = requestAnimationFrame(tick);
        return;
      }
      setShown(final);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [animate, signature]);

  return (
    <LessonCloseRewardView
      xpReward={xpReward}
      perfectStreakBonus={perfectStreakBonus}
      perfectStreak={perfectStreak}
      bonusCoins={bonusCoins}
      bonusRuns={bonusRuns}
      shown={shown}
      animate={animate}
      totalRef={ref}
      className={className}
    />
  );
});
