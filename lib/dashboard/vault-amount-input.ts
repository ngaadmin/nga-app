import { roundToHalfStep } from "@/lib/dashboard/destination-jars";

export const VAULT_AMOUNT_STEP = 0.5;

/** Whole-dollar steps for Vault budget and savings allocation sliders. */
export const VAULT_SLIDER_STEP = 1;

export function roundToSliderStep(amount: number): number {
  return Math.round(Math.max(0, amount) / VAULT_SLIDER_STEP) * VAULT_SLIDER_STEP;
}

export function parsePositiveVaultAmount(rawValue: string): number | null {
  const trimmed = rawValue.trim();
  if (!trimmed) return null;
  const parsed = Number.parseFloat(trimmed);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return roundToHalfStep(parsed);
}
