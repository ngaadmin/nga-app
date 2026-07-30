"use client";

import {
  BucketEmojiIcon,
  bucketTheme,
} from "@/components/dashboard/vault-v2/vault-v2-visuals";
import { copyMatrix } from "@/constants/copyMatrix";
import { useCurrency } from "@/lib/dashboard/currency-context";
import { SettingsIcon } from "@/lib/dashboard/icons";
import {
  savingsBucketDisplayBalance,
  sumVaultWealthBalance,
  type VaultBucket,
  type VaultBucketId,
} from "@/lib/dashboard/vault-buckets";
import { vaultV2BucketDisplayName } from "@/lib/dashboard/vault-v2/bucket-display-name";
import { vaultV2Copy } from "@/lib/dashboard/vault-v2/copy";
import {
  vaultV2CardBalanceClass,
  vaultV2CardMainTitleClass,
  vaultV2JarCarouselTileClass,
  vaultV2JarTileBalanceClass,
  vaultV2JarTileNameClass,
  vaultV2JarsCarouselTrackClass,
  vaultV2JarsCarouselViewportClass,
  vaultV2ManageJarsButtonClass,
} from "@/lib/dashboard/vault-v2/vault-v2-my-money-card-styles";
import { cn } from "@/lib/utils/cn";

type VaultV2MyMoneyCardProps = {
  buckets: VaultBucket[];
  totalSavings: number;
  expandedBucketId: VaultBucketId | null;
  onToggleBucket: (bucketId: VaultBucketId) => void;
  onManageJarsClick?: () => void;
};

export function VaultV2MyMoneyCard({
  buckets,
  totalSavings,
  expandedBucketId,
  onToggleBucket,
  onManageJarsClick,
}: VaultV2MyMoneyCardProps) {
  const copy = copyMatrix.dashboard.vault.budget;
  const { formatMoney } = useCurrency();
  const totalBalance = sumVaultWealthBalance(buckets, totalSavings);

  return (
    <section
      aria-label={copy.totalBalanceLabel}
      className="relative isolate w-full min-w-0 max-w-full overflow-hidden rounded-xl border-b-4 border-b-nga-secondary-shadow bg-nga-secondary p-4 text-white shadow-sm"
    >
      {onManageJarsClick ? (
        <button
          type="button"
          onClick={onManageJarsClick}
          aria-label={vaultV2Copy.manageBudgetJarsLabel}
          className={vaultV2ManageJarsButtonClass}
        >
          <SettingsIcon className="size-5 shrink-0 text-white" />
        </button>
      ) : null}

      <div className="space-y-4">
        <div className="min-w-0 pr-11">
          <h2 className={vaultV2CardMainTitleClass}>{copy.totalBalanceLabel}</h2>
          <p className={vaultV2CardBalanceClass} aria-live="polite">
            {formatMoney(totalBalance)}
          </p>
        </div>

        <div
          className={vaultV2JarsCarouselViewportClass}
          aria-label={vaultV2Copy.budgetJarsSectionLabel}
          role="list"
        >
          <div className={vaultV2JarsCarouselTrackClass}>
            {buckets.map((bucket) => {
              const theme = bucketTheme(bucket);
              const isActive = expandedBucketId === bucket.id;
              const shownBalance = savingsBucketDisplayBalance(bucket, totalSavings);

              return (
                <button
                  key={bucket.id}
                  type="button"
                  role="listitem"
                  onClick={() => onToggleBucket(bucket.id)}
                  aria-expanded={isActive}
                  className={cn(
                    vaultV2JarCarouselTileClass,
                    isActive ? "bg-white/10" : "border-transparent hover:bg-white/5",
                  )}
                  style={isActive ? { borderColor: theme.accent } : undefined}
                >
                  <BucketEmojiIcon size="lg" emoji={bucket.emoji} theme={theme} />
                  <p className={vaultV2JarTileNameClass}>
                    {vaultV2BucketDisplayName(bucket)}
                  </p>
                  <p className={vaultV2JarTileBalanceClass}>{formatMoney(shownBalance)}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
