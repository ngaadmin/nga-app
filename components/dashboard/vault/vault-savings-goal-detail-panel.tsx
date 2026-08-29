"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { PremiumUpgradeModal } from "@/components/dashboard/premium-upgrade-modal";
import { VaultMoveMoneyForm } from "@/components/dashboard/vault/vault-move-money-form";
import { VaultSpendMoneyForm } from "@/components/dashboard/vault/vault-spend-money-form";
import { ModalShell } from "@/components/ui/modal-shell";
import { copyMatrix } from "@/constants/copyMatrix";
import { useCurrency } from "@/lib/dashboard/currency-context";
import { savingsGoalProgress, type SavingsGoal } from "@/lib/dashboard/savings-goals";
import {
  clampVaultAllocationEntry,
  formatVaultAmountInputValue,
  parsePositiveVaultAmount,
  parseVaultTargetAmount,
  sanitizeVaultAmountInput,
} from "@/lib/dashboard/vault-amount-input";
import type { VaultBucket } from "@/lib/dashboard/vault-buckets";
import { vaultCopy } from "@/lib/dashboard/vault/copy";
import {
  vaultHomeCompactCtaAutoClass,
  vaultHomeCompactOutlineCtaClass,
} from "@/lib/dashboard/vault/vault-action-form-styles";
import { saveGoalWhatForOptions } from "@/lib/dashboard/vault-what-for";
import {
  buildVaultTransferLocations,
  type VaultTransferLocationId,
} from "@/lib/dashboard/vault-transfer";

const fillTrackClass =
  "pointer-events-none relative h-1.5 w-full overflow-hidden rounded-sm bg-[#BDE9FB]/70";

const fillBarClass =
  "absolute inset-y-0 left-0 bg-[#FFA503] transition-[width] duration-150";

type VaultSavingsGoalDetailPanelProps = {
  goal: SavingsGoal;
  unassignedBalance: number;
  buckets: VaultBucket[];
  goals: SavingsGoal[];
  backLabel: string;
  onBack: () => void;
  onUpdateDetails: (updates: {
    name?: string;
    emoji?: string;
    targetAmount?: number;
  }) => void;
  onAssignToThisGoal: (amount: number) => void;
  onSpendFromGoal: (amount: number, categoryLabel: string) => void;
  onVaultTransfer: (
    from: VaultTransferLocationId,
    to: VaultTransferLocationId,
    amount: number,
  ) => void;
};

