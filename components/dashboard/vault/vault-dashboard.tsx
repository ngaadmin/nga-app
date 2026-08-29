"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CashInPointsPanel } from "@/components/dashboard/points/cash-in-points-panel";
import { VaultAllocationModal } from "@/components/dashboard/vault/vault-allocation-modal";
import { VaultBucketDrilldown } from "@/components/dashboard/vault/vault-bucket-drilldown";
import { VaultDepositSection } from "@/components/dashboard/vault/vault-deposit-section";
import { VaultManageBudgetJarsModal } from "@/components/dashboard/vault/vault-manage-budget-jars-modal";
import { VaultManageSavingsGoalsModal } from "@/components/dashboard/vault/vault-manage-savings-goals-modal";
import { VaultHomeJarMove } from "@/components/dashboard/vault/vault-home-jar-move";
import { VaultMyMoneyCard } from "@/components/dashboard/vault/vault-my-money-card";
import { PremiumUpgradeModal } from "@/components/dashboard/premium-upgrade-modal";
import { ModalShell } from "@/components/ui/modal-shell";
import { copyMatrix } from "@/constants/copyMatrix";
import { advancedMoneyToolsCopy } from "@/lib/dashboard/advanced-money-tools/copy";
import { ADVANCED_MONEY_TOOLS_HREF } from "@/lib/dashboard/advanced-money-tools/nav";
import { LockIcon } from "@/lib/dashboard/icons";
import {
  useVaultActions,
  type PendingVaultDeposit,
} from "@/lib/dashboard/vault/use-vault-actions";
import { useTestingPremiumUnlocked } from "@/lib/dashboard/testing-premium";
import type { VaultBucketId } from "@/lib/dashboard/vault-buckets";
import type { VaultIncomeSourceId } from "@/lib/dashboard/vault-income-sources";
import { vaultCopy as vaultUiCopy } from "@/lib/dashboard/vault/copy";
import { vaultBucketsWithDisplayNames } from "@/lib/dashboard/vault/bucket-display-name";
import {
  vaultOverviewHairlineClass,
  vaultOverviewSectionTitleClass,
} from "@/lib/dashboard/vault/vault-my-money-card-styles";

