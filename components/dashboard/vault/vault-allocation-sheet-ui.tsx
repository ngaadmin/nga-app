"use client";

import {
  ALLOCATION_SHEET_COIN_SIZE_PX,
  allocationSheetCoinRow,
} from "@/lib/dashboard/vault/allocation-coin-stacks";

export const allocationSheetOrangeCtaClass =
  "rounded-nga-lg border-b-4 border-[#C88202] bg-[#FFA503] font-heading text-sm font-bold uppercase tracking-wide text-[#031F82] transition-all hover:brightness-[1.02] active:translate-y-[2px] active:border-b-2 disabled:cursor-not-allowed disabled:opacity-40";

export const allocationSheetRowClass =
  "flex w-full min-w-0 items-center gap-x-1.5 overflow-visible py-1.5";

export const allocationSheetFillTrackClass =
  "pointer-events-none relative h-1.5 min-w-[3.5rem] flex-1 overflow-hidden rounded-sm bg-[#BDE9FB]/70";

export const allocationSheetFillBarClass =
  "absolute inset-y-0 left-0 bg-[#FFA503] transition-[width] duration-150";

export const allocationSheetAmountInputClass =
  "flex h-8 w-[4.75rem] shrink-0 items-center gap-0.5 rounded-lg border border-[#BDE9FB] bg-white px-1.5";

export function AllocationSheetCoins({
  allocatedAmount,
  poolTotal,
}: {
  allocatedAmount: number;
  poolTotal: number;
}) {
  const { fullCoins, remainderPercent } = allocationSheetCoinRow(
    allocatedAmount,
    poolTotal,
  );
  if (fullCoins <= 0 && remainderPercent <= 0) return null;

  return (
    <div className="flex shrink-0 items-center gap-0.5" aria-hidden>
      {Array.from({ length: fullCoins }, (_, index) => (
        <span
          key={index}
          className="inline-block rounded-full border border-[#B87400] bg-gradient-to-br from-[#FFF1A8] via-[#FFC933] to-[#E08A00]"
          style={{
            width: ALLOCATION_SHEET_COIN_SIZE_PX,
            height: ALLOCATION_SHEET_COIN_SIZE_PX,
          }}
        />
      ))}
      {remainderPercent > 0 ? (
        <span
          className="inline-block rounded-full border border-[#B87400] bg-gradient-to-br from-[#FFF1A8] via-[#FFC933] to-[#E08A00]"
          style={{
            width: ALLOCATION_SHEET_COIN_SIZE_PX,
            height: ALLOCATION_SHEET_COIN_SIZE_PX,
            opacity: Math.max(0.35, remainderPercent / 10),
          }}
        />
      ) : null}
    </div>
  );
}
