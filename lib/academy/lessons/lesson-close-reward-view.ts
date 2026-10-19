import { createElement, type ReactNode, type Ref } from "react";
import { coinWord } from "@/lib/copy/coin-word";
import {
  lessonCloseRewardLines,
  lessonCloseRewardTotal,
} from "@/lib/academy/lessons/lesson-close-rewards";
import { cn } from "@/lib/utils/cn";

/** Delay between reward lines zooming in. */
export const REWARD_LINE_STAGGER_MS = 360;

type LessonCloseRewardViewProps = {
  xpReward: number;
  perfectStreakBonus: number;
  perfectStreak: boolean;
  bonusCoins?: number;
  bonusRuns?: number;
  /** Count-up value. Omit to show the finished total. */
  shown?: number;
  animate?: boolean;
  totalRef?: Ref<HTMLParagraphElement>;
  className?: string;
};

/** Reward lines and total shared by the lesson close screen. */
export function LessonCloseRewardView({
  xpReward,
  perfectStreakBonus,
  perfectStreak,
  bonusCoins = 0,
  bonusRuns = 0,
  shown,
  animate = false,
  totalRef,
  className,
}: LessonCloseRewardViewProps): ReactNode {
  const lines = lessonCloseRewardLines({
    base: xpReward,
    perfect: perfectStreak,
    perfectBonus: perfectStreakBonus,
    bonusCoins,
    runs: bonusRuns,
  });
  const finalTotal = lessonCloseRewardTotal(lines);
  const visible = shown ?? finalTotal;
  const totalLabel = `+${finalTotal} ${coinWord(finalTotal)}`;

  return createElement(
    "div",
    { className: cn("mt-2", className) },
    lines.map((line, index) =>
      createElement(
        "p",
        {
          key: line.id,
          "data-reward-line": line.id,
          className: cn(
            "font-sans text-[15px] font-bold text-[#031F82]",
            index > 0 && "mt-2.5",
            animate && "lesson-reward-line",
          ),
          style: animate
            ? { animationDelay: `${index * REWARD_LINE_STAGGER_MS}ms` }
            : undefined,
        },
        line.text,
        line.detail
          ? createElement(
              "span",
              { className: "mt-1 block text-[13px] font-semibold" },
              line.detail,
            )
          : null,
      ),
    ),
    createElement(
      "p",
      {
        ref: totalRef,
        "data-lesson-reward-total": finalTotal,
        "data-reward-label": totalLabel,
        "aria-label": `Total ${totalLabel}`,
        className: "mt-3 font-heading text-[22px] font-bold tabular-nums text-[#031F82]",
      },
      `+${visible.toLocaleString()} ${coinWord(visible)}`,
    ),
  );
}
