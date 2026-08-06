"use client";

import { useEffect, useMemo, useState } from "react";
import { GoalProgressBar } from "@/components/dashboard/vault/vault-visuals";
import { VaultMoveMoneyForm, VaultSaveJarMoveMoneyForm } from "@/components/dashboard/vault/vault-move-money-form";
import { VaultSavingsGoalAllocationModal } from "@/components/dashboard/vault/vault-savings-goal-allocation-modal";
import { ModalShell } from "@/components/ui/modal-shell";
import { copyMatrix } from "@/constants/copyMatrix";
import { useCurrency } from "@/lib/dashboard/currency-context";
import { SettingsIcon } from "@/lib/dashboard/icons";
import { roundAudAmount, SAVINGS_JAR_ID } from "@/lib/dashboard/destination-jars";
import type { SavingsGoal, SavingsGoalId } from "@/lib/dashboard/savings-goals";
import {
  areAllSavingsGoalTargetsUnset,
  savingsGoalPercentAchieved,
  savingsGoalProgress,
} from "@/lib/dashboard/savings-goals";
import type { VaultBucket } from "@/lib/dashboard/vault-buckets";
import { vaultCopy } from "@/lib/dashboard/vault/copy";
import { vaultLightSectionTitleClass } from "@/lib/dashboard/vault/vault-my-money-card-styles";
import {
  buildSaveJarTransferDestinations,
  buildSaveJarTransferSources,
  buildVaultTransferLocations,
  type VaultTransferLocationId,
} from "@/lib/dashboard/vault-transfer";
import {
  vaultActionLinkActiveClass,
  vaultActionLinkClass,
  vaultActionResetLinkClass,
} from "@/lib/dashboard/vault/vault-action-form-styles";
import { cn } from "@/lib/utils/cn";

const orangeCtaClass =
  "rounded-nga-lg border-b-4 border-[#C88202] bg-[#FFA503] font-heading text-xs font-bold uppercase tracking-wide text-[#031F82] transition-all hover:brightness-[1.02] active:translate-y-[2px] active:border-b-2 disabled:cursor-not-allowed disabled:opacity-40";

const destructiveCtaClass =
  "rounded-nga-lg border-b-4 border-[#9F1239] bg-[#BE123C] font-heading text-sm font-bold text-white transition-all hover:brightness-[1.02] active:translate-y-[2px] active:border-b-2 disabled:cursor-not-allowed disabled:opacity-40";

type ResetConfirm =
  | { kind: "goal"; goal: SavingsGoal }
  | { kind: "all" };

export type VaultSaveJarExpandedPanelProps = {
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
  onResetGoalBalance: (goalId: SavingsGoalId) => void;
  onResetAllGoalBalances: () => void;
  onManageGoalsClick?: () => void;
  onClose: () => void;
};

