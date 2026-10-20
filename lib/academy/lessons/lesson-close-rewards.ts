import { BONUS_RUN_COINS } from "@/lib/academy/lessons/bonus-run";

/** Delay between reward lines zooming in. */
export const REWARD_LINE_STAGGER_MS = 360;

export type LessonCloseRewardLine = {
  id: "base" | "perfect" | "bonus";
  emoji: string;
  label: string;
  /** Shown under the label, for example "2 bonus runs × 10". */
  detail?: string;
  coins: number;
};

function bonusRunDetail(runs: number): string {
  const count = Math.max(1, Math.floor(runs));
  const runWord = count === 1 ? "bonus run" : "bonus runs";
  return `${count} ${runWord} × ${BONUS_RUN_COINS}`;
}

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
      emoji: "🎓",
      label: "Lesson complete",
      coins: input.base,
    },
  ];

  if (input.perfect && input.perfectBonus > 0) {
    lines.push({
      id: "perfect",
      emoji: "⭐",
      label: "Perfect lesson",
      detail: "No mistakes",
      coins: input.perfectBonus,
    });
  }

  const bonus = Math.max(0, Math.floor(input.bonusCoins));
  const runs = Math.max(0, Math.floor(input.runs));
  if (bonus > 0 && runs >= 1) {
    lines.push({
      id: "bonus",
      emoji: "🔥",
      label: runs === 1 ? "Bonus run" : "Bonus runs",
      detail: bonusRunDetail(runs),
      coins: bonus,
    });
  }

  return lines;
}

export function lessonCloseRewardTotal(lines: readonly LessonCloseRewardLine[]): number {
  return lines.reduce((sum, line) => sum + line.coins, 0);
}
