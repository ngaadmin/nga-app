"use client";

import { useEffect, useMemo, useState } from "react";
import { GoalProgressBar } from "@/components/dashboard/vault-v2/vault-v2-visuals";
import { VaultV2MoveMoneyForm, VaultV2SaveJarMoveMoneyForm } from "@/components/dashboard/vault-v2/vault-v2-move-money-form";
import { VaultV2SavingsGoalAllocationModal } from "@/components/dashboard/vault-v2/vault-v2-savings-goal-allocation-modal";
import { copyMatrix } from "@/constants/copyMatrix";
import { useCurrency } from "@/lib/dashboard/currency-context";
import { roundAudAmount, SAVINGS_JAR_ID } from "@/lib/dashboard/destination-jars";
import type { SavingsGoal, SavingsGoalId } from "@/lib/dashboard/savings-goals";
import {
  savingsGoalPercentAchieved,
  savingsGoalProgress,
} from "@/lib/dashboard/savings-goals";
import type { VaultBucket } from "@/lib/dashboard/vault-buckets";
import {
  buildSaveJarTransferDestinations,
  buildSaveJarTransferSources,
  buildVaultTransferLocations,
  type VaultTransferLocationId,
} from "@/lib/dashboard/vault-transfer";
import {
  vaultV2ActionLinkActiveClass,
  vaultV2ActionLinkClass,
} from "@/lib/dashboard/vault-v2/vault-v2-action-form-styles";
import { cn } from "@/lib/utils/cn";

const orangeCtaClass =
  "rounded-nga-lg border-b-4 border-[#C88202] bg-[#FFA503] font-heading text-xs font-bold uppercase tracking-wide text-[#031F82] transition-all hover:brightness-[1.02] active:translate-y-[2px] active:border-b-2 disabled:cursor-not-allowed disabled:opacity-40";

export type VaultV2SaveJarExpandedPanelProps = {
  bucket: VaultBucket;
  buckets: VaultBucket[];
  goals: SavingsGoal[];
  totalSavings: number;
  onVaultTransfer: (
    from: VaultTransferLocationId,
    to: VaultTransferLocationId,
    amount: number,
  ) => void;
  onAssignGoals: (allocations: Record<string, number>) => void;
  onClose: () => void;
};

