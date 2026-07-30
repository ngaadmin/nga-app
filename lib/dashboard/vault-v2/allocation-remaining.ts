import { roundAudAmount } from "@/lib/dashboard/destination-jars";

/** Sum allocation amounts using live input text for the focused row. */
export function sumEffectiveAllocationInputs(
  bucketIds: readonly string[],
  drafts: Record<string, number>,
  inputs: Record<string, string>,
  focusedBucketId: string | null,
): number {
  return roundAudAmount(
    bucketIds.reduce((sum, id) => {
      if (focusedBucketId === id && inputs[id] !== undefined) {
        const raw = inputs[id];
        if (raw === "" || raw === ".") return sum;
        const parsed = Number.parseFloat(raw);
        if (Number.isFinite(parsed) && parsed >= 0) return sum + parsed;
        return sum;
      }
      return sum + (drafts[id] ?? 0);
    }, 0),
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
