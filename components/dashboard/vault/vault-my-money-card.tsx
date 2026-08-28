"use client";

import { copyMatrix } from "@/constants/copyMatrix";
import { type ReactNode } from "react";
import { useCurrency } from "@/lib/dashboard/currency-context";
import { SettingsIcon } from "@/lib/dashboard/icons";
import {
  savingsBucketDisplayBalance,
  sumVaultWealthBalance,
  type VaultBucket,
  type VaultBucketId,
} from "@/lib/dashboard/vault-buckets";
import { vaultBucketDisplayName } from "@/lib/dashboard/vault/bucket-display-name";
import { vaultCopy } from "@/lib/dashboard/vault/copy";
import {
  vaultCardBalanceClass,
  vaultJarsGridTrackClass,
  vaultJarsGridViewportClass,
  vaultManageJarsButtonClass,
  vaultOverviewSectionTitleClass,
} from "@/lib/dashboard/vault/vault-my-money-card-styles";
import {
  pickableCircleActiveClass,
  pickableCircleClass,
  pickableItemClass,
  pickableLabelActiveClass,
  pickableLabelClass,
  pickableLabelMutedClass,
  pickableMetaActiveClass,
  pickableMetaClass,
  pickableMetaMutedClass,
} from "@/components/ui/pickable-circle";
import { cn } from "@/lib/utils/cn";

const JARS_PER_ROW = 4;

type VaultMyMoneyCardProps = {
  buckets: VaultBucket[];
  totalSavings: number;
  expandedBucketId: VaultBucketId | null;
  onToggleBucket: (bucketId: VaultBucketId) => void;
  onManageJarsClick?: () => void;
  footer?: ReactNode;
};

export function VaultMyMoneyCard({
  buckets,
  totalSavings,
  expandedBucketId,
  onToggleBucket,
  onManageJarsClick,
  footer,
}: VaultMyMoneyCardProps) {
  const copy = copyMatrix.dashboard.vault.budget;
  const { formatWholeMoney: formatMoney } = useCurrency();
  const totalBalance = sumVaultWealthBalance(buckets, totalSavings);

  return (
    <section
      aria-label={copy.totalBalanceLabel}
      className="relative isolate w-full min-w-0 max-w-full bg-transparent px-0 py-0 text-[#031F82]"
    >
      <div className="flex min-w-0 items-center gap-2">
        <h2 className={cn(vaultOverviewSectionTitleClass, "min-w-0 shrink")}>
          {copy.totalBalanceLabel}
        </h2>
        <p
          className={cn(vaultCardBalanceClass, "ml-auto min-w-0 text-right")}
          aria-live="polite"
        >
          {formatMoney(totalBalance)}
        </p>
        {onManageJarsClick ? (
          <button
            type="button"
            onClick={onManageJarsClick}
            aria-label={vaultCopy.manageBudgetJarsLabel}
            className={vaultManageJarsButtonClass}
          >
            <SettingsIcon className="size-5 shrink-0 text-[#031F82]" />
          </button>
        ) : null}
      </div>

      <div
        className={cn(vaultJarsGridViewportClass, "mt-1.5")}
        aria-label={vaultCopy.budgetJarsSectionLabel}
      >
        <div
          className={vaultJarsGridTrackClass}
          style={{
            gridTemplateColumns: `repeat(${JARS_PER_ROW}, minmax(0, 1fr))`,
          }}
        >
          {buckets.map((bucket) => {
            const isActive = expandedBucketId === bucket.id;
            const shownBalance = savingsBucketDisplayBalance(
              bucket,
              totalSavings,
            );
            const isMuted = shownBalance === 0 && !isActive;

            return (
              <button
                key={bucket.id}
                type="button"
                onClick={() => onToggleBucket(bucket.id)}
                aria-expanded={isActive}
                aria-haspopup="dialog"
                aria-label={`Open ${vaultBucketDisplayName(bucket)} details`}
                className={cn(
                  pickableItemClass,
                  "w-full transition-transform active:scale-[0.98]",
                )}
              >
                <span
                  className={cn(pickableCircleClass, pickableCircleActiveClass)}
                  aria-hidden
                >
                  {bucket.emoji}
                </span>
                <p
                  className={cn(
                    pickableLabelClass,
                    isMuted ? pickableLabelMutedClass : pickableLabelActiveClass,
                  )}
                >
                  {vaultBucketDisplayName(bucket)}
                </p>
                <p
                  className={cn(
                    pickableMetaClass,
                    isMuted ? pickableMetaMutedClass : pickableMetaActiveClass,
                  )}
                >
                  {formatMoney(shownBalance)}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {footer ? <div className="mt-1.5 flex justify-start">{footer}</div> : null}
    </section>
  );
}
