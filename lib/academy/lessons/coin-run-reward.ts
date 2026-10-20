import {
  applyBonusRunEvent,
  BONUS_RUN_COINS,
  initialBonusRunState,
  type BonusRunEvent,
} from "@/lib/academy/lessons/bonus-run";
import { COIN_RUN_METER_SLOTS } from "@/lib/academy/lessons/coin-run-meter";

/** Only text in the payout chip. */
export const COIN_RUN_REWARD_LABEL = `+${BONUS_RUN_COINS} coins`;

/** Full flight, from the chip appearing to the meter emptying. */
export const COIN_RUN_REWARD_MS = 1200;

/** Same payout, without the flying coins. */
export const COIN_RUN_REWARD_FADE_MS = 1000;

/** Gap between each coin leaving the chip. The last coin still finishes inside the flight. */
export const COIN_RUN_REWARD_STAGGER_MS = 35;

export type CoinRunRewardMotion = "fly" | "fade";

export type CoinRunRewardCue = {
  motion: CoinRunRewardMotion;
  label: string;
  /** How long the chip stays up, including the stagger on a flight. */
  durationMs: number;
  runs: number;
};

/**
 * One payout of the bonus run. A wrong answer, an unscored screen, or a
 * repeat of the same run does not cue. Reduced motion fades the chip.
 */
export function coinRunRewardCue(input: {
  previousRuns: number;
  runs: number;
  prefersReducedMotion: boolean;
}): CoinRunRewardCue | null {
  if (!(input.runs > input.previousRuns)) return null;
  const motion: CoinRunRewardMotion = input.prefersReducedMotion ? "fade" : "fly";
  return {
    motion,
    label: COIN_RUN_REWARD_LABEL,
    durationMs: motion === "fade" ? COIN_RUN_REWARD_FADE_MS : COIN_RUN_REWARD_MS,
    runs: input.runs,
  };
}

/** How long one flying coin animates so the staggered set ends with the chip. */
export function coinRunRewardFlySpanMs(): number {
  return COIN_RUN_REWARD_MS - COIN_RUN_REWARD_STAGGER_MS * (COIN_RUN_METER_SLOTS - 1);
}

/**
 * Cues produced by playing the bonus run. Each time `runs` increases is one
 * payout, so five correct answers cue once and the next five cue again.
 */
export function coinRunRewardCues(
  events: readonly BonusRunEvent[],
  prefersReducedMotion = false,
): CoinRunRewardCue[] {
  const cues: CoinRunRewardCue[] = [];
  let state = initialBonusRunState();
  for (const event of events) {
    const next = applyBonusRunEvent(state, event);
    const cue = coinRunRewardCue({
      previousRuns: state.runs,
      runs: next.runs,
      prefersReducedMotion,
    });
    if (cue) cues.push(cue);
    state = next;
  }
  return cues;
}