export function VaultDashboard() {
  const vaultCopy = copyMatrix.dashboard.vault;
  const searchParams = useSearchParams();
  const router = useRouter();
  const {
    isPremium,
    vaultBuckets,
    vaultGoals,
    totalSavings,
    spendingCategories,
    handleLockIn,
    handleVaultTransfer,
    handleMarkSpent,
    handleAssignGoals,
    handleRenameBucket,
    handleAddCustomBucket,
    handleDeleteCustomBucket,
    handleUpdateGoalDetails,
    handleAddGoal,
    handleDeleteGoal,
    handleResetGoalBalance,
    handleResetBucketBalance,
    handleResetAllBalances,
  } = useVaultActions();
  const advancedMoneyUnlocked = useTestingPremiumUnlocked();

  const [expandedBucketId, setExpandedBucketId] = useState<VaultBucketId | null>(null);
  const [pendingDeposit, setPendingDeposit] = useState<PendingVaultDeposit | null>(
    null,
  );
  const [manageJarsModalOpen, setManageJarsModalOpen] = useState(false);
  const [manageGoalsModalOpen, setManageGoalsModalOpen] = useState(false);
  const [manageGoalsStartOnAdd, setManageGoalsStartOnAdd] = useState(false);
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

  function openBucket(bucketId: VaultBucketId) {
    setExpandedBucketId(bucketId);
  }

  function closeBucketSheet() {
    setExpandedBucketId(null);
  }

  function handleDepositAndOpenAllocation(amount: number, source: VaultIncomeSourceId) {
    setPendingDeposit({ amount, source });
  }

  function handleDiscardPendingDeposit() {
    setPendingDeposit(null);
  }

  function handleAllocatePendingDeposit(allocations: Record<string, number>): boolean {
    if (!pendingDeposit) return false;
    const locked = handleLockIn(allocations, pendingDeposit);
    if (!locked) return false;
    setPendingDeposit(null);
    return true;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <VaultMyMoneyCard
        buckets={displayBuckets}
        totalSavings={totalSavings}
        expandedBucketId={expandedBucketId}
        onToggleBucket={openBucket}
        onManageJarsClick={() => setManageJarsModalOpen(true)}
        footer={
          <VaultHomeJarMove
            buckets={displayBuckets}
            goals={vaultGoals}
            onVaultTransfer={handleVaultTransfer}
          />
        }
      />

      <div className={`mt-8 ${vaultOverviewHairlineClass}`} role="presentation" />

      <div className="mt-8">
        <VaultDepositSection onDeposit={handleDepositAndOpenAllocation} />
      </div>

      <div className={`mt-8 ${vaultOverviewHairlineClass}`} role="presentation" />

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
        className="mt-8 flex w-full items-center gap-2 bg-transparent py-1 text-left"
      >
        {!advancedMoneyUnlocked ? (
          <LockIcon className="size-5 shrink-0 text-[#031F82]/55" />
        ) : null}
        <span className="min-w-0 flex-1">
          <span className={`block ${vaultOverviewSectionTitleClass}`}>
            {advancedMoneyToolsCopy.vaultEntryLabel}
          </span>
          <span className="mt-0.5 block font-sans text-sm leading-snug text-[#1E3A5F]/75">
            {advancedMoneyToolsCopy.vaultEntryBody}
          </span>
        </span>
      </button>

      <ModalShell
        isOpen={expandedBucket !== null}
        dismissOnBackdrop={false}
        align="center"
        labelledBy="vault-jar-sheet-title"
        backdropClassName="bg-[#031F82]/50"
        panelClassName="w-full max-w-sm max-h-[min(90vh,40rem)] overflow-y-auto rounded-2xl border-0 bg-white px-4 py-5 shadow-md sm:px-5"
      >
        {expandedBucket ? (
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <h2 id="vault-jar-sheet-title" className="sr-only">
                {expandedBucket.name}
              </h2>
              <VaultBucketDrilldown
                bucket={expandedBucket}
                buckets={displayBuckets}
                goals={vaultGoals}
                totalSavings={totalSavings}
                isPremium={isPremium || advancedMoneyUnlocked}
                spendingCategories={spendingCategories}
                onVaultTransfer={handleVaultTransfer}
                onMarkSpent={handleMarkSpent}
                onAssignGoals={handleAssignGoals}
                onUpdateGoalDetails={handleUpdateGoalDetails}
                onAddGoalClick={() => {
                  setManageGoalsStartOnAdd(true);
                  setManageGoalsModalOpen(true);
                }}
                onClose={closeBucketSheet}
              />
            </div>
            <button
              type="button"
              onClick={closeBucketSheet}
              aria-label={vaultUiCopy.closeModalLabel}
              className="shrink-0 rounded-lg px-2 py-1 font-heading text-lg font-bold leading-none text-[#1E3A5F]/60 transition-colors hover:bg-[#BDE9FB]/40 hover:text-[#031F82]"
            >
              ✕
            </button>
          </div>
        ) : null}
      </ModalShell>

      <VaultAllocationModal
        isOpen={pendingDeposit !== null}
        onClose={handleDiscardPendingDeposit}
        buckets={displayBuckets}
        totalSavings={totalSavings}
        moneyIn={pendingDeposit?.amount ?? 0}
        onLockIn={handleAllocatePendingDeposit}
      />

      <VaultManageBudgetJarsModal
        isOpen={manageJarsModalOpen}
        onClose={() => setManageJarsModalOpen(false)}
        buckets={vaultBuckets}
        isPremium={isPremium}
        onRenameBucket={handleRenameBucket}
        onAddCustomBucket={handleAddCustomBucket}
        onDeleteCustomBucket={handleDeleteCustomBucket}
        onResetBucketBalance={handleResetBucketBalance}
        onResetAllBalances={handleResetAllBalances}
        onBucketDeleted={(bucketId) => {
          if (expandedBucketId === bucketId) {
            setExpandedBucketId(null);
          }
        }}
      />

      <VaultManageSavingsGoalsModal
        isOpen={manageGoalsModalOpen}
        onClose={() => {
          setManageGoalsModalOpen(false);
          setManageGoalsStartOnAdd(false);
        }}
        goals={vaultGoals}
        isPremium={isPremium || advancedMoneyUnlocked}
        onUpdateGoalDetails={handleUpdateGoalDetails}
        onAddGoal={handleAddGoal}
        onDeleteGoal={handleDeleteGoal}
        onResetGoalBalance={handleResetGoalBalance}
        startOnAdd={manageGoalsStartOnAdd}
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