export function VaultSavingsGoalDetailPanel({
  goal,
  unassignedBalance,
  buckets,
  goals,
  backLabel,
  onBack,
  onUpdateDetails,
  onAssignToThisGoal,
  onSpendFromGoal,
  onVaultTransfer,
}: VaultSavingsGoalDetailPanelProps) {
  const savingsCopy = copyMatrix.dashboard.vault.savings;
  const { currencySymbol, formatMoney } = useCurrency();
  const [nameInput, setNameInput] = useState(goal.name);
  const [targetInput, setTargetInput] = useState(
    formatVaultAmountInputValue(goal.targetAmount),
  );
  const [putInput, setPutInput] = useState("");
  const [spendOpen, setSpendOpen] = useState(false);
  const [premiumCustomOpen, setPremiumCustomOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);

  useEffect(() => {
    setNameInput(goal.name);
  }, [goal.id, goal.name]);

  useEffect(() => {
    setTargetInput(formatVaultAmountInputValue(goal.targetAmount));
  }, [goal.id, goal.targetAmount]);

  const hasTarget = goal.targetAmount > 0;
  const fillPercent = hasTarget ? savingsGoalProgress(goal) : 0;
  const canPutToward = unassignedBalance > 0;
  const canSpend = goal.balance > 0;
  const transferLocations = useMemo(
    () => buildVaultTransferLocations(buckets, goals, goal.id),
    [buckets, goal.id, goals],
  );
  const canMoveSome = goal.balance > 0 && transferLocations.length > 0;

  function commitName() {
    const trimmed = nameInput.trim();
    if (!trimmed) {
      setNameInput(goal.name);
      return;
    }
    if (trimmed !== goal.name) {
      onUpdateDetails({ name: trimmed });
    }
  }

  function commitTarget() {
    onUpdateDetails({ targetAmount: parseVaultTargetAmount(targetInput) });
  }

  function handlePutToward(event: FormEvent) {
    event.preventDefault();
    const parsed = parsePositiveVaultAmount(putInput);
    if (parsed === null) return;
    const capped = clampVaultAllocationEntry(unassignedBalance, 0, parsed);
    if (capped <= 0) return;
    onAssignToThisGoal(capped);
    setPutInput("");
  }

  return (
    <>
      <div className="space-y-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1 font-heading text-sm font-bold text-[#0CC1E0]/90 hover:text-[#031F82] hover:underline"
        >
          <span aria-hidden>←</span>
          {backLabel}
        </button>

        <label className="block min-w-0">
          <span className="sr-only">{savingsCopy.goalNameLabel}</span>
          <input
            value={nameInput}
            onChange={(event) => setNameInput(event.target.value)}
            onBlur={commitName}
            aria-label={savingsCopy.goalNameLabel}
            className="w-full min-w-0 bg-transparent font-heading text-lg font-extrabold text-[#031F82] outline-none"
          />
        </label>

        <div>
          <p className="font-heading text-3xl font-extrabold leading-none tabular-nums text-[#031F82]">
            {formatMoney(goal.balance)}
          </p>
        </div>

        <label className="block">
          <span className="font-heading text-sm font-bold text-[#031F82]">
            {savingsCopy.goalTargetLabel}
          </span>
          <span className="mt-1 flex h-8 max-w-[9rem] items-center gap-1 rounded-lg border border-[#BDE9FB] bg-white px-2">
            <span className="shrink-0 font-heading text-sm font-bold text-[#031F82]">
              {currencySymbol}
            </span>
            <input
              type="text"
              inputMode="numeric"
              value={targetInput}
              onChange={(event) =>
                setTargetInput(sanitizeVaultAmountInput(event.target.value).value)
              }
              onBlur={commitTarget}
              placeholder={savingsCopy.goalTargetUnset}
              aria-label={savingsCopy.goalTargetLabel}
              className="min-w-0 flex-1 bg-transparent text-right font-sans text-sm tabular-nums text-[#031F82] outline-none"
            />
          </span>
        </label>

        <div>
          <div
            className={fillTrackClass}
            role="progressbar"
            aria-valuemin={0}
            aria-valuenow={Math.round(fillPercent)}
            aria-valuemax={100}
            aria-label={
              hasTarget
                ? `${Math.round(fillPercent)} percent of target`
                : savingsCopy.setATarget
            }
          >
            <span className={fillBarClass} style={{ width: `${fillPercent}%` }} />
          </div>
          {!hasTarget ? (
            <p className="mt-1 font-heading text-sm font-bold text-[#1E3A5F]/60">
              {savingsCopy.setATarget}
            </p>
          ) : null}
        </div>

        {canPutToward ? (
          <form onSubmit={handlePutToward} className="flex items-center gap-2">
            <p className="min-w-0 flex-1 font-heading text-sm font-extrabold tabular-nums text-[#031F82]">
              {formatMoney(unassignedBalance)} {savingsCopy.toPutTowardGoalsLabel}
            </p>
            <label className="flex h-8 w-[4.75rem] shrink-0 items-center gap-0.5 rounded-lg border border-[#BDE9FB] bg-white px-1.5">
              <span className="shrink-0 font-heading text-sm font-bold text-[#031F82]">
                {currencySymbol}
              </span>
              <input
                type="text"
                inputMode="numeric"
                value={putInput}
                onChange={(event) =>
                  setPutInput(sanitizeVaultAmountInput(event.target.value).value)
                }
                aria-label={`Amount to put toward ${goal.name}`}
                className="min-w-0 flex-1 bg-transparent text-right font-sans text-sm tabular-nums text-[#031F82] outline-none"
              />
            </label>
            <button type="submit" className={vaultHomeCompactCtaAutoClass}>
              {copyMatrix.dashboard.vault.budget.allocatePoolCta}
            </button>
          </form>
        ) : null}

        <button
          type="button"
          onClick={() => setSpendOpen(true)}
          disabled={!canSpend}
          className={vaultHomeCompactCtaAutoClass}
        >
          {vaultCopy.iSpentThis}
        </button>

        <button
          type="button"
          onClick={() => setMoveOpen(true)}
          disabled={!canMoveSome}
          className={vaultHomeCompactOutlineCtaClass}
        >
          {vaultCopy.moveSome}
        </button>
      </div>

      <ModalShell
        isOpen={spendOpen && canSpend}
        onClose={() => setSpendOpen(false)}
        layer="toast"
        align="center"
        labelledBy="vault-goal-spend-title"
        backdropClassName="bg-[#031F82]/50"
        panelClassName="flex max-h-[min(92vh,40rem)] max-w-lg flex-col rounded-2xl border-0 bg-white p-0 shadow-md"
      >
        <div className="shrink-0 border-b border-[#BDE9FB]/40 px-5 pb-4 pt-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2
                id="vault-goal-spend-title"
                className="font-heading text-lg font-extrabold text-[#031F82]"
              >
                {vaultCopy.recordSpendingTitle}
              </h2>
              <p className="mt-1 font-sans text-sm leading-snug text-[#1E3A5F]/70">
                {vaultCopy.recordSaveSpendingHelper}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSpendOpen(false)}
              aria-label={vaultCopy.closeModalLabel}
              className="shrink-0 rounded-lg px-2 py-1 font-heading text-lg font-bold leading-none text-[#1E3A5F]/60 transition-colors hover:bg-[#BDE9FB]/40 hover:text-[#031F82]"
            >
              ✕
            </button>
          </div>
        </div>

        <VaultSpendMoneyForm
          maxAmount={goal.balance}
          whatForOptions={saveGoalWhatForOptions(goal.name)}
          onSpend={onSpendFromGoal}
          onPremiumCustomRequest={() => setPremiumCustomOpen(true)}
          onClose={() => setSpendOpen(false)}
        />
      </ModalShell>

      <PremiumUpgradeModal
        isOpen={premiumCustomOpen}
        onClose={() => setPremiumCustomOpen(false)}
        titleId="vault-goal-premium-custom-title"
        layer="toast"
      />

      <ModalShell
        isOpen={moveOpen && canMoveSome}
        onClose={() => setMoveOpen(false)}
        layer="toast"
        align="center"
        labelledBy="vault-goal-move-title"
        backdropClassName="bg-[#031F82]/50"
        panelClassName="flex max-h-[min(92vh,40rem)] max-w-lg flex-col rounded-2xl border-0 bg-white p-0 shadow-md"
      >
        <div className="shrink-0 border-b border-[#BDE9FB]/40 px-5 pb-4 pt-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2
                id="vault-goal-move-title"
                className="font-heading text-lg font-extrabold text-[#031F82]"
              >
                {copyMatrix.dashboard.vault.budget.moveTitle}
              </h2>
              <p className="mt-1 font-sans text-sm leading-snug text-[#1E3A5F]/70">
                {vaultCopy.moveGoalHelper}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setMoveOpen(false)}
              aria-label={vaultCopy.closeModalLabel}
              className="shrink-0 rounded-lg px-2 py-1 font-heading text-lg font-bold leading-none text-[#1E3A5F]/60 transition-colors hover:bg-[#BDE9FB]/40 hover:text-[#031F82]"
            >
              ✕
            </button>
          </div>
        </div>

        <VaultMoveMoneyForm
          contextId={goal.id}
          contextLabel={`${goal.emoji} ${goal.name}`}
          contextBalance={goal.balance}
          locations={transferLocations}
          onTransfer={onVaultTransfer}
          onClose={() => setMoveOpen(false)}
        />
      </ModalShell>
    </>
  );
}
