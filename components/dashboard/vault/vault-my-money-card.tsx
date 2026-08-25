"use client";

import {
  BucketEmojiIcon,
  bucketTheme,
} from "@/components/dashboard/vault/vault-visuals";
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
  vaultCardMainTitleClass,
  vaultJarGridTileClass,
  vaultJarTileBalanceClass,
  vaultJarTileNameClass,
  vaultJarsGridTrackClass,
  vaultJarsGridViewportClass,
  vaultManageJarsButtonClass,
} from "@/lib/dashboard/vault/vault-my-money-card-styles";
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
      className="relative isolate w-full min-w-0 max-w-full rounded-xl border border-[#031F82]/15 bg-[#FAFDFF] px-3 py-2 text-[#031F82]"
    >
      <div className="flex min-w-0 items-center gap-2">
        <h2 className={cn(vaultCardMainTitleClass, "min-w-0 shrink")}>
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
        role="list"
      >
        <div
          className={vaultJarsGridTrackClass}
          style={{
            gridTemplateColumns: `repeat(${JARS_PER_ROW}, minmax(0, 1fr))`,
          }}
        >
          {buckets.map((bucket) => {
            const theme = bucketTheme(bucket);
            const isActive = expandedBucketId === bucket.id;
            const shownBalance = savingsBucketDisplayBalance(
              bucket,
              totalSavings,
            );

            return (
              <button
                key={bucket.id}
                type="button"
                role="listitem"
                onClick={() => onToggleBucket(bucket.id)}
                aria-expanded={isActive}
                aria-label={
                  isActive
                    ? `Close ${vaultBucketDisplayName(bucket)} details`
                    : `Open ${vaultBucketDisplayName(bucket)} details`
                }
                className={cn(
                  vaultJarGridTileClass,
                  isActive
                    ? "bg-white"
                    : "border-transparent hover:bg-white/80",
                )}
                style={isActive ? { borderColor: theme.accent } : undefined}
              >
                <BucketEmojiIcon
                  size="sm"
                  emoji={bucket.emoji}
                  theme={theme}
                />
                <p className={vaultJarTileNameClass}>
                  {vaultBucketDisplayName(bucket)}
                </p>
                <p className={vaultJarTileBalanceClass}>
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
