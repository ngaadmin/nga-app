import { roundAudAmount, roundToHalfStep } from "@/lib/dashboard/destination-jars";

/** Hard cap for vault currency inputs — avoids UI wrap and JS precision issues. */
export const VAULT_MAX_AMOUNT = 1_000_000_000;

/** Maximum digit count (excluding decimal separator) for vault amount inputs. */
export const VAULT_MAX_INPUT_DIGITS = 12;

export const VAULT_AMOUNT_STEP = 0.5;

/** Whole-dollar steps for Vault allocation sliders. */
export const VAULT_SLIDER_STEP = 1;

export function roundToSliderStep(amount: number, step: number = VAULT_SLIDER_STEP): number {
  if (step <= 0) return Math.max(0, amount);
  return Math.round(Math.max(0, amount) / step) * step;
}

export function vaultAllocationRemaining(
  allocatedTotal: number,
  poolTotal: number,
): number {
  return roundAudAmount(Math.max(0, poolTotal - allocatedTotal));
}

export function sumAllocationDraftValues(drafts: Record<string, number>): number {
  return roundAudAmount(
    Object.values(drafts).reduce((total, value) => total + value, 0),
  );
}

/** Highest value a single slider row may take without exceeding the pool. */
export function vaultSliderMaxForEntry(
  poolTotal: number,
  drafts: Record<string, number>,
  entryId: string,
): number {
  const othersTotal = roundAudAmount(
    Object.entries(drafts)
      .filter(([id]) => id !== entryId)
      .reduce((total, [, amount]) => total + amount, 0),
  );
  return roundAudAmount(Math.max(0, poolTotal - othersTotal));
}

export function clampVaultAllocationEntry(
  poolTotal: number,
  othersTotal: number,
  nextValue: number,
): number {
  const cap = roundAudAmount(Math.max(0, poolTotal - othersTotal));
  return roundToSliderStep(Math.min(Math.max(0, nextValue), cap));
}

/** Trim drafts in order when their combined total exceeds the pool. */
export function capAllocationDrafts(
  drafts: Record<string, number>,
  poolTotal: number,
  entryOrder: readonly string[],
): Record<string, number> {
  let remaining = poolTotal;
  const next: Record<string, number> = {};

  for (const id of entryOrder) {
    const raw = drafts[id] ?? 0;
    const assigned = roundToSliderStep(Math.min(Math.max(0, raw), remaining));
    next[id] = assigned;
    remaining = roundAudAmount(Math.max(0, remaining - assigned));
  }

  for (const id of Object.keys(drafts)) {
    if (!(id in next)) next[id] = 0;
  }

  return next;
}

/** True when every dollar in the pool has been assigned (step-aware tolerance). */
export function isVaultAllocationComplete(
  allocatedTotal: number,
  poolTotal: number,
): boolean {
  if (poolTotal <= 0 || allocatedTotal <= 0) return false;
  return vaultAllocationRemaining(allocatedTotal, poolTotal) <= 0;
}

function countAmountDigits(rawValue: string): number {
  return rawValue.replace(/[^\d]/g, "").length;
}

/** Restrict keystrokes to a valid decimal string within digit / value caps. */
export function sanitizeVaultAmountInput(rawValue: string): {
  value: string;
  hitCap: boolean;
} {
  const trimmed = rawValue.trim();
  if (!trimmed) return { value: "", hitCap: false };

  let normalized = trimmed.replace(/[^\d.]/g, "");
  const firstDot = normalized.indexOf(".");
  if (firstDot !== -1) {
    normalized =
      normalized.slice(0, firstDot + 1) +
      normalized.slice(firstDot + 1).replace(/\./g, "");
  }

  let hitCap = false;
  if (countAmountDigits(normalized) > VAULT_MAX_INPUT_DIGITS) {
    hitCap = true;
    while (countAmountDigits(normalized) > VAULT_MAX_INPUT_DIGITS) {
      normalized = normalized.slice(0, -1);
    }
  }

  const parsed = Number.parseFloat(normalized);
  if (Number.isFinite(parsed) && parsed > VAULT_MAX_AMOUNT) {
    hitCap = true;
    return { value: String(VAULT_MAX_AMOUNT), hitCap: true };
  }

  return { value: normalized, hitCap };
}

export function parsePositiveVaultAmount(rawValue: string): number | null {
  const trimmed = rawValue.trim();
  if (!trimmed) return null;
  const parsed = Number.parseFloat(trimmed);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return roundToHalfStep(Math.min(parsed, VAULT_MAX_AMOUNT));
}

/** Parses a savings target — empty or zero clears the target without touching balance. */
export function parseVaultTargetAmount(rawValue: string): number {
  const trimmed = rawValue.trim();
  if (!trimmed) return 0;
  const parsed = Number.parseFloat(trimmed);
  if (!Number.isFinite(parsed) || parsed <= 0) return 0;
  return roundAudAmount(Math.min(parsed, VAULT_MAX_AMOUNT));
}
