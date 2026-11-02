import { convertPointsToCents } from "@/lib/dashboard/point-conversion";

/**
 * What a child's coins balance is worth at the cash rate, in the display
 * currency (whole cents, rounded down like a cash-in). Null when no rate is
 * set, so the page shows "Set cash rate" instead of a value.
 */
export function coinsCashWorth(
  coins: number,
  centsPer100Coins: number | null | undefined,
): number | null {
  if (centsPer100Coins == null || !(centsPer100Coins > 0)) return null;
  return convertPointsToCents(coins, centsPer100Coins) / 100;
}
