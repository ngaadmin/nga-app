"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CashInPointsPanel } from "@/components/dashboard/points/cash-in-points-panel";
import { VaultAllocationModal } from "@/components/dashboard/vault/vault-allocation-modal";
import { VaultBucketDrilldown } from "@/components/dashboard/vault/vault-bucket-drilldown";
import { VaultDepositSection } from "@/components/dashboard/vault/vault-deposit-section";
import { VaultManageBudgetJarsModal } from "@/components/dashboard/vault/vault-manage-budget-jars-modal";
import { VaultManageSavingsGoalsModal } from "@/components/dashboard/vault/vault-manage-savings-goals-modal";
import { VaultMyMoneyCard } from "@/components/dashboard/vault/vault-my-money-card";
import { PremiumUpgradeModal } from "@/components/dashboard/premium-upgrade-modal";
import { ModalShell } from "@/components/ui/modal-shell";
import { copyMatrix } from "@/constants/copyMatrix";
import { advancedMoneyToolsCopy } from "@/lib/dashboard/advanced-money-tools/copy";
import { useCurrency } from "@/lib/dashboard/currency-context";
import { ADVANCED_MONEY_TOOLS_HREF } from "@/lib/dashboard/advanced-money-tools/nav";
import { LockIcon } from "@/lib/dashboard/icons";
import { useVaultActions } from "@/lib/dashboard/vault/use-vault-actions";
import { useTestingPremiumUnlocked } from "@/lib/dashboard/testing-premium";
import type { VaultBucketId } from "@/lib/dashboard/vault-buckets";
import type { VaultIncomeSourceId } from "@/lib/dashboard/vault-income-sources";
import { vaultBucketsWithDisplayNames } from "@/lib/dashboard/vault/bucket-display-name";
import { vaultHomeCompactCtaClass } from "@/lib/dashboard/vault/vault-action-form-styles";

