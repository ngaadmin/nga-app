/** 1 coin = 1% of the pool; stacks hold up to 10 coins each. */
export function computeAllocationCoinStacks(
  allocatedAmount: number,
  poolTotal: number,
): number[] {
  if (poolTotal <= 0 || allocatedAmount <= 0) return [];

  const coinCount = Math.min(100, Math.round((allocatedAmount / poolTotal) * 100));
  const stacks: number[] = [];
  let remaining = coinCount;

  while (remaining > 0) {
    stacks.push(Math.min(10, remaining));
    remaining -= stacks[stacks.length - 1]!;
  }

  return stacks;
}

export function allocationCoinStackPercent(
  allocatedAmount: number,
  poolTotal: number,
): number {
  if (poolTotal <= 0 || allocatedAmount <= 0) return 0;
  return Math.min(100, Math.round((allocatedAmount / poolTotal) * 100));
}
