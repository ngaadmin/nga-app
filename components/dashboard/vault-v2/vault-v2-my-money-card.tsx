"use client";

import {
  BucketEmojiIcon,
  bucketTheme,
} from "@/components/dashboard/vault/vault-visuals";
import { copyMatrix } from "@/constants/copyMatrix";
import { useCurrency } from "@/lib/dashboard/currency-context";
import {
  savingsBucketDisplayBalance,
  sumVaultWealthBalance,
  type VaultBucket,
  type VaultBucketId,
} from "@/lib/dashboard/vault-buckets";
import { vaultV2BucketDisplayName } from "@/lib/dashboard/vault-v2/bucket-display-name";
import { cn } from "@/lib/utils/cn";

type VaultV2MyMoneyCardProps = {
  buckets: VaultBucket[];
  totalSavings: number;
  expandedBucketId: VaultBucketId | null;
  onToggleBucket: (bucketId: VaultBucketId) => void;
};

export function VaultV2MyMoneyCard({
  buckets,
  totalSavings,
  expandedBucketId,
  onToggleBucket,
}: VaultV2MyMoneyCardProps) {
  const copy = copyMatrix.dashboard.vault.budget;
  const { formatMoney } = useCurrency();
  const totalBalance = sumVaultWealthBalance(buckets, totalSavings);

  return (
    <section
      aria-label={copy.totalBalanceLabel}
      className="w-full min-w-0 rounded-xl border border-white/10 bg-gradient-to-br from-[#3D5F8C] to-[#2E4A72] p-3 text-white shadow-sm"
    >
      <div className="space-y-3">
        <div>
          <p className="font-heading text-[10px] font-bold uppercase tracking-wide text-white/65">
            {copy.totalBalanceLabel}
          </p>
          <p className="mt-1 font-heading text-xl font-extrabold leading-none tabular-nums">
            {formatMoney(totalBalance)}
          </p>
        </div>

        <div
          className={cn(
            "grid gap-2",
            buckets.length <= 3 ? "grid-cols-3" : "grid-cols-3 sm:grid-cols-4",
          )}
        >
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
                  "flex min-w-0 flex-col items-center rounded-xl border-2 px-1 py-2 transition-colors",
                  isActive ? "bg-white/10" : "border-transparent hover:bg-white/5",
                )}
                style={isActive ? { borderColor: theme.accent } : undefined}
              >
                <BucketEmojiIcon size="lg" emoji={bucket.emoji} theme={theme} />
                <p className="mt-1.5 line-clamp-2 font-heading text-xs font-bold leading-tight text-white/90">
                  {vaultV2BucketDisplayName(bucket)}
                </p>
                <p className="font-heading text-sm font-extrabold tabular-nums text-white">
                  {formatMoney(shownBalance)}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
