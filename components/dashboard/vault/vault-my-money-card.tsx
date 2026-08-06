"use client";

import {
  BucketEmojiIcon,
  bucketTheme,
} from "@/components/dashboard/vault/vault-visuals";
import { copyMatrix } from "@/constants/copyMatrix";
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
  vaultJarsGridViewportScrollClass,
  vaultManageJarsButtonClass,
} from "@/lib/dashboard/vault/vault-my-money-card-styles";
import { cn } from "@/lib/utils/cn";

const MAX_JARS_PER_ROW = 4;

type VaultMyMoneyCardProps = {
  buckets: VaultBucket[];
  totalSavings: number;
  expandedBucketId: VaultBucketId | null;
  onToggleBucket: (bucketId: VaultBucketId) => void;
  onManageJarsClick?: () => void;
};

export function VaultMyMoneyCard({
  buckets,
  totalSavings,
  expandedBucketId,
  onToggleBucket,
  onManageJarsClick,
}: VaultMyMoneyCardProps) {
  const copy = copyMatrix.dashboard.vault.budget;
  const { formatWholeMoney: formatMoney } = useCurrency();
  const totalBalance = sumVaultWealthBalance(buckets, totalSavings);
  const columnCount =
    buckets.length === 0 ? 1 : Math.min(MAX_JARS_PER_ROW, buckets.length);
  const wrapsToMultipleRows = buckets.length > MAX_JARS_PER_ROW;

  return (
    <section
      aria-label={copy.totalBalanceLabel}
      className="relative isolate w-full min-w-0 max-w-full overflow-hidden rounded-xl border-b-4 border-b-nga-secondary-shadow bg-nga-secondary p-4 text-white shadow-sm"
    >
      {onManageJarsClick ? (
        <button
          type="button"
          onClick={onManageJarsClick}
          aria-label={vaultCopy.manageBudgetJarsLabel}
          className={vaultManageJarsButtonClass}
        >
          <SettingsIcon className="size-5 shrink-0 text-white" />
        </button>
      ) : null}

      <div className="space-y-4">
        <div className="min-w-0 pr-11">
          <h2 className={vaultCardMainTitleClass}>{copy.totalBalanceLabel}</h2>
          <p className={vaultCardBalanceClass} aria-live="polite">
            {formatMoney(totalBalance)}
          </p>
        </div>

        <div
          className={cn(
            vaultJarsGridViewportClass,
            wrapsToMultipleRows && vaultJarsGridViewportScrollClass,
          )}
          aria-label={vaultCopy.budgetJarsSectionLabel}
          role="list"
        >
          <div
            className={vaultJarsGridTrackClass}
            style={{
              gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
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
                  className={cn(
                    vaultJarGridTileClass,
                    isActive
                      ? "bg-white/10"
                      : "border-transparent hover:bg-white/5",
                  )}
                  style={isActive ? { borderColor: theme.accent } : undefined}
                >
                  <BucketEmojiIcon
                    size="lg"
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
      </div>
    </section>
  );
}
