"use client";

import { useMemo } from "react";
import {
  allocationCoinStackPercent,
  computeAllocationCoinStacks,
} from "@/lib/dashboard/vault-v2/allocation-coin-stacks";

const COIN_SIZE_PX = 12;
const COIN_OVERLAP_PX = 3;

function GoldCoin({ sizePx }: { sizePx: number }) {
  const fontSize = Math.max(7, Math.round(sizePx * 0.42));

  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center rounded-full border border-[#B87400] bg-gradient-to-br from-[#FFF1A8] via-[#FFC933] to-[#E08A00] shadow-[0_1px_0_#9A6200,inset_0_1px_3px_rgba(255,255,255,0.55)]"
      style={{ width: sizePx, height: sizePx }}
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

  return (
    <div
      className={className}
      role="img"
      aria-label={
        percent > 0
          ? `${percent} percent allocated as ${stacks.reduce((sum, height) => sum + height, 0)} gold coins`
          : "No coins allocated"
      }
    >
      {stacks.length > 0 ? (
        <div className="flex items-end justify-end gap-0.5">
          {stacks.map((height, stackIndex) => (
            <div
              key={`stack-${stackIndex}-${height}`}
              className="flex flex-col-reverse items-center"
            >
              {Array.from({ length: height }, (_, coinIndex) => (
                <div
                  key={coinIndex}
                  style={{ marginTop: coinIndex > 0 ? -COIN_OVERLAP_PX : 0 }}
                >
                  <GoldCoin sizePx={COIN_SIZE_PX} />
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
