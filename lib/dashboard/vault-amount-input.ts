import { roundAudAmount, roundToHalfStep } from "@/lib/dashboard/destination-jars";

export const VAULT_AMOUNT_STEP = 0.5;

/** Whole-dollar steps for Vault allocation sliders. */
export const VAULT_SLIDER_STEP = 1;

/** Drag dampening scales down large jumps so thumbs are easier to land precisely. */
export function resolveVaultSliderDampening(maxAmount: number): number {
  if (maxAmount <= 10) return 0.82;
  if (maxAmount <= 30) return 0.5;
  if (maxAmount <= 80) return 0.34;
  if (maxAmount <= 200) return 0.22;
  return 0.16;
}

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

export function parsePositiveVaultAmount(rawValue: string): number | null {
  const trimmed = rawValue.trim();
  if (!trimmed) return null;
  const parsed = Number.parseFloat(trimmed);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return roundToHalfStep(parsed);
}
