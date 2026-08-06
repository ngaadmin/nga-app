import { roundAudAmount } from "@/lib/dashboard/destination-jars";

/** Hard cap for vault currency inputs — avoids UI wrap and JS precision issues. */
export const VAULT_MAX_AMOUNT = 1_000_000_000;

/** Maximum digit count for vault amount inputs (whole dollars only). */
export const VAULT_MAX_INPUT_DIGITS = 12;

/** @deprecated Vault amounts are whole dollars — use {@link VAULT_SLIDER_STEP}. */
export const VAULT_AMOUNT_STEP = 1;

/** Whole-dollar steps for Vault allocation sliders and amount inputs. */
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

/** Digits only from a vault amount field (drops cents / decimal fragments). */
function vaultAmountDigits(rawValue: string): string {
  // Period starts a fractional/cents attempt — ignore it and anything after.
  const wholePart = rawValue.split(".")[0] ?? "";
  return wholePart.replace(/[^\d]/g, "");
}

function formatVaultAmountDigits(digits: string): string {
  if (!digits) return "";
  const parsed = Number.parseInt(digits, 10);
  if (!Number.isFinite(parsed)) return "";
  return new Intl.NumberFormat("en-AU", {
    maximumFractionDigits: 0,
    useGrouping: true,
  }).format(parsed);
}

/**
 * Restrict keystrokes to whole dollars with thousands separators
 * (e.g. `1,000`). Cents / decimals are not accepted.
 */
export function sanitizeVaultAmountInput(rawValue: string): {
  value: string;
  hitCap: boolean;
} {
  const trimmed = rawValue.trim();
  if (!trimmed) return { value: "", hitCap: false };

  let digits = vaultAmountDigits(trimmed);
  let hitCap = false;

  if (digits.length > VAULT_MAX_INPUT_DIGITS) {
    hitCap = true;
    digits = digits.slice(0, VAULT_MAX_INPUT_DIGITS);
  }

  const parsed = Number.parseInt(digits, 10);
  if (Number.isFinite(parsed) && parsed > VAULT_MAX_AMOUNT) {
    hitCap = true;
    return {
      value: formatVaultAmountDigits(String(VAULT_MAX_AMOUNT)),
      hitCap: true,
    };
  }

  return { value: formatVaultAmountDigits(digits), hitCap };
}

/** Parses a non-negative whole-dollar vault amount (`1,000` → `1000`). Empty → null. */
export function parseVaultAmountInput(rawValue: string): number | null {
  const trimmed = rawValue.trim();
  if (!trimmed) return null;
  const digits = vaultAmountDigits(trimmed);
  if (!digits) return null;
  const parsed = Number.parseInt(digits, 10);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return Math.min(parsed, VAULT_MAX_AMOUNT);
}

/** Parses a positive whole-dollar vault amount (`1,000` → `1000`). */
export function parsePositiveVaultAmount(rawValue: string): number | null {
  const parsed = parseVaultAmountInput(rawValue);
  if (parsed === null || parsed <= 0) return null;
  return parsed;
}

/** Display helper for controlled vault amount fields (thousands separators). */
export function formatVaultAmountInputValue(amount: number): string {
  const whole = Math.round(Math.max(0, amount));
  if (whole <= 0) return "";
  return sanitizeVaultAmountInput(String(whole)).value;
}

/** Parses a savings target — empty or zero clears the target without touching balance. */
export function parseVaultTargetAmount(rawValue: string): number {
  const digits = vaultAmountDigits(rawValue);
  if (!digits) return 0;
  const parsed = Number.parseInt(digits, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return 0;
  return Math.min(parsed, VAULT_MAX_AMOUNT);
}
