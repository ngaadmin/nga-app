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

/** Convert virtual points to AUD using AUD earned per 100 XP. */
export function convertPointsToAud(
  points: number,
  audPer100Xp: number,
): number {
  const safePoints = Math.max(0, points);
  const safeRate = Math.max(MIN_AUD_PER_XP_BLOCK, audPer100Xp);
  return (
    Math.round(safePoints * (safeRate / FIXED_XP_BLOCK) * 100) / 100
  );
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
  return `100 XP = ${formatMoney(audPer100Xp, currencyCode)}`;
}

export function parsePointsInput(rawValue: string): number | null {
  const trimmed = rawValue.trim();
  if (!trimmed) return null;

  const parsed = Number.parseInt(trimmed, 10);
  if (!Number.isFinite(parsed) || parsed < 0) return null;

  return parsed;
}

export const DEFAULT_AUD_SLIDER_INDEX = sliderIndexFromAudPerXpBlock(1);