export function VaultV2SaveJarExpandedPanel({
  bucket,
  buckets,
  goals,
  totalSavings,
  onVaultTransfer,
  onAssignGoals,
  onClose,
}: VaultV2SaveJarExpandedPanelProps) {
  const savingsCopy = copyMatrix.dashboard.vault.savings;
  const budgetCopy = copyMatrix.dashboard.vault.budget;
  const { formatMoney } = useCurrency();
  const [jarMoveOpen, setJarMoveOpen] = useState(false);
  const [allocationModalOpen, setAllocationModalOpen] = useState(false);
  const [activeGoalMoveId, setActiveGoalMoveId] = useState<SavingsGoalId | null>(null);

  const unassignedBalance = roundAudAmount(Math.max(0, bucket.balance));
  const canMoveFunds =
    unassignedBalance > 0 || goals.some((goal) => goal.balance > 0);
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

  useEffect(() => {
    if (sources.some((entry) => entry.id === sourceId && entry.balance > 0)) return;
    const nextSource = sources.find((entry) => entry.balance > 0);
    setSourceId(nextSource?.id ?? SAVINGS_JAR_ID);
  }, [sourceId, sources]);

  function openAllocationModal() {
    if (!canAllocate) return;
    setAllocationModalOpen(true);
  }

  function toggleGoalMove(goalId: SavingsGoalId) {
    setActiveGoalMoveId((current) => (current === goalId ? null : goalId));
  }

  return (
    <>
      <div className="mt-2 rounded-xl border border-[#BDE9FB] bg-white p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="font-heading text-sm font-extrabold text-[#031F82]">
            {bucket.emoji} {savingsCopy.sectionTitle}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="font-heading text-xs font-bold text-[#1E3A5F]/60 hover:text-[#031F82]"
          >
            Close
          </button>
        </div>

        <div className="mt-2">
          <p className="font-heading text-[10px] font-bold uppercase tracking-wide text-[#1E3A5F]/60">
            {savingsCopy.totalSavingsLabel}
          </p>
          <p className="mt-0.5 font-heading text-lg font-extrabold leading-tight text-[#031F82]">
            {formatMoney(totalSavings)}
          </p>
        </div>

        <button
          type="button"
          onClick={openAllocationModal}
          disabled={!canAllocate}
          className={cn(
            "mt-3 w-full rounded-xl border border-[#BDE9FB] bg-[#FAFDFF]/80 p-3 text-left transition-colors",
            canAllocate ? "hover:border-[#0CC1E0]/60 hover:bg-[#BDE9FB]/20" : "opacity-60",
          )}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-heading text-[10px] font-bold uppercase tracking-wide text-[#FFA503]">
                {budgetCopy.poolLabel}
              </p>
              <p className="mt-0.5 font-heading text-xl font-extrabold leading-none tabular-nums text-[#031F82]">
                {formatMoney(unassignedBalance)}
              </p>
              {canAllocate ? (
                <p className="mt-1 font-sans text-[10px] text-[#1E3A5F]/60">
                  {savingsCopy.clickToAllocateHint}
                </p>
              ) : null}
            </div>
            {canAllocate ? (
              <span
                className={cn("shrink-0 px-3 py-1.5", orangeCtaClass)}
                aria-hidden
              >
                {savingsCopy.assignToGoals}
              </span>
            ) : null}
          </div>
        </button>

        {canMoveFunds ? (
          <div className="mt-2 space-y-2 border-t border-[#BDE9FB]/40 pt-2">
            <div className="flex items-center justify-end gap-x-4 gap-y-1">
              <button
                type="button"
                onClick={() => setJarMoveOpen((open) => !open)}
                disabled={!canMoveJar}
                className={cn(
                  vaultV2ActionLinkClass,
                  jarMoveOpen && vaultV2ActionLinkActiveClass,
                )}
              >
                {savingsCopy.moveMoney}
              </button>
            </div>

            {jarMoveOpen && canMoveJar ? (
              <VaultV2SaveJarMoveMoneyForm
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
        ) : (
          <p className="mt-2 font-sans text-[10px] text-[#1E3A5F]/70">
            {budgetCopy.bucketEmptyHint}
          </p>
        )}

        {goals.length > 0 ? (
          <ul className="mt-3 space-y-2 border-t border-[#BDE9FB]/40 pt-3">
            {goals.map((goal) => {
              const progress = savingsGoalProgress(goal);
              const percentAchieved = savingsGoalPercentAchieved(goal);
              const moveOpen = activeGoalMoveId === goal.id;
              const transferLocations = buildVaultTransferLocations(
                buckets,
                goals,
                goal.id,
              );
              const canMoveGoal = goal.balance > 0 && transferLocations.length > 0;

              return (
                <li
                  key={goal.id}
                  className="space-y-2 rounded-lg border border-[#BDE9FB]/60 bg-[#FAFDFF]/80 p-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="min-w-0 truncate font-heading text-xs font-bold text-[#031F82]">
                      {goal.emoji} {goal.name}
                    </p>
                    {canMoveGoal ? (
                      <button
                        type="button"
                        onClick={() => toggleGoalMove(goal.id)}
                        className={cn(
                          vaultV2ActionLinkClass,
                          "shrink-0 text-right",
                          moveOpen && vaultV2ActionLinkActiveClass,
                        )}
                      >
                        {savingsCopy.moveMoney}
                      </button>
                    ) : null}
                  </div>

                  <p className="font-heading text-lg font-extrabold leading-tight text-[#15803D]">
                    {formatMoney(goal.balance)}
                  </p>

                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-heading text-sm font-extrabold text-[#031F82]">
                        {savingsCopy.currentProgressHeading}
                      </p>
                      <p
                        className={cn(
                          "mt-0.5 font-heading text-xs font-bold",
                          goal.targetAmount > 0 && percentAchieved >= 100
                            ? "text-[#15803D]"
                            : "text-[#1E3A5F]/70",
                        )}
                      >
                        {goal.targetAmount > 0
                          ? savingsCopy.percentToTargetTemplate.replace(
                              "{percent}",
                              String(percentAchieved),
                            )
                          : "—"}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-heading text-sm font-extrabold text-[#031F82]">
                        {savingsCopy.goalTargetLabel}
                      </p>
                      <p className="mt-0.5 font-heading text-sm font-extrabold text-[#031F82]">
                        {goal.targetAmount > 0
                          ? formatMoney(goal.targetAmount)
                          : savingsCopy.goalTargetUnset}
                      </p>
                    </div>
                  </div>

                  <GoalProgressBar
                    progress={goal.targetAmount > 0 ? progress : 0}
                    color="#22C55E"
                    trackColor="#DCFCE7"
                    variant="goal"
                  />

                  {moveOpen && canMoveGoal ? (
                    <VaultV2MoveMoneyForm
                      contextId={goal.id}
                      contextBalance={goal.balance}
                      locations={transferLocations}
                      onTransfer={onVaultTransfer}
                      onClose={() => setActiveGoalMoveId(null)}
                    />
                  ) : null}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-3 border-t border-[#BDE9FB]/40 pt-3 font-sans text-xs leading-snug text-[#1E3A5F]/70">
            {savingsCopy.noGoalsYet}
          </p>
        )}
      </div>

      <VaultV2SavingsGoalAllocationModal
        isOpen={allocationModalOpen}
        onClose={() => setAllocationModalOpen(false)}
        goals={goals}
        poolBalance={unassignedBalance}
        onAssignGoals={onAssignGoals}
      />
    </>
  );
}
