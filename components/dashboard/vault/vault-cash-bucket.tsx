"use client";

import { useCurrency } from "@/lib/dashboard/currency-context";
import { vaultCopy } from "@/lib/dashboard/vault/copy";
import { vaultOverviewSectionTitleClass } from "@/lib/dashboard/vault/vault-my-money-card-styles";
import { cn } from "@/lib/utils/cn";

type VaultCashBucketProps = {
  amount: number;
  onAssign: () => void;
};

/** Unassigned cash from XP. Hidden until a cash-in adds cents. */
export function VaultCashBucket({ amount, onAssign }: VaultCashBucketProps) {
  const { formatMoney } = useCurrency();
  if (amount <= 0) return null;

  return (
    <section aria-label={vaultCopy.cashBucketTitle} className="mt-4">
      <div className="flex items-center gap-2">
        <h2 className={cn(vaultOverviewSectionTitleClass, "min-w-0 flex-1")}>
          {vaultCopy.cashBucketTitle}
        </h2>
        <p className="font-heading text-lg font-extrabold tabular-nums text-[#031F82]">
          {formatMoney(amount)}
        </p>
      </div>
      <p className="mt-1 font-sans text-sm leading-snug text-[#1E3A5F]">
        {vaultCopy.cashBucketBody}
      </p>
      <button
        type="button"
        onClick={onAssign}
        className="mt-3 h-touch w-full rounded-nga-lg border-b-4 border-[#C88202] bg-[#FFA503] px-4 font-heading text-sm font-bold uppercase tracking-wide text-[#031F82] shadow-md transition-all hover:brightness-[1.02] active:translate-y-[2px] active:border-b-2"
      >
        {vaultCopy.cashBucketAssign}
      </button>
    </section>
  );
}
