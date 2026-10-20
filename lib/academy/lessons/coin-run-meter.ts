import { BONUS_RUN_LENGTH } from "@/lib/academy/lessons/bonus-run";

/** Slots in the lesson-header coin meter. One slot per answer in a bonus run. */
export const COIN_RUN_METER_SLOTS = BONUS_RUN_LENGTH;

/** How many slots show a coin for the current bonus-run streak. */
export function coinRunMeterFilledCount(streak: number): number {
  if (!Number.isFinite(streak)) return 0;
  const whole = Math.trunc(streak);
  if (whole <= 0) return 0;
  return Math.min(COIN_RUN_METER_SLOTS, whole);
}

/** Left-to-right fill. Index 0 is the first slot. */
export function coinRunMeterSlots(streak: number): boolean[] {
  const filled = coinRunMeterFilledCount(streak);
  return Array.from({ length: COIN_RUN_METER_SLOTS }, (_, index) => index < filled);
}

/** Accessible name for the header meter. Emptying is not a live announcement. */
export function coinRunMeterLabel(streak: number): string {
  const filled = coinRunMeterFilledCount(streak);
  return `${filled} of ${COIN_RUN_METER_SLOTS} coins towards your bonus`;
}
