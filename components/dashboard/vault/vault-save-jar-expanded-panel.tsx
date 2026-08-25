"use client";

import { useEffect, useState } from "react";
import { VaultSavingsGoalAllocationModal } from "@/components/dashboard/vault/vault-savings-goal-allocation-modal";
import { VaultSavingsGoalDetailPanel } from "@/components/dashboard/vault/vault-savings-goal-detail-panel";
import { copyMatrix } from "@/constants/copyMatrix";
import { useCurrency } from "@/lib/dashboard/currency-context";
import { SettingsIcon } from "@/lib/dashboard/icons";
import { roundAudAmount } from "@/lib/dashboard/destination-jars";
import {
  canAddCustomSavingsGoal,
  type SavingsGoal,
  type SavingsGoalId,
} from "@/lib/dashboard/savings-goals";
import type { VaultBucket } from "@/lib/dashboard/vault-buckets";
import { vaultBucketDisplayName } from "@/lib/dashboard/vault/bucket-display-name";
import { vaultCopy } from "@/lib/dashboard/vault/copy";
import {
  vaultCardBalanceClass,
  vaultCardMainTitleClass,
  vaultManageJarsButtonClass,
} from "@/lib/dashboard/vault/vault-my-money-card-styles";
import type { VaultTransferLocationId } from "@/lib/dashboard/vault-transfer";
import { vaultHomeCompactCtaClass } from "@/lib/dashboard/vault/vault-action-form-styles";
import { cn } from "@/lib/utils/cn";

export type VaultSaveJarExpandedPanelProps = {
  bucket: VaultBucket;
  buckets: VaultBucket[];
  goals: SavingsGoal[];
  totalSavings: number;
  isPremium: boolean;
  onVaultTransfer: (
    from: VaultTransferLocationId,
    to: VaultTransferLocationId,
    amount: number,
  ) => void;
  onAssignGoals: (allocations: Record<string, number>) => void;
  onUpdateGoalDetails: (
    goalId: SavingsGoalId,
    updates: { name?: string; emoji?: string; targetAmount?: number },
  ) => void;
  onManageGoalsClick?: () => void;
  onAddGoalClick?: () => void;
  onClose: () => void;
};

