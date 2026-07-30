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
      className="relative w-full min-w-0 overflow-visible rounded-xl border border-white/10 bg-gradient-to-br from-[#3D5F8C] to-[#2E4A72] p-4 text-white shadow-sm"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3">
          <div className="min-w-0">
            <h2 className={vaultV2CardMainTitleClass}>{copy.totalBalanceLabel}</h2>
            <p className={vaultV2CardBalanceClass} aria-live="polite">
              {formatMoney(totalBalance)}
            </p>
          </div>

          {onManageJarsClick ? (
            <button
              type="button"
              onClick={onManageJarsClick}
              aria-label={vaultV2Copy.manageBudgetJarsLabel}
              className="z-10 flex size-9 shrink-0 items-center justify-center self-start rounded-lg text-white transition-colors hover:bg-white/10 hover:text-white active:bg-white/15"
            >
              <SettingsIcon className="size-5 shrink-0 text-white" aria-hidden />
            </button>
          ) : null}
        </div>

        <div
          className={cn(
            vaultV2JarsCarouselViewportClass,
            "touch-pan-x [-webkit-overflow-scrolling:touch]",
          )}
          aria-label={vaultV2Copy.budgetJarsSectionLabel}
        >
          <div className={cn(vaultV2JarsCarouselTrackClass, "flex-row flex-nowrap")}>
            {buckets.map((bucket) => {
              const theme = bucketTheme(bucket);
              const isActive = expandedBucketId === bucket.id;
              const shownBalance = savingsBucketDisplayBalance(bucket, totalSavings);

              return (
                <button
                  key={bucket.id}
                  type="button"
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
