export const FIXED_XP_BLOCK = 100;

export const MIN_AUD_PER_XP_BLOCK = 0.5;
export const MAX_AUD_PER_XP_BLOCK = 5;
export const AUD_PER_BLOCK_STEP = 0.5;

const MIN_SLIDER_INDEX = MIN_AUD_PER_XP_BLOCK / AUD_PER_BLOCK_STEP;
const MAX_SLIDER_INDEX = MAX_AUD_PER_XP_BLOCK / AUD_PER_BLOCK_STEP;

export { MIN_SLIDER_INDEX as MIN_AUD_SLIDER_INDEX, MAX_SLIDER_INDEX as MAX_AUD_SLIDER_INDEX };

/** Map slider index (1–10) to AUD payout per fixed 100 XP block. */
export function audPerXpBlockFromSliderIndex(sliderIndex: number): number {
  const clamped = Math.min(
    MAX_SLIDER_INDEX,
    Math.max(MIN_SLIDER_INDEX, sliderIndex),
  );
  return Math.round(clamped * AUD_PER_BLOCK_STEP * 100) / 100;
}

export function sliderIndexFromAudPerXpBlock(audPerBlock: number): number {
  const index = Math.round(audPerBlock / AUD_PER_BLOCK_STEP);
  return Math.min(MAX_SLIDER_INDEX, Math.max(MIN_SLIDER_INDEX, index));
}

export type XpCashQuote = {
  /** Whole cents, rounded down. Never a fraction of a cent. */
  audCents: number;
  /** XP that those cents actually cost. Leftover XP stays in the balance. */
  pointsCharged: number;
};

/**
 * Whole cents for `points` at `centsPer100Xp` per 100 XP.
 * Integer math, rounded down. A fraction of a cent pays nothing.
 * `pointsCharged` is the smallest XP amount that produces those cents.
 */
export function quoteXpCashIn(points: number, centsPer100Xp: number): XpCashQuote {
  const safePoints = Math.floor(points);
  const rate = Math.floor(centsPer100Xp);
  const none: XpCashQuote = { audCents: 0, pointsCharged: 0 };
  if (!Number.isSafeInteger(safePoints) || safePoints <= 0) return none;
  if (!Number.isSafeInteger(rate) || rate <= 0) return none;
  const product = safePoints * rate;
  if (!Number.isSafeInteger(product)) return none;
  const audCents = Math.floor(product / FIXED_XP_BLOCK);
  if (audCents <= 0) return none;
  const numerator = audCents * FIXED_XP_BLOCK;
  if (!Number.isSafeInteger(numerator)) return none;
  const pointsCharged = Math.floor((numerator + rate - 1) / rate);
  if (
    !Number.isSafeInteger(pointsCharged) ||
    pointsCharged <= 0 ||
    pointsCharged > safePoints
  ) {
    return none;
  }
  return { audCents, pointsCharged };
}

/** Whole cents, rounded down. A rate of 1 cent is allowed. There is no $0.50 floor. */
export function convertPointsToCents(points: number, centsPer100Xp: number): number {
  return quoteXpCashIn(points, centsPer100Xp).audCents;
}

/** Convert spendable XP to a dollar amount using cents per 100 XP. */
export function convertPointsToAud(
  points: number,
  audPer100Xp: number,
): number {
  const centsPer100 = Math.round(Math.max(0, audPer100Xp) * 100);
  return convertPointsToCents(points, centsPer100) / 100;
}

import type { SupportedCurrencyCode } from "@/lib/dashboard/currency/currencies";
import { formatMoney } from "@/lib/dashboard/currency/format-money";

export function formatAud(amount: number): string {
  return formatMoney(amount, "AUD");
}

export function formatConversionRateLabel(
  audPer100Xp: number,
  currencyCode: SupportedCurrencyCode = "AUD",
): string {
  return `100 coins = ${formatMoney(audPer100Xp, currencyCode)}`;
}

export function parsePointsInput(rawValue: string): number | null {
  const trimmed = rawValue.trim();
  if (!trimmed) return null;

  const parsed = Number.parseInt(trimmed, 10);
  if (!Number.isFinite(parsed) || parsed < 0) return null;

  return parsed;
}

export const DEFAULT_AUD_SLIDER_INDEX = sliderIndexFromAudPerXpBlock(1);
