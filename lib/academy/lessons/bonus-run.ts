import { screenHeartCost } from "@/lib/academy/lessons/payload/heart-cost";
import type { ScreenConfig } from "@/lib/academy/lessons/types";

/** Correct answers in a row required for one bonus award. */
export const BONUS_RUN_LENGTH = 5;

/** Coins for each bonus run. The next run starts from zero and pays the same. */
export const BONUS_RUN_COINS = 10;

export type BonusRunState = {
  /** Correct answers toward the next award. */
  streak: number;
  bonusCoins: number;
  runs: number;
  /** First result for a unit wins. A later try on that unit does not count. */
  settled: Readonly<Record<string, "correct" | "wrong">>;
};

export type BonusRunEvent =
  | { kind: "correct"; unitId: string }
  | { kind: "wrong"; unitId: string }
  | { kind: "unscored" }
  | { kind: "reset" };

export function initialBonusRunState(): BonusRunState {
  return { streak: 0, bonusCoins: 0, runs: 0, settled: {} };
}

/**
 * One step of the in-lesson bonus run.
 * A wrong answer clears the streak. Five correct answers pay 10 coins and
 * clear the streak so the next five can pay again. Unscored screens and a
 * second try on the same answer do not move the streak.
 */
export function applyBonusRunEvent(
  state: BonusRunState,
  event: BonusRunEvent,
): BonusRunState {
  if (event.kind === "reset") return initialBonusRunState();
  if (event.kind === "unscored") return state;
  if (state.settled[event.unitId]) return state;

  const settled = {
    ...state.settled,
    [event.unitId]: event.kind === "correct" ? ("correct" as const) : ("wrong" as const),
  };

  if (event.kind === "wrong") {
    return { ...state, streak: 0, settled };
  }

  const streak = state.streak + 1;
  if (streak >= BONUS_RUN_LENGTH) {
    return {
      streak: 0,
      bonusCoins: state.bonusCoins + BONUS_RUN_COINS,
      runs: state.runs + 1,
      settled,
    };
  }

  return { ...state, streak, settled };
}

export function reduceBonusRun(events: readonly BonusRunEvent[]): BonusRunState {
  return events.reduce(applyBonusRunEvent, initialBonusRunState());
}

/** One spotlight round is its own answer. Rounds do not share a unit. */
export function spotlightRoundUnitId(screenIndex: number, roundIndex: number): string {
  return `spotlight:${screenIndex}:${roundIndex}`;
}

/**
 * Unit id for a scored screen, or null when the screen cannot count.
 * Tap-reveal, hold-to-fill, and completion never count. Spotlight rounds
 * use {@link spotlightRoundUnitId} instead of one id for the whole screen.
 * A screen counts only when a miss would also cost the perfect lesson.
 */
export function bonusRunUnitForScreen(
  screen: ScreenConfig,
  screenIndex: number,
): string | null {
  if (
    screen.type === "tap-reveal" ||
    screen.type === "hold-to-fill" ||
    screen.type === "completion" ||
    screen.type === "narrative-bonus" ||
    screen.type === "skill-hub" ||
    screen.type === "custom" ||
    screen.type === "spotlight-rounds"
  ) {
    return null;
  }
  if (!screenHeartCost(screen).costsHeart) return null;
  return `screen:${screenIndex}`;
}