export function VaultDashboard() {
  const vaultCopy = copyMatrix.dashboard.vault;
  const budgetCopy = vaultCopy.budget;
  const searchParams = useSearchParams();
  const router = useRouter();
  const { formatWholeMoney: formatMoney } = useCurrency();
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
    handleUpdateGoalDetails,
    handleAddGoal,
    handleDeleteGoal,
    handleResetGoalBalance,
    handleResetAllSavingsGoalBalances,
    handleResetBucketBalance,
  } = useVaultActions();
  const advancedMoneyUnlocked = useTestingPremiumUnlocked();

  const [expandedBucketId, setExpandedBucketId] = useState<VaultBucketId | null>(null);
  const [allocationModalOpen, setAllocationModalOpen] = useState(false);
  const [manageJarsModalOpen, setManageJarsModalOpen] = useState(false);
  const [manageGoalsModalOpen, setManageGoalsModalOpen] = useState(false);
  const [cashInOpen, setCashInOpen] = useState(
    () => searchParams.get("cashIn") === "1",
  );
  const [advancedMoneyUpgradeOpen, setAdvancedMoneyUpgradeOpen] =
    useState(false);

  useEffect(() => {
    if (searchParams.get("cashIn") === "1") {
      setCashInOpen(true);
    }
  }, [searchParams]);

  const displayBuckets = useMemo(
    () => vaultBucketsWithDisplayNames(vaultBuckets),
    [vaultBuckets],
  );

  const expandedBucket = useMemo(
    () => displayBuckets.find((bucket) => bucket.id === expandedBucketId) ?? null,
    [displayBuckets, expandedBucketId],
  );

  const hideDepositSection =
    expandedBucket !== null || manageGoalsModalOpen;

  function toggleBucket(bucketId: VaultBucketId) {
    setExpandedBucketId((current) => (current === bucketId ? null : bucketId));
  }

  function handleDepositAndOpenAllocation(amount: number, source: VaultIncomeSourceId) {
    handleDeposit(amount, source);
    setAllocationModalOpen(true);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <VaultMyMoneyCard
        buckets={displayBuckets}
        totalSavings={totalSavings}
        expandedBucketId={expandedBucketId}
        onToggleBucket={toggleBucket}
        onManageJarsClick={() => setManageJarsModalOpen(true)}
      />

      {moneyToAllocate > 0 && !allocationModalOpen ? (
        <div className="flex items-center gap-2">
          <p className="min-w-0 flex-1 font-heading text-base font-extrabold tabular-nums text-[#031F82]">
            {formatMoney(moneyToAllocate)} {budgetCopy.toAllocateActionLabel}
          </p>
          <button
            type="button"
            onClick={() => setAllocationModalOpen(true)}
            aria-label={budgetCopy.toAllocateAriaLabel.replace(
              "{amount}",
              formatMoney(moneyToAllocate),
            )}
            className={vaultHomeCompactCtaClass}
          >
            {budgetCopy.allocatePoolCta}
          </button>
        </div>
      ) : null}

      {expandedBucket ? (
        <VaultBucketDrilldown
          bucket={expandedBucket}
          buckets={displayBuckets}
          goals={vaultGoals}
          totalSavings={totalSavings}
          isPremium={isPremium || advancedMoneyUnlocked}
          spendingCategories={spendingCategories}
          onVaultTransfer={handleVaultTransfer}
          onMarkSpent={handleMarkSpent}
          onAddCustomCategory={handleAddCustomSpendingCategory}
          onRenameCategory={handleRenameSpendingCategory}
          onAssignGoals={handleAssignGoals}
          onUpdateGoalDetails={handleUpdateGoalDetails}
          onResetGoalBalance={handleResetGoalBalance}
          onResetAllGoalBalances={handleResetAllSavingsGoalBalances}
          onResetBucketBalance={handleResetBucketBalance}
          onManageGoalsClick={() => setManageGoalsModalOpen(true)}
          onClose={() => setExpandedBucketId(null)}
        />
      ) : null}

      {!hideDepositSection ? (
        <VaultDepositSection onDeposit={handleDepositAndOpenAllocation} />
      ) : null}

      {!hideDepositSection ? (
        <button
          type="button"
          onClick={() => {
            if (advancedMoneyUnlocked) {
              router.push(ADVANCED_MONEY_TOOLS_HREF);
              return;
            }
            setAdvancedMoneyUpgradeOpen(true);
          }}
          aria-label={advancedMoneyToolsCopy.vaultEntryAriaLabel}
          className="flex w-full items-center gap-3 rounded-2xl bg-white px-4 py-3 text-left shadow-md transition-transform active:scale-[0.99]"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#BDE9FB]/40 text-[#031F82]">
            {advancedMoneyUnlocked ? (
              <span aria-hidden className="text-lg">
                📈
              </span>
            ) : (
              <LockIcon className="size-4 text-[#031F82]" />
            )}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-heading text-base font-extrabold text-[#031F82]">
              {advancedMoneyToolsCopy.vaultEntryLabel}
            </span>
            <span className="mt-0.5 block font-sans text-sm leading-snug text-[#1E3A5F]/75">
              {advancedMoneyToolsCopy.vaultEntryBody}
            </span>
          </span>
        </button>
      ) : null}

      <VaultAllocationModal
        isOpen={allocationModalOpen}
        onClose={() => setAllocationModalOpen(false)}
        buckets={displayBuckets}
        totalSavings={totalSavings}
        moneyToAllocate={moneyToAllocate}
        onLockIn={handleLockIn}
      />

      <VaultManageBudgetJarsModal
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

      <VaultManageSavingsGoalsModal
        isOpen={manageGoalsModalOpen}
        onClose={() => setManageGoalsModalOpen(false)}
        goals={vaultGoals}
        isPremium={isPremium || advancedMoneyUnlocked}
        onUpdateGoalDetails={handleUpdateGoalDetails}
        onAddGoal={handleAddGoal}
        onDeleteGoal={handleDeleteGoal}
        onResetGoalBalance={handleResetGoalBalance}
      />

      <ModalShell
        isOpen={cashInOpen}
        onClose={() => setCashInOpen(false)}
        labelledBy="vault-cash-in-title"
        backdropClassName="bg-[#031F82]/45"
        panelClassName="max-w-sm rounded-nga-xl bg-white p-5 shadow-nga-pop sm:p-6"
      >
        <h2
          id="vault-cash-in-title"
          className="font-heading text-lg font-extrabold text-[#031F82]"
        >
          {vaultCopy.cashInTileLabel}
        </h2>
        <div className="mt-4">
          <CashInPointsPanel hideHeading />
        </div>
      </ModalShell>

      <PremiumUpgradeModal
        isOpen={advancedMoneyUpgradeOpen}
        onClose={() => setAdvancedMoneyUpgradeOpen(false)}
        titleId="vault-advanced-money-premium-title"
      />
    </div>
  );
}
