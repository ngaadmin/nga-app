"use client";

import { useMemo, useState } from "react";
import { VaultV2AllocationModal } from "@/components/dashboard/vault-v2/vault-v2-allocation-modal";
import { VaultV2BucketDrilldown } from "@/components/dashboard/vault-v2/vault-v2-bucket-drilldown";
import { VaultV2DepositSection } from "@/components/dashboard/vault-v2/vault-v2-deposit-section";
import { VaultV2MyMoneyCard } from "@/components/dashboard/vault-v2/vault-v2-my-money-card";
import { useVaultV2Actions } from "@/lib/dashboard/vault-v2/use-vault-v2-actions";
import { vaultV2Copy } from "@/lib/dashboard/vault-v2/copy";
import type { VaultBucketId } from "@/lib/dashboard/vault-buckets";
import type { VaultIncomeSourceId } from "@/lib/dashboard/vault-income-sources";
import { vaultV2BucketsWithDisplayNames } from "@/lib/dashboard/vault-v2/bucket-display-name";

export function VaultV2Dashboard() {
  const {
    isPremium,
    moneyToAllocate,
    vaultBuckets,
    vaultGoals,
    totalSavings,
    spendingCategories,
    handleDeposit,
    handleLockIn,
    handleVaultTransfer,
    handleMarkSpent,
    handleAddCustomSpendingCategory,
    handleRenameSpendingCategory,
  } = useVaultV2Actions();

  const [expandedBucketId, setExpandedBucketId] = useState<VaultBucketId | null>(null);
  const [allocationModalOpen, setAllocationModalOpen] = useState(false);

  const displayBuckets = useMemo(
    () => vaultV2BucketsWithDisplayNames(vaultBuckets),
    [vaultBuckets],
  );

  const expandedBucket = useMemo(
    () => displayBuckets.find((bucket) => bucket.id === expandedBucketId) ?? null,
    [displayBuckets, expandedBucketId],
  );

  function toggleBucket(bucketId: VaultBucketId) {
    setExpandedBucketId((current) => (current === bucketId ? null : bucketId));
  }

  function handleDepositAndOpenAllocation(amount: number, source: VaultIncomeSourceId) {
    handleDeposit(amount, source);
    setAllocationModalOpen(true);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="space-y-1 text-center">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <h1 className="font-heading text-lg font-extrabold text-[#031F82]">
            {vaultV2Copy.dashboardHeading}
          </h1>
          <span className="rounded-full bg-[#FFA503]/20 px-2.5 py-0.5 font-heading text-[10px] font-bold uppercase tracking-wide text-[#C88202]">
            {vaultV2Copy.betaBadge}
          </span>
        </div>
        <p className="font-sans text-sm leading-snug text-[#1E3A5F]/80">
          {vaultV2Copy.dashboardBody}
        </p>
      </div>

      <VaultV2MyMoneyCard
        buckets={displayBuckets}
        totalSavings={totalSavings}
        expandedBucketId={expandedBucketId}
        onToggleBucket={toggleBucket}
      />

      {expandedBucket ? (
        <VaultV2BucketDrilldown
          bucket={expandedBucket}
          buckets={displayBuckets}
          goals={vaultGoals}
          totalSavings={totalSavings}
          isPremium={isPremium}
          spendingCategories={spendingCategories}
          onVaultTransfer={handleVaultTransfer}
          onMarkSpent={handleMarkSpent}
          onAddCustomCategory={handleAddCustomSpendingCategory}
          onRenameCategory={handleRenameSpendingCategory}
          onClose={() => setExpandedBucketId(null)}
        />
      ) : null}

      <VaultV2DepositSection onDeposit={handleDepositAndOpenAllocation} />

      <VaultV2AllocationModal
        isOpen={allocationModalOpen}
        onClose={() => setAllocationModalOpen(false)}
        buckets={displayBuckets}
        moneyToAllocate={moneyToAllocate}
        onLockIn={handleLockIn}
      />
    </div>
  );
}
