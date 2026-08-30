"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { PremiumUpgradeModal } from "@/components/dashboard/premium-upgrade-modal";
import { VaultMoveMoneyForm } from "@/components/dashboard/vault/vault-move-money-form";
import { VaultSpendMoneyForm } from "@/components/dashboard/vault/vault-spend-money-form";
import { ModalShell } from "@/components/ui/modal-shell";
import { copyMatrix } from "@/constants/copyMatrix";
import { useCurrency } from "@/lib/dashboard/currency-context";
import { SettingsIcon } from "@/lib/dashboard/icons";
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
  const [targetInput, setTargetInput] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [putInput, setPutInput] = useState("");
  const [spendOpen, setSpendOpen] = useState(false);
  const [premiumCustomOpen, setPremiumCustomOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const hasTarget = (goal?.targetAmount ?? 0) > 0;
  const fillPercent = hasTarget && goal ? savingsGoalProgress(goal) : 0;
  const canPutToward = unassignedBalance > 0;
  const canSpend = (goal?.balance ?? 0) > 0;
  const transferLocations = useMemo(
    () =>
      goal ? buildVaultTransferLocations(buckets, goals, goal.id) : [],
    [buckets, goal, goals],
  );
  const canMoveSome = canSpend && transferLocations.length > 0;

  useEffect(() => {
    if (!goal || hasTarget) return;
    setTargetInput("");
  }, [goal, hasTarget]);

  if (!goal) return null;

  function openGoalSettings() {
    setNameInput(goal.name);
    setTargetInput(formatVaultAmountInputValue(goal.targetAmount));
    setSettingsOpen(true);
  }

  function closeGoalSettings() {
    setSettingsOpen(false);
  }

  function saveFirstTarget(event: FormEvent) {
    event.preventDefault();
    const nextTarget = parseVaultTargetAmount(targetInput);
    if (nextTarget <= 0) return;
    onUpdateDetails({ targetAmount: nextTarget });
    setTargetInput("");
  }

  function saveGoalSettings(event: FormEvent) {
    event.preventDefault();
    const nextName = nameInput.trim();
    const nextTarget = parseVaultTargetAmount(targetInput);
    if (!nextName || nextTarget <= 0) return;
    onUpdateDetails({ name: nextName, targetAmount: nextTarget });
    setTargetInput("");
    setSettingsOpen(false);
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

        <div className="flex min-w-0 items-center gap-1">
          <h2 className="min-w-0 truncate font-heading text-lg font-extrabold text-[#031F82]">
            {goal.name}
          </h2>
          <button
            type="button"
            onClick={openGoalSettings}
            aria-label={vaultCopy.goalSettingsLabel}
            className="flex size-6 shrink-0 items-center justify-center rounded-md text-[#031F82] transition-colors hover:bg-[#BDE9FB]/40"
          >
            <SettingsIcon className="size-3.5" />
          </button>
        </div>

        <div>
          <p className="font-heading text-3xl font-extrabold leading-none tabular-nums text-[#031F82]">
            {formatMoney(goal.balance)}
          </p>
        </div>

        {hasTarget ? (
          <div>
            <p className="font-heading text-xs font-bold leading-tight text-[#031F82]">
              {savingsCopy.goalTargetLabel}
            </p>
            <p className="mt-1 font-heading text-xl font-extrabold leading-none tabular-nums text-[#FFA503]">
              {formatMoney(goal.targetAmount)}
            </p>
            <div
              className={`${fillTrackClass} mt-2`}
              role="progressbar"
              aria-valuemin={0}
              aria-valuenow={Math.round(fillPercent)}
              aria-valuemax={100}
              aria-label={`${Math.round(fillPercent)} percent of target`}
            >
              <span className={fillBarClass} style={{ width: `${fillPercent}%` }} />
            </div>
          </div>
        ) : (
          <form onSubmit={saveFirstTarget} className="space-y-2">
            <label className="block">
              <span className="font-heading text-xs font-bold leading-tight text-[#031F82]">
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
                  placeholder={savingsCopy.goalTargetUnset}
                  aria-label={savingsCopy.goalTargetLabel}
                  className="min-w-0 flex-1 bg-transparent text-right font-sans text-sm tabular-nums text-[#031F82] outline-none"
                />
              </span>
            </label>
            <button type="submit" className={vaultHomeCompactCtaAutoClass}>
              {vaultCopy.saveChanges}
            </button>
          </form>
        )}

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

        <div className="flex items-center gap-2">
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
        isOpen={settingsOpen}
        onClose={closeGoalSettings}
        layer="toast"
        align="center"
        labelledBy="vault-goal-settings-title"
        backdropClassName="bg-[#031F82]/50"
        panelClassName="flex max-h-[min(92vh,40rem)] max-w-lg flex-col rounded-2xl border-0 bg-white p-0 shadow-md"
      >
        <div className="shrink-0 border-b border-[#BDE9FB]/40 px-5 pb-4 pt-5">
          <div className="flex items-start justify-between gap-3">
            <h2
              id="vault-goal-settings-title"
              className="font-heading text-lg font-extrabold text-[#031F82]"
            >
              {vaultCopy.goalSettingsLabel}
            </h2>
            <button
              type="button"
              onClick={closeGoalSettings}
              aria-label={vaultCopy.closeModalLabel}
              className="shrink-0 rounded-lg px-2 py-1 font-heading text-lg font-bold leading-none text-[#1E3A5F]/60 transition-colors hover:bg-[#BDE9FB]/40 hover:text-[#031F82]"
            >
              ✕
            </button>
          </div>
        </div>
        <form onSubmit={saveGoalSettings} className="space-y-4 px-5 py-4">
          <label className="block">
            <span className="font-heading text-xs font-bold leading-tight text-[#031F82]">
              {vaultCopy.goalNameLabel}
            </span>
            <input
              type="text"
              value={nameInput}
              onChange={(event) => setNameInput(event.target.value)}
              aria-label={vaultCopy.goalNameLabel}
              className="mt-1 w-full rounded-lg border border-[#BDE9FB] bg-white px-2.5 py-1.5 font-sans text-sm text-[#031F82] outline-none focus:border-[#0CC1E0]"
            />
          </label>
          <label className="block">
            <span className="font-heading text-xs font-bold leading-tight text-[#031F82]">
              {vaultCopy.goalTargetLabel}
            </span>
            <span className="mt-1 flex h-10 max-w-[10rem] items-center gap-1 rounded-lg border border-[#BDE9FB] bg-white px-2.5">
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
                aria-label={vaultCopy.goalTargetLabel}
                className="min-w-0 flex-1 bg-transparent text-right font-sans text-sm tabular-nums text-[#031F82] outline-none"
              />
            </span>
          </label>
          <div className="flex items-center gap-2">
            <button type="submit" className={vaultHomeCompactCtaAutoClass}>
              {vaultCopy.saveChanges}
            </button>
            <button
              type="button"
              onClick={closeGoalSettings}
              className={vaultHomeCompactOutlineCtaClass}
            >
              {vaultCopy.cancelChanges}
            </button>
          </div>
        </form>
      </ModalShell>

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