export function VaultSaveJarExpandedPanel({
  bucket,
  buckets,
  goals,
  totalSavings,
  isPremium,
  onVaultTransfer,
  onAssignGoals,
  onUpdateGoalDetails,
  onManageGoalsClick,
  onAddGoalClick,
  onClose,
}: VaultSaveJarExpandedPanelProps) {
  const savingsCopy = copyMatrix.dashboard.vault.savings;
  const budgetCopy = copyMatrix.dashboard.vault.budget;
  const { formatWholeMoney: formatMoney } = useCurrency();
  const [allocationModalOpen, setAllocationModalOpen] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<SavingsGoalId | null>(null);

  const displayName = vaultBucketDisplayName(bucket);
  const unassignedBalance = roundAudAmount(Math.max(0, bucket.balance));
  const canAllocate = unassignedBalance > 0 && goals.length > 0;
  const showAddGoal = Boolean(onAddGoalClick) && canAddCustomSavingsGoal(isPremium);

  const selectedGoal =
    selectedGoalId === null
      ? null
      : (goals.find((goal) => goal.id === selectedGoalId) ?? null);

  useEffect(() => {
    if (selectedGoalId !== null && selectedGoal === null) {
      setSelectedGoalId(null);
    }
  }, [selectedGoal, selectedGoalId]);

  return (
    <>
      {selectedGoal ? (
        <VaultSavingsGoalDetailPanel
          goal={selectedGoal}
          unassignedBalance={unassignedBalance}
          buckets={buckets}
          goals={goals}
          backLabel={displayName}
          onBack={() => setSelectedGoalId(null)}
          onUpdateTarget={(targetAmount) =>
            onUpdateGoalDetails(selectedGoal.id, { targetAmount })
          }
          onAssignToThisGoal={(amount) =>
            onAssignGoals({ [selectedGoal.id]: amount })
          }
          onVaultTransfer={onVaultTransfer}
        />
      ) : (
      <div className="mt-2 space-y-3">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-1 font-heading text-sm font-bold text-[#0CC1E0]/90 hover:text-[#031F82] hover:underline"
        >
          <span aria-hidden>←</span>
          {vaultCopy.backToOverview}
        </button>

        <div className="flex min-w-0 items-start gap-2">
          <p className={cn(vaultCardMainTitleClass, "min-w-0 shrink pt-0.5")}>
            {displayName}
          </p>
          <div className="ml-auto min-w-0 text-right">
            <p className={cn(vaultCardBalanceClass, "min-w-0")}>
              {formatMoney(totalSavings)}
            </p>
            <p className="mt-0.5 font-heading text-xs font-bold leading-tight text-[#1E3A5F]/55">
              {vaultCopy.saveJarTotalCaption}
            </p>
          </div>
          {onManageGoalsClick ? (
            <button
              type="button"
              onClick={onManageGoalsClick}
              aria-label={vaultCopy.manageSavingsGoalsLabel}
              className={vaultManageJarsButtonClass}
            >
              <SettingsIcon className="size-5 shrink-0 text-[#031F82]" />
            </button>
          ) : null}
        </div>

        {canAllocate ? (
          <div className="flex items-center gap-2">
            <p className="min-w-0 flex-1 font-heading text-base font-extrabold tabular-nums text-[#031F82]">
              {formatMoney(unassignedBalance)} {savingsCopy.toPutTowardGoalsLabel}
            </p>
            <button
              type="button"
              onClick={() => setAllocationModalOpen(true)}
              className={vaultHomeCompactCtaClass}
            >
              {budgetCopy.allocatePoolCta}
            </button>
          </div>
        ) : null}

        {goals.length > 0 || showAddGoal ? (
          <ul className="divide-y divide-[#BDE9FB]/30">
            {goals.map((goal) => (
              <li key={goal.id}>
                <button
                  type="button"
                  onClick={() => setSelectedGoalId(goal.id)}
                  className="flex w-full min-w-0 items-center justify-between gap-3 py-2 text-left"
                  aria-label={`Open ${goal.name}`}
                >
                  <p className="min-w-0 truncate font-heading text-sm font-bold text-[#031F82]">
                    {goal.emoji} {goal.name}
                  </p>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <div className="text-right">
                      <p className="font-heading text-sm font-extrabold tabular-nums text-[#031F82]">
                        {formatMoney(goal.balance)}
                      </p>
                      {goal.targetAmount > 0 ? (
                        <p className="font-heading text-xs font-bold tabular-nums text-[#1E3A5F]/55">
                          {formatMoney(goal.targetAmount)}
                        </p>
                      ) : null}
                    </div>
                    <span
                      aria-hidden
                      className="font-heading text-base font-bold leading-none text-[#1E3A5F]/35"
                    >
                      ›
                    </span>
                  </div>
                </button>
              </li>
            ))}
            {showAddGoal ? (
              <li>
                <button
                  type="button"
                  onClick={onAddGoalClick}
                  className="flex w-full min-w-0 items-center py-2 text-left font-heading text-sm font-bold text-[#0CC1E0]/90 hover:text-[#031F82] hover:underline"
                >
                  + {savingsCopy.addAGoal}
                </button>
              </li>
            ) : null}
          </ul>
        ) : (
          <p className="font-sans text-sm leading-snug text-[#1E3A5F]/70">
            {savingsCopy.noGoalsYet}
          </p>
        )}
      </div>
      )}

      <VaultSavingsGoalAllocationModal
        isOpen={allocationModalOpen}
        onClose={() => setAllocationModalOpen(false)}
        goals={goals}
        poolBalance={unassignedBalance}
        onAssignGoals={onAssignGoals}
      />
    </>
  );
}
