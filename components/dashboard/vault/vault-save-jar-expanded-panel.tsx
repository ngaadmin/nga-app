"use client";

import { useEffect, useMemo, useState } from "react";
import { VaultSaveJarMoveMoneyForm } from "@/components/dashboard/vault/vault-move-money-form";
import { VaultSavingsGoalAllocationModal } from "@/components/dashboard/vault/vault-savings-goal-allocation-modal";
import { VaultSavingsGoalDetailPanel } from "@/components/dashboard/vault/vault-savings-goal-detail-panel";
import { copyMatrix } from "@/constants/copyMatrix";
import { useCurrency } from "@/lib/dashboard/currency-context";
import { roundAudAmount, SAVINGS_JAR_ID } from "@/lib/dashboard/destination-jars";
import { type SavingsGoal, type SavingsGoalId } from "@/lib/dashboard/savings-goals";
import type { VaultBucket } from "@/lib/dashboard/vault-buckets";
import { vaultBucketDisplayName } from "@/lib/dashboard/vault/bucket-display-name";
import { vaultCopy } from "@/lib/dashboard/vault/copy";
import {
  vaultCardBalanceClass,
  vaultCardMainTitleClass,
} from "@/lib/dashboard/vault/vault-my-money-card-styles";
import {
  buildSaveJarTransferDestinations,
  buildSaveJarTransferSources,
  type VaultTransferLocationId,
} from "@/lib/dashboard/vault-transfer";
import {
  vaultActionLinkActiveClass,
  vaultActionLinkClass,
  vaultActionLinkSeparatorClass,
  vaultHomeCompactCtaClass,
} from "@/lib/dashboard/vault/vault-action-form-styles";
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
  onResetGoalBalance: (goalId: SavingsGoalId) => void;
  onManageGoalsClick?: () => void;
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
  onResetGoalBalance,
  onManageGoalsClick,
  onClose,
}: VaultSaveJarExpandedPanelProps) {
  const savingsCopy = copyMatrix.dashboard.vault.savings;
  const budgetCopy = copyMatrix.dashboard.vault.budget;
  const { formatWholeMoney: formatMoney } = useCurrency();
  const [jarMoveOpen, setJarMoveOpen] = useState(false);
  const [allocationModalOpen, setAllocationModalOpen] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<SavingsGoalId | null>(null);

  const displayName = vaultBucketDisplayName(bucket);
  const unassignedBalance = roundAudAmount(Math.max(0, bucket.balance));
  const canAllocate = unassignedBalance > 0 && goals.length > 0;

  const sources = useMemo(
    () =>
      buildSaveJarTransferSources(
        unassignedBalance,
        goals,
        savingsCopy.unallocatedSourceLabel,
      ),
    [goals, savingsCopy.unallocatedSourceLabel, unassignedBalance],
  );

  const fundedSources = sources.filter((entry) => entry.balance > 0);

  const [sourceId, setSourceId] = useState<VaultTransferLocationId>(
    fundedSources[0]?.id ?? SAVINGS_JAR_ID,
  );

  const sourceBalance = sources.find((entry) => entry.id === sourceId)?.balance ?? 0;

  const destinations = useMemo(
    () => buildSaveJarTransferDestinations(buckets, sourceId),
    [buckets, sourceId],
  );

  const canMoveJar = fundedSources.length > 0 && destinations.length > 0;

  const selectedGoal =
    selectedGoalId === null
      ? null
      : (goals.find((goal) => goal.id === selectedGoalId) ?? null);

  useEffect(() => {
    if (sources.some((entry) => entry.id === sourceId && entry.balance > 0)) return;
    const nextSource = sources.find((entry) => entry.balance > 0);
    setSourceId(nextSource?.id ?? SAVINGS_JAR_ID);
  }, [sourceId, sources]);

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
          backLabel={displayName}
          onBack={() => setSelectedGoalId(null)}
          onUpdateTarget={(targetAmount) =>
            onUpdateGoalDetails(selectedGoal.id, { targetAmount })
          }
          onAssignToThisGoal={(amount) =>
            onAssignGoals({ [selectedGoal.id]: amount })
          }
          onResetBalance={() => onResetGoalBalance(selectedGoal.id)}
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

        <div className="flex min-w-0 items-center gap-2">
          <p className={cn(vaultCardMainTitleClass, "min-w-0 shrink")}>
            {displayName}
          </p>
          <p
            className={cn(vaultCardBalanceClass, "ml-auto min-w-0 text-right")}
          >
            {formatMoney(totalSavings)}
          </p>
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

        {goals.length > 0 ? (
          <ul className="divide-y divide-[#BDE9FB]/30">
            {goals.map((goal) => {
              const row = (
                <>
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
                </>
              );

              return (
                <li key={goal.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedGoalId(goal.id)}
                    className="flex w-full min-w-0 items-center justify-between gap-3 py-2 text-left"
                    aria-label={`Open ${goal.name}`}
                  >
                    {row}
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="font-sans text-sm leading-snug text-[#1E3A5F]/70">
            {savingsCopy.noGoalsYet}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <button
            type="button"
            onClick={() => setJarMoveOpen((open) => !open)}
            disabled={!canMoveJar}
            className={cn(
              vaultActionLinkClass,
              jarMoveOpen && vaultActionLinkActiveClass,
            )}
          >
            {savingsCopy.moveMoney}
          </button>
          {onManageGoalsClick ? (
            <>
              <span className={vaultActionLinkSeparatorClass} aria-hidden>
                ·
              </span>
              <button
                type="button"
                onClick={onManageGoalsClick}
                className={vaultActionLinkClass}
              >
                {vaultCopy.manageSavingsGoalsLabel}
              </button>
            </>
          ) : null}
        </div>

        {jarMoveOpen && canMoveJar ? (
          <VaultSaveJarMoveMoneyForm
            sources={sources}
            destinations={destinations}
            sourceId={sourceId}
            sourceBalance={sourceBalance}
            onSourceChange={setSourceId}
            onTransfer={onVaultTransfer}
            onClose={() => setJarMoveOpen(false)}
          />
        ) : null}
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
