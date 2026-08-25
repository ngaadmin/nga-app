"use client";

import { useEffect, useMemo, useState } from "react";
import { VaultSaveJarMoveMoneyForm, VAULT_SAVE_JAR_MOVE_FORM_ID } from "@/components/dashboard/vault/vault-move-money-form";
import { VaultSavingsGoalAllocationModal } from "@/components/dashboard/vault/vault-savings-goal-allocation-modal";
import { VaultSavingsGoalDetailPanel } from "@/components/dashboard/vault/vault-savings-goal-detail-panel";
import { ModalShell } from "@/components/ui/modal-shell";
import { copyMatrix } from "@/constants/copyMatrix";
import { useCurrency } from "@/lib/dashboard/currency-context";
import { SettingsIcon } from "@/lib/dashboard/icons";
import { roundAudAmount, SAVINGS_JAR_ID } from "@/lib/dashboard/destination-jars";
import { type SavingsGoal, type SavingsGoalId } from "@/lib/dashboard/savings-goals";
import type { VaultBucket } from "@/lib/dashboard/vault-buckets";
import { vaultBucketDisplayName } from "@/lib/dashboard/vault/bucket-display-name";
import { vaultCopy } from "@/lib/dashboard/vault/copy";
import {
  vaultCardBalanceClass,
  vaultCardMainTitleClass,
  vaultManageJarsButtonClass,
} from "@/lib/dashboard/vault/vault-my-money-card-styles";
import {
  buildSaveJarTransferDestinations,
  buildSaveJarTransferSources,
  type VaultTransferLocationId,
} from "@/lib/dashboard/vault-transfer";
import {
  vaultHomeCompactCtaClass,
  vaultHomeCompactOutlineCtaClass,
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

        <button
          type="button"
          onClick={() => setJarMoveOpen(true)}
          disabled={!canMoveJar}
          className={vaultHomeCompactOutlineCtaClass}
        >
          {savingsCopy.moveMoney}
        </button>
      </div>
      )}

      <ModalShell
        isOpen={jarMoveOpen && canMoveJar}
        onClose={() => setJarMoveOpen(false)}
        align="center"
        labelledBy="vault-save-jar-move-title"
        backdropClassName="bg-[#031F82]/50"
        panelClassName="flex max-h-[min(92vh,40rem)] max-w-lg flex-col rounded-2xl border-0 bg-white p-0 shadow-md"
      >
        <div className="shrink-0 border-b border-[#BDE9FB]/40 px-5 pb-4 pt-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2
                id="vault-save-jar-move-title"
                className="font-heading text-lg font-extrabold text-[#031F82]"
              >
                {budgetCopy.moveTitle}
              </h2>
              <p className="mt-1 font-sans text-sm leading-snug text-[#1E3A5F]/70">
                {vaultCopy.moveSavingsHelper}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setJarMoveOpen(false)}
              aria-label={vaultCopy.closeModalLabel}
              className="shrink-0 rounded-lg px-2 py-1 font-heading text-lg font-bold leading-none text-[#1E3A5F]/60 transition-colors hover:bg-[#BDE9FB]/40 hover:text-[#031F82]"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-3">
          <VaultSaveJarMoveMoneyForm
            sources={sources}
            destinations={destinations}
            sourceId={sourceId}
            sourceBalance={sourceBalance}
            onSourceChange={setSourceId}
            onTransfer={onVaultTransfer}
            onClose={() => setJarMoveOpen(false)}
          />
        </div>

        <div className="shrink-0 border-t border-[#BDE9FB]/40 bg-white px-5 py-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setJarMoveOpen(false)}
              className="inline-flex h-touch min-h-touch flex-1 items-center justify-center rounded-nga-lg border border-[#BDE9FB] bg-white px-4 font-heading text-sm font-bold text-[#031F82] transition-colors hover:bg-[#F0FBFF] active:bg-[#FAFDFF]"
            >
              {vaultCopy.cancelChanges}
            </button>
            <button
              type="submit"
              form={VAULT_SAVE_JAR_MOVE_FORM_ID}
              disabled={sourceBalance <= 0}
              className="inline-flex h-touch min-h-touch flex-1 items-center justify-center rounded-nga-lg border-b-4 border-[#C88202] bg-[#FFA503] px-4 font-heading text-sm font-bold text-[#031F82] transition-all hover:brightness-[1.02] active:translate-y-[2px] active:border-b-2 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {savingsCopy.moveConfirm}
            </button>
          </div>
        </div>
      </ModalShell>

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
