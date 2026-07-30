"use client";

import { useMemo, useState } from "react";
import { VaultV2AllocationModal } from "@/components/dashboard/vault-v2/vault-v2-allocation-modal";
import { VaultV2BucketDrilldown } from "@/components/dashboard/vault-v2/vault-v2-bucket-drilldown";
import { VaultV2DepositSection } from "@/components/dashboard/vault-v2/vault-v2-deposit-section";
import { VaultV2ManageBudgetJarsModal } from "@/components/dashboard/vault-v2/vault-v2-manage-budget-jars-modal";
import { VaultV2MoreToolsView } from "@/components/dashboard/vault-v2/vault-v2-more-tools-view";
import { VaultV2MyMoneyCard } from "@/components/dashboard/vault-v2/vault-v2-my-money-card";
import { useVaultV2Actions } from "@/lib/dashboard/vault-v2/use-vault-v2-actions";
import { vaultV2Copy } from "@/lib/dashboard/vault-v2/copy";
import type { VaultBucketId } from "@/lib/dashboard/vault-buckets";
import type { VaultIncomeSourceId } from "@/lib/dashboard/vault-income-sources";
import { vaultV2BucketsWithDisplayNames } from "@/lib/dashboard/vault-v2/bucket-display-name";

export function VaultV2Dashboard() {
  const {
    isPremium,
    ledger,
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
  const [moreToolsOpen, setMoreToolsOpen] = useState(false);

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

  function openMoreTools() {
    setExpandedBucketId(null);
    setMoreToolsOpen(true);
  }

  function closeMoreTools() {
    setMoreToolsOpen(false);
  }

  if (moreToolsOpen) {
    return (
      <VaultV2MoreToolsView
        totalSavings={totalSavings}
        isPremium={isPremium}
        ledger={ledger}
        onBack={closeMoreTools}
      />
    );
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

      <div className="flex justify-center pt-1">
        <button
          type="button"
          onClick={openMoreTools}
          className="font-heading text-sm font-bold text-[#1E3A5F]/55 transition-colors hover:text-[#0CC1E0]"
        >
          {vaultV2Copy.moreToolsLink}
        </button>
      </div>

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
