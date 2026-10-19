import { BONUS_RUN_LENGTH } from "@/lib/academy/lessons/bonus-run";
import { coinWord } from "@/lib/copy/coin-word";

export type LessonCloseRewardLine = {
  id: "base" | "perfect" | "bonus";
  text: string;
  /** Shown under a bonus line, for example "2 runs of 5 in a row". */
  detail?: string;
  coins: number;
};

/** Lines on the lesson close screen. Perfect and bonus lines are omitted at zero. */
export function lessonCloseRewardLines(input: {
  base: number;
  perfect: boolean;
  perfectBonus: number;
  bonusCoins: number;
  runs: number;
}): LessonCloseRewardLine[] {
  const lines: LessonCloseRewardLine[] = [
    {
      id: "base",
      coins: input.base,
      text: `Lesson complete +${input.base} ${coinWord(input.base)}`,
    },
  ];

  if (input.perfect && input.perfectBonus > 0) {
    lines.push({
      id: "perfect",
      coins: input.perfectBonus,
      text: `Perfect lesson +${input.perfectBonus} ${coinWord(input.perfectBonus)}`,
    });
  }

  const bonus = Math.max(0, Math.floor(input.bonusCoins));
  if (bonus > 0) {
    const runs = Math.max(1, Math.floor(input.runs));
    const runWord = runs === 1 ? "run" : "runs";
    lines.push({
      id: "bonus",
      coins: bonus,
      text: `Bonus run +${bonus} ${coinWord(bonus)}`,
      detail: `${runs} ${runWord} of ${BONUS_RUN_LENGTH} in a row`,
    });
  }

  return lines;
}

export function lessonCloseRewardTotal(lines: readonly LessonCloseRewardLine[]): number {
  return lines.reduce((sum, line) => sum + line.coins, 0);
}
