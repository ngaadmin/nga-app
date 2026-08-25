"use client";

import { useEffect, useState, type FormEvent } from "react";
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
import { vaultCopy } from "@/lib/dashboard/vault/copy";
import {
  vaultCardBalanceClass,
  vaultCardMainTitleClass,
} from "@/lib/dashboard/vault/vault-my-money-card-styles";
import {
  vaultActionResetLinkClass,
  vaultHomeCompactCtaClass,
} from "@/lib/dashboard/vault/vault-action-form-styles";
import { cn } from "@/lib/utils/cn";

const fillTrackClass =
  "pointer-events-none relative h-1.5 w-full overflow-hidden rounded-sm bg-[#BDE9FB]/70";

const fillBarClass =
  "absolute inset-y-0 left-0 bg-[#FFA503] transition-[width] duration-150";

const destructiveCtaClass =
  "rounded-nga-lg border-b-4 border-[#9F1239] bg-[#BE123C] font-heading text-sm font-bold text-white transition-all hover:brightness-[1.02] active:translate-y-[2px] active:border-b-2 disabled:cursor-not-allowed disabled:opacity-40";

type VaultSavingsGoalDetailPanelProps = {
  goal: SavingsGoal;
  unassignedBalance: number;
  backLabel: string;
  onBack: () => void;
  onUpdateTarget: (targetAmount: number) => void;
  onAssignToThisGoal: (amount: number) => void;
  onResetBalance: () => void;
};

export function VaultSavingsGoalDetailPanel({
  goal,
  unassignedBalance,
  backLabel,
  onBack,
  onUpdateTarget,
  onAssignToThisGoal,
  onResetBalance,
}: VaultSavingsGoalDetailPanelProps) {
  const savingsCopy = copyMatrix.dashboard.vault.savings;
  const budgetCopy = copyMatrix.dashboard.vault.budget;
  const { currencySymbol, formatWholeMoney: formatMoney } = useCurrency();
  const [targetInput, setTargetInput] = useState(
    formatVaultAmountInputValue(goal.targetAmount),
  );
  const [putInput, setPutInput] = useState("");
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  useEffect(() => {
    setTargetInput(formatVaultAmountInputValue(goal.targetAmount));
  }, [goal.id, goal.targetAmount]);

  const hasTarget = goal.targetAmount > 0;
  const fillPercent = hasTarget ? savingsGoalProgress(goal) : 0;
  const canPutToward = unassignedBalance > 0;

  function commitTarget() {
    onUpdateTarget(parseVaultTargetAmount(targetInput));
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

  function confirmReset() {
    onResetBalance();
    setResetConfirmOpen(false);
  }

  return (
    <>
      <div className="mt-2 space-y-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1 font-heading text-sm font-bold text-[#0CC1E0]/90 hover:text-[#031F82] hover:underline"
        >
          <span aria-hidden>←</span>
          {backLabel}
        </button>

        <div className="flex min-w-0 items-center gap-2">
          <p className={cn(vaultCardMainTitleClass, "min-w-0 shrink")}>
            {goal.emoji} {goal.name}
          </p>
          <p className={cn(vaultCardBalanceClass, "ml-auto min-w-0 text-right")}>
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
            aria-valuemax={100}
            aria-valuenow={Math.round(fillPercent)}
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
          <form
            onSubmit={handlePutToward}
            className="flex items-center gap-2"
          >
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
            <button type="submit" className={vaultHomeCompactCtaClass}>
              {budgetCopy.allocatePoolCta}
            </button>
          </form>
        ) : null}

        <button
          type="button"
          onClick={() => setResetConfirmOpen(true)}
          disabled={goal.balance <= 0}
          className={vaultActionResetLinkClass}
        >
          {vaultCopy.resetBalanceToZero}
        </button>
      </div>

      <ModalShell
        isOpen={resetConfirmOpen}
        onClose={() => setResetConfirmOpen(false)}
        align="center"
        labelledBy="vault-reset-one-goal-balance-title"
        backdropClassName="bg-[#031F82]/55"
        panelClassName="max-w-sm rounded-2xl border-0 bg-white p-5 shadow-md"
      >
        <h2
          id="vault-reset-one-goal-balance-title"
          className="font-heading text-lg font-extrabold text-[#031F82]"
        >
          {vaultCopy.resetGoalBalanceConfirmTitle}
        </h2>
        <p className="mt-2 font-sans text-sm leading-snug text-[#1E3A5F]">
          {vaultCopy.resetGoalBalanceConfirmBody}
        </p>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => setResetConfirmOpen(false)}
            className="flex-1 py-2 font-heading text-sm font-bold text-[#0CC1E0]"
          >
            {vaultCopy.resetCancel}
          </button>
          <button
            type="button"
            onClick={confirmReset}
            className={cn("flex-1 px-3 py-2", destructiveCtaClass)}
          >
            {vaultCopy.resetConfirm}
          </button>
        </div>
      </ModalShell>
    </>
  );
}
