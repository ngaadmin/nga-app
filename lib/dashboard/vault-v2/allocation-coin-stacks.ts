/** 1 coin = 1% of the pool; stacks hold up to 10 coins each. */
export const ALLOCATION_COIN_SIZE_PX = 16;
export const ALLOCATION_COIN_COLUMN_WIDTH_PX = ALLOCATION_COIN_SIZE_PX + 2;
export const ALLOCATION_COIN_STACK_GAP_PX = 4;
/** 100% allocation = 100 coins = 10 columns of 10. */
export const ALLOCATION_COIN_MAX_STACK_COLUMNS = 10;

export function allocationCoinTrackWidthForStacks(
  stackColumnCount: number,
  coinSizePx: number = ALLOCATION_COIN_SIZE_PX,
  gapPx: number = ALLOCATION_COIN_STACK_GAP_PX,
): number {
  if (stackColumnCount <= 0) return 0;
  const columnWidthPx = coinSizePx + 2;
  return stackColumnCount * columnWidthPx + (stackColumnCount - 1) * gapPx;
}

export function allocationCoinMaxTrackWidthPx(
  coinSizePx: number = ALLOCATION_COIN_SIZE_PX,
  gapPx: number = ALLOCATION_COIN_STACK_GAP_PX,
): number {
  const columns = ALLOCATION_COIN_MAX_STACK_COLUMNS;
  const columnWidthPx = coinSizePx + 2;
  return columns * columnWidthPx + (columns - 1) * gapPx;
}

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
