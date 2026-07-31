import { roundAudAmount } from "@/lib/dashboard/destination-jars";

/** Sum allocation amounts using live input text for the focused row. */
export function sumEffectiveAllocationInputs(
  bucketIds: readonly string[],
  drafts: Record<string, number>,
  inputs: Record<string, string>,
  focusedBucketId: string | null,
): number {
  return roundAudAmount(
    bucketIds.reduce((sum, id) => sum + effectiveAllocationEntryAmount(
      id,
      drafts,
      inputs,
      focusedBucketId,
    ), 0),
  );
}

/** Live amount for one bucket row (focused input when typing, otherwise draft). */
export function effectiveAllocationEntryAmount(
  bucketId: string,
  drafts: Record<string, number>,
  inputs: Record<string, string>,
  focusedBucketId: string | null,
): number {
  if (focusedBucketId === bucketId && inputs[bucketId] !== undefined) {
    const raw = inputs[bucketId];
    if (raw === "" || raw === ".") return 0;
    const parsed = Number.parseFloat(raw);
    if (Number.isFinite(parsed) && parsed >= 0) return parsed;
    return 0;
  }
  return drafts[bucketId] ?? 0;
}

/** Sum effective amounts for all buckets except one id. */
export function sumEffectiveAllocationInputsExcept(
  bucketId: string,
  bucketIds: readonly string[],
  drafts: Record<string, number>,
  inputs: Record<string, string>,
  focusedBucketId: string | null,
): number {
  return roundAudAmount(
    bucketIds
      .filter((id) => id !== bucketId)
      .reduce(
        (sum, id) =>
          sum +
          effectiveAllocationEntryAmount(id, drafts, inputs, focusedBucketId),
        0,
      ),
  );
}

/** Remaining pool for display — never below $0.00. */
export function vaultAllocationRemainingDisplay(
  poolTotal: number,
  allocatedTotal: number,
): number {
  return roundAudAmount(Math.max(0, poolTotal - allocatedTotal));
}

export function isAllocationOverPool(
  poolTotal: number,
  allocatedTotal: number,
): boolean {
  return roundAudAmount(allocatedTotal) > roundAudAmount(poolTotal) + 0.001;
}

/** Max amount the active row may take without exceeding the pool. */
export function vaultAllocationEntryCap(
  poolTotal: number,
  drafts: Record<string, number>,
  bucketIds: readonly string[],
  activeBucketId: string,
): number {
  const othersTotal = roundAudAmount(
    bucketIds
      .filter((id) => id !== activeBucketId)
      .reduce((sum, id) => sum + (drafts[id] ?? 0), 0),
  );
  return roundAudAmount(Math.max(0, poolTotal - othersTotal));
}
