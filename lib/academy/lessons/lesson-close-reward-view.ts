import { createElement, type ReactNode, type Ref } from "react";
import { coinWord } from "@/lib/copy/coin-word";
import {
  lessonCloseRewardLines,
  lessonCloseRewardTotal,
  REWARD_LINE_STAGGER_MS,
} from "@/lib/academy/lessons/lesson-close-rewards";
import { cn } from "@/lib/utils/cn";

const PENNY_SRC = "/assets/illustrations/characters/penny/penny-master-512.webp";

type LessonCloseRewardViewProps = {
  xpReward: number;
  perfectStreakBonus: number;
  perfectStreak: boolean;
  bonusCoins?: number;
  bonusRuns?: number;
  /** Count-up value. Omit to show the finished total. */
  shown?: number;
  animate?: boolean;
  /** Hide the sum while it flies to the counter. */
  concealed?: boolean;
  /** Replace the sum after the coins land. */
  cashedIn?: boolean;
  /** Pop the total once the count-up finishes. */
  pop?: boolean;
  totalRef?: Ref<HTMLParagraphElement>;
  className?: string;
};

function node(
  type: string,
  props: Record<string, unknown> | null,
  ...children: Array<ReactNode | string | null>
): ReactNode {
  return createElement(type, props, ...children);
}

/** Receipt rows and the Penny total on the lesson close screen. */
export function LessonCloseRewardView({
  xpReward,
  perfectStreakBonus,
  perfectStreak,
  bonusCoins = 0,
  bonusRuns = 0,
  shown,
  animate = false,
  concealed = false,
  cashedIn = false,
  pop = false,
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
  const totalLabel = `+${finalTotal.toLocaleString()}`;
  const totalName = `Total ${totalLabel} ${coinWord(finalTotal)}`;

  return node(
    "div",
    { className: cn("w-full", className) },
    node(
      "div",
      { className: "divide-y divide-[#E3EEF6] border-y border-[#E3EEF6]" },
      ...lines.map((line, index) =>
        node(
          "div",
          {
            key: line.id,
            "data-reward-line": line.id,
            className: cn(
              "flex min-h-[58px] items-center gap-2 py-2",
              animate && "lesson-reward-line",
            ),
            style: animate
              ? { animationDelay: `${index * REWARD_LINE_STAGGER_MS}ms` }
              : undefined,
          },
          node(
            "span",
            {
              className:
                "grid w-8 shrink-0 place-items-center text-[24px] leading-none",
              "aria-hidden": true,
            },
            line.emoji,
          ),
          node(
            "span",
            { className: "min-w-0 flex-1 text-left" },
            node(
              "span",
              {
                className:
                  "block font-sans text-[16px] font-semibold leading-tight text-[#031F82]",
              },
              line.label,
            ),
            line.detail
              ? node(
                  "span",
                  {
                    className:
                      "mt-0.5 block font-sans text-[13px] font-medium leading-tight text-[#5A6A99]",
                  },
                  line.detail,
                )
              : null,
          ),
          node(
            "span",
            {
              className:
                "shrink-0 font-heading text-[18px] font-extrabold tabular-nums text-[#031F82]",
            },
            `+${line.coins.toLocaleString()}`,
          ),
        ),
      ),
    ),
    node(
      "div",
      {
        className: cn(
          "mt-5 flex items-center justify-center gap-4",
          concealed && "invisible",
        ),
      },
      node("img", {
        src: PENNY_SRC,
        alt: "Penny",
        className: "h-[92px] w-auto object-contain",
        decoding: "async",
      }),
      node(
        "div",
        { className: "text-left" },
        node(
          "p",
          { className: "font-sans text-[14px] font-semibold text-[#5A6A99]" },
          "Total",
        ),
        cashedIn
          ? node(
              "p",
              {
                className:
                  "font-heading text-[22px] font-extrabold leading-tight text-[#031F82]",
              },
              "Cashed in ✓",
            )
          : node(
              "div",
              null,
              node(
                "p",
                {
                  ref: totalRef,
                  "data-lesson-reward-total": finalTotal,
                  "data-reward-label": totalLabel,
                  "aria-label": totalName,
                  className: cn(
                    "font-heading text-[44px] font-extrabold tabular-nums leading-none text-[#031F82]",
                    pop && "lesson-close-total-pop",
                  ),
                },
                `+${visible.toLocaleString()}`,
              ),
              node(
                "p",
                {
                  className:
                    "mt-1 font-sans text-[15px] font-semibold text-[#031F82]",
                },
                coinWord(visible),
              ),
            ),
      ),
    ),
  );
}

export { REWARD_LINE_STAGGER_MS };
