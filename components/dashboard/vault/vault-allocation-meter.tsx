"use client";

import { cn } from "@/lib/utils/cn";

/** Half-width of the 28px slider thumb — keeps thumb inside the track bounds. */
const VAULT_ALLOCATION_METER_THUMB_INSET_PX = 14;

type VaultAllocationMeterProps = {
  value: number;
  /** Total pool — fixed track scale for every bucket row. */
  poolTotal: number;
  accentColor: string;
  trackClassName?: string;
  ariaLabel: string;
  className?: string;
};

/** Read-only allocation bar showing how much of the pool is assigned to one bucket. */
export function VaultAllocationMeter({
  value,
  poolTotal,
  accentColor,
  trackClassName = "bg-[#BDE9FB]/45",
  ariaLabel,
  className,
}: VaultAllocationMeterProps) {
  const fillPercent =
    poolTotal > 0 ? Math.min(100, (value / poolTotal) * 100) : 0;
  const thumbLeft = `calc(${VAULT_ALLOCATION_METER_THUMB_INSET_PX}px + (100% - ${VAULT_ALLOCATION_METER_THUMB_INSET_PX * 2}px) * ${fillPercent / 100})`;

  return (
    <div className={cn("w-full min-w-0", className)}>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={poolTotal}
        aria-valuenow={value}
        aria-label={ariaLabel}
        className="relative flex min-h-8 w-full min-w-0 items-center px-3.5 py-1"
      >
        <div className="relative h-4 w-full">
          <div
            className={cn("h-4 w-full overflow-hidden rounded-full", trackClassName)}
            aria-hidden
          >
            <div
              className="h-full rounded-full transition-[width] duration-150 ease-out"
              style={{ width: `${fillPercent}%`, backgroundColor: accentColor }}
            />
          </div>
          <div
            className="pointer-events-none absolute top-1/2 size-7 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white shadow-[0_2px_6px_rgba(3,31,130,0.28)] transition-[left] duration-150 ease-out"
            style={{
              left: thumbLeft,
              backgroundColor: accentColor,
            }}
            aria-hidden
          />
        </div>
      </div>
    </div>
  );
}
