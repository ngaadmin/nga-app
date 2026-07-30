"use client";

import { useMemo } from "react";
import {
  allocationCoinStackPercent,
  computeAllocationCoinStacks,
} from "@/lib/dashboard/vault-v2/allocation-coin-stacks";
import { cn } from "@/lib/utils/cn";

const COIN_SIZE_PX = 16;
/** Tight poker-chip overlap — each coin sits ~10px above the previous. */
const COIN_OVERLAP_PX = 10;
const STACK_COLUMN_GAP_PX = 4;

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

function CoinStackColumn({ height }: { height: number }) {
  const stackHeight =
    height <= 0 ? 0 : COIN_SIZE_PX + (height - 1) * (COIN_SIZE_PX - COIN_OVERLAP_PX);

  return (
    <div
      className="relative shrink-0"
      style={{ width: COIN_SIZE_PX + 2, height: stackHeight }}
      aria-hidden
    >
      {Array.from({ length: height }, (_, coinIndex) => (
        <div
          key={coinIndex}
          className="absolute left-0"
          style={{ bottom: coinIndex * (COIN_SIZE_PX - COIN_OVERLAP_PX) }}
        >
          <GoldCoin sizePx={COIN_SIZE_PX} stackIndex={coinIndex} />
        </div>
      ))}
    </div>
  );
}

type VaultV2CoinStackVisualProps = {
  allocatedAmount: number;
  poolTotal: number;
  className?: string;
};

export function VaultV2CoinStackVisual({
  allocatedAmount,
  poolTotal,
  className,
}: VaultV2CoinStackVisualProps) {
  const stacks = useMemo(
    () => computeAllocationCoinStacks(allocatedAmount, poolTotal),
    [allocatedAmount, poolTotal],
  );
  const percent = allocationCoinStackPercent(allocatedAmount, poolTotal);
  const maxStackHeight = stacks.length > 0 ? Math.max(...stacks) : 0;
  const columnHeight =
    maxStackHeight <= 0
      ? COIN_SIZE_PX
      : COIN_SIZE_PX + (maxStackHeight - 1) * (COIN_SIZE_PX - COIN_OVERLAP_PX);

  return (
    <div
      className={className}
      style={{ minHeight: columnHeight }}
      role="img"
      aria-label={
        percent > 0
          ? `${percent} percent allocated as ${stacks.reduce((sum, height) => sum + height, 0)} gold coins`
          : "No coins allocated"
      }
    >
      {stacks.length > 0 ? (
        <div
          className="flex items-end justify-end"
          style={{ gap: STACK_COLUMN_GAP_PX }}
        >
          {stacks.map((height, stackIndex) => (
            <CoinStackColumn key={`stack-${stackIndex}-${height}`} height={height} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
