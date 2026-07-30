"use client";

import { useMemo, useState } from "react";
import { VaultV2AllocationModal } from "@/components/dashboard/vault-v2/vault-v2-allocation-modal";
import { VaultV2BucketDrilldown } from "@/components/dashboard/vault-v2/vault-v2-bucket-drilldown";
import { VaultV2DepositSection } from "@/components/dashboard/vault-v2/vault-v2-deposit-section";
import { VaultV2ManageBudgetJarsModal } from "@/components/dashboard/vault-v2/vault-v2-manage-budget-jars-modal";
import { VaultV2MyMoneyCard } from "@/components/dashboard/vault-v2/vault-v2-my-money-card";
import { useVaultV2Actions } from "@/lib/dashboard/vault-v2/use-vault-v2-actions";
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
    handleAssignGoals,
    handleRenameBucket,
    handleAddCustomBucket,
    handleDeleteCustomBucket,
  } = useVaultV2Actions();

  const [expandedBucketId, setExpandedBucketId] = useState<VaultBucketId | null>(null);
  const [allocationModalOpen, setAllocationModalOpen] = useState(false);
  const [manageJarsModalOpen, setManageJarsModalOpen] = useState(false);

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
      <VaultV2MyMoneyCard
        buckets={displayBuckets}
        totalSavings={totalSavings}
        expandedBucketId={expandedBucketId}
        onToggleBucket={toggleBucket}
        onManageJarsClick={() => setManageJarsModalOpen(true)}
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
          onAssignGoals={handleAssignGoals}
          onClose={() => setExpandedBucketId(null)}
        />
      ) : null}

      {!expandedBucket ? (
        <VaultV2DepositSection onDeposit={handleDepositAndOpenAllocation} />
      ) : null}

      <VaultV2AllocationModal
        isOpen={allocationModalOpen}
        onClose={() => setAllocationModalOpen(false)}
        buckets={displayBuckets}
        totalSavings={totalSavings}
        moneyToAllocate={moneyToAllocate}
        onLockIn={handleLockIn}
      />

      <VaultV2ManageBudgetJarsModal
        isOpen={manageJarsModalOpen}
        onClose={() => setManageJarsModalOpen(false)}
        buckets={vaultBuckets}
        isPremium={isPremium}
        onRenameBucket={handleRenameBucket}
        onAddCustomBucket={handleAddCustomBucket}
        onDeleteCustomBucket={handleDeleteCustomBucket}
        onBucketDeleted={(bucketId) => {
          if (expandedBucketId === bucketId) {
            setExpandedBucketId(null);
          }
        }}
      />
    </div>
  );
}
