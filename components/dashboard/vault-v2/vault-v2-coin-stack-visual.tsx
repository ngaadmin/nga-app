"use client";

import { useMemo } from "react";
import {
  ALLOCATION_COIN_SIZE_PX,
  ALLOCATION_COIN_STACK_GAP_PX,
  allocationCoinStackPercent,
  allocationCoinTrackWidthForStacks,
  computeAllocationCoinStacks,
} from "@/lib/dashboard/vault-v2/allocation-coin-stacks";
import { cn } from "@/lib/utils/cn";

const COIN_OVERLAP_PX = 10;

function GoldCoin({ sizePx, stackIndex }: { sizePx: number; stackIndex: number }) {
  const fontSize = Math.max(8, Math.round(sizePx * 0.4));

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center rounded-full",
        "border-2 border-[#B87400] bg-gradient-to-br from-[#FFF1A8] via-[#FFC933] to-[#E08A00]",
        "shadow-[0_2px_0_#9A6200,inset_0_2px_4px_rgba(255,255,255,0.55)]",
      )}
      style={{
        width: sizePx,
        height: sizePx,
        zIndex: stackIndex,
      }}
      aria-hidden
    >
      <span
        className="font-heading font-extrabold leading-none text-[#9A6200]"
        style={{ fontSize }}
      >
        $
      </span>
    </span>
  );
}

function CoinStackColumn({
  height,
  coinSizePx,
}: {
  height: number;
  coinSizePx: number;
}) {
  const stackHeight =
    height <= 0 ? 0 : coinSizePx + (height - 1) * (coinSizePx - COIN_OVERLAP_PX);
  const columnWidthPx = coinSizePx + 2;

  return (
    <div
      className="relative shrink-0 overflow-visible"
      style={{ width: columnWidthPx, height: stackHeight }}
      aria-hidden
    >
      {Array.from({ length: height }, (_, coinIndex) => (
        <div
          key={coinIndex}
          className="absolute left-0"
          style={{ bottom: coinIndex * (coinSizePx - COIN_OVERLAP_PX) }}
        >
          <GoldCoin sizePx={coinSizePx} stackIndex={coinIndex} />
        </div>
      ))}
    </div>
  );
}

type VaultV2CoinStackVisualProps = {
  allocatedAmount: number;
  poolTotal: number;
  coinSizePx?: number;
  className?: string;
};

export function VaultV2CoinStackVisual({
  allocatedAmount,
  poolTotal,
  coinSizePx = ALLOCATION_COIN_SIZE_PX,
  className,
}: VaultV2CoinStackVisualProps) {
  const stackGapPx = ALLOCATION_COIN_STACK_GAP_PX;
  const stacks = useMemo(
    () => computeAllocationCoinStacks(allocatedAmount, poolTotal),
    [allocatedAmount, poolTotal],
  );
  const percent = allocationCoinStackPercent(allocatedAmount, poolTotal);
  const maxStackHeight = stacks.length > 0 ? Math.max(...stacks) : 0;
  const columnHeight =
    maxStackHeight <= 0
      ? coinSizePx
      : coinSizePx + (maxStackHeight - 1) * (coinSizePx - COIN_OVERLAP_PX);
  const contentWidthPx = allocationCoinTrackWidthForStacks(
    stacks.length,
    coinSizePx,
    stackGapPx,
  );
  const stackVisualHeightPx = columnHeight + 6;

  return (
    <div
      className={cn("inline-flex w-auto max-w-full items-end justify-start", className)}
      style={{ height: stacks.length > 0 ? stackVisualHeightPx : undefined }}
    >
      {stacks.length > 0 ? (
        <div
          className="inline-flex origin-bottom-left items-end justify-start"
          style={{
            width: contentWidthPx,
            height: columnHeight,
            transform:
              contentWidthPx > 0
                ? `scaleX(min(1, calc(100cqw / ${contentWidthPx}px)))`
                : undefined,
          }}
          role="img"
          aria-label={
            percent > 0
              ? `${percent} percent allocated as ${stacks.reduce((sum, height) => sum + height, 0)} gold coins`
              : "No coins allocated"
          }
        >
          <div
            className="flex items-end justify-start"
            style={{ gap: stackGapPx }}
          >
            {stacks.map((height, stackIndex) => (
              <CoinStackColumn
                key={`stack-${stackIndex}-${height}`}
                height={height}
                coinSizePx={coinSizePx}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