export function VaultSaveJarExpandedPanel({
  bucket,
  buckets,
  goals,
  totalSavings,
  onVaultTransfer,
  onAssignGoals,
  onResetGoalBalance,
  onResetAllGoalBalances,
  onManageGoalsClick,
  onClose,
}: VaultSaveJarExpandedPanelProps) {
  const savingsCopy = copyMatrix.dashboard.vault.savings;
  const budgetCopy = copyMatrix.dashboard.vault.budget;
  const { formatWholeMoney: formatMoney } = useCurrency();
  const [jarMoveOpen, setJarMoveOpen] = useState(false);
  const [allocationModalOpen, setAllocationModalOpen] = useState(false);
  const [activeGoalMoveId, setActiveGoalMoveId] = useState<SavingsGoalId | null>(null);
  const [resetConfirm, setResetConfirm] = useState<ResetConfirm | null>(null);

  const unassignedBalance = roundAudAmount(Math.max(0, bucket.balance));
  const canMoveFunds =
    unassignedBalance > 0 || goals.some((goal) => goal.balance > 0);
  const canAllocate = unassignedBalance > 0 && goals.length > 0;
  const showFirstGoalsCallout = areAllSavingsGoalTargetsUnset(goals);
  const canResetAnyGoal = goals.some((goal) => goal.balance > 0);

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

  function confirmResetAction() {
    if (!resetConfirm) return;
    if (resetConfirm.kind === "goal") {
      onResetGoalBalance(resetConfirm.goal.id);
    } else {
      onResetAllGoalBalances();
    }
    setResetConfirm(null);
  }

  const confirmTitle =
    resetConfirm?.kind === "goal"
      ? vaultCopy.resetGoalBalanceConfirmTitle
      : resetConfirm?.kind === "all"
        ? vaultCopy.resetAllGoalBalancesConfirmTitle
        : "";

  const confirmBody =
    resetConfirm?.kind === "goal"
      ? vaultCopy.resetGoalBalanceConfirmBody
      : resetConfirm?.kind === "all"
        ? vaultCopy.resetAllGoalBalancesConfirmBody
        : "";

  return (
    <>
      <div className="mt-2 rounded-xl border border-[#BDE9FB] bg-white p-3">
        <div className="flex items-center justify-between gap-2">
          <p className={cn(vaultLightSectionTitleClass, "min-w-0")}>
            {bucket.emoji} {savingsCopy.sectionTitle}
          </p>
          <div className="flex shrink-0 items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1 font-heading text-[11px] font-bold text-[#0CC1E0]/90 hover:text-[#031F82] hover:underline"
            >
              <span aria-hidden>←</span>
              {vaultCopy.backToOverview}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="font-heading text-xs font-bold text-[#1E3A5F]/60 hover:text-[#031F82]"
            >
              Close
            </button>
          </div>
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
        ) : (
          <p className="mt-2 font-sans text-[10px] text-[#1E3A5F]/70">
            {budgetCopy.bucketEmptyHint}
          </p>
        )}

        {goals.length > 0 ? (
          <div className="mt-3 border-t border-[#BDE9FB]/40 pt-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="font-heading text-xs font-extrabold uppercase tracking-wide text-[#1E3A5F]/60">
                {savingsCopy.sectionTitle}
              </p>
              {onManageGoalsClick ? (
                <button
                  type="button"
                  onClick={onManageGoalsClick}
                  className="inline-flex min-h-touch items-center gap-1.5 font-heading text-[11px] font-bold text-[#0CC1E0] hover:underline"
                >
                  <SettingsIcon className="size-4 shrink-0" />
                  {vaultCopy.manageSavingsGoalsLabel}
                </button>
              ) : null}
            </div>
          {showFirstGoalsCallout && onManageGoalsClick ? (
            <button
              type="button"
              onClick={onManageGoalsClick}
              className="mb-2 w-full rounded-lg bg-nga-secondary px-3 py-2.5 text-center font-heading text-sm font-extrabold leading-snug text-white transition-colors hover:brightness-[1.05] active:brightness-[0.98]"
            >
              {savingsCopy.firstGoalsCallout}
            </button>
          ) : null}
          <ul className="space-y-2">
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
                          vaultActionLinkClass,
                          "shrink-0 text-right",
                          moveOpen && vaultActionLinkActiveClass,
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
                    <VaultMoveMoneyForm
                      contextId={goal.id}
                      contextBalance={goal.balance}
                      locations={transferLocations}
                      onTransfer={onVaultTransfer}
                      onClose={() => setActiveGoalMoveId(null)}
                    />
                  ) : null}

                  <button
                    type="button"
                    onClick={() => setResetConfirm({ kind: "goal", goal })}
                    disabled={goal.balance <= 0}
                    className={vaultActionResetLinkClass}
                  >
                    {vaultCopy.resetBalanceToZero}
                  </button>
                </li>
              );
            })}
          </ul>

          <button
            type="button"
            onClick={() => setResetConfirm({ kind: "all" })}
            disabled={!canResetAnyGoal}
            className={cn("mt-3 w-full text-center", vaultActionResetLinkClass)}
          >
            {vaultCopy.setAllBalancesToZero}
          </button>
          </div>
        ) : (
          <div className="mt-3 border-t border-[#BDE9FB]/40 pt-3">
            {onManageGoalsClick ? (
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="font-heading text-xs font-extrabold uppercase tracking-wide text-[#1E3A5F]/60">
                  {savingsCopy.sectionTitle}
                </p>
                <button
                  type="button"
                  onClick={onManageGoalsClick}
                  className="inline-flex min-h-touch items-center gap-1.5 font-heading text-[11px] font-bold text-[#0CC1E0] hover:underline"
                >
                  <SettingsIcon className="size-4 shrink-0" />
                  {vaultCopy.manageSavingsGoalsLabel}
                </button>
              </div>
            ) : null}
            <p className="font-sans text-xs leading-snug text-[#1E3A5F]/70">
              {savingsCopy.noGoalsYet}
            </p>
          </div>
        )}
      </div>

      <VaultSavingsGoalAllocationModal
        isOpen={allocationModalOpen}
        onClose={() => setAllocationModalOpen(false)}
        goals={goals}
        poolBalance={unassignedBalance}
        onAssignGoals={onAssignGoals}
      />

      <ModalShell
        isOpen={resetConfirm !== null}
        onClose={() => setResetConfirm(null)}
        align="center"
        labelledBy="vault-reset-savings-goal-balance-title"
        backdropClassName="bg-[#031F82]/55"
        panelClassName="max-w-sm rounded-2xl border-0 bg-white p-5 shadow-md"
      >
        <h2
          id="vault-reset-savings-goal-balance-title"
          className="font-heading text-lg font-extrabold text-[#031F82]"
        >
          {confirmTitle}
        </h2>
        <p className="mt-2 font-sans text-sm leading-snug text-[#1E3A5F]">
          {confirmBody}
        </p>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => setResetConfirm(null)}
            className="flex-1 py-2 font-heading text-sm font-bold text-[#0CC1E0]"
          >
            {vaultCopy.resetCancel}
          </button>
          <button
            type="button"
            onClick={confirmResetAction}
            className={cn("flex-1 px-3 py-2", destructiveCtaClass)}
          >
            {vaultCopy.resetConfirm}
          </button>
        </div>
      </ModalShell>
    </>
  );
}
