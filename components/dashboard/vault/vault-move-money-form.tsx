"use client";

import { useEffect, useState, type FormEvent } from "react";
import { copyMatrix } from "@/constants/copyMatrix";
import { useCurrency } from "@/lib/dashboard/currency-context";
import {
  parsePositiveVaultAmount,
  sanitizeVaultAmountInput,
} from "@/lib/dashboard/vault-amount-input";
import { vaultCopy } from "@/lib/dashboard/vault/copy";
import {
  manageSheetFieldLabelClass,
  manageSheetSelectClass,
} from "@/lib/dashboard/vault/vault-action-form-styles";
import type {
  VaultTransferLocation,
  VaultTransferLocationId,
} from "@/lib/dashboard/vault-transfer";

export const VAULT_BUCKET_MOVE_FORM_ID = "vault-bucket-move-form";

type VaultMoveMoneyFormProps = {
  contextId: VaultTransferLocationId;
  contextLabel: string;
  contextBalance: number;
  locations: VaultTransferLocation[];
  onTransfer: (
    from: VaultTransferLocationId,
    to: VaultTransferLocationId,
    amount: number,
  ) => void;
  onClose: () => void;
};

export function VaultMoveMoneyForm({
  contextId,
  contextLabel,
  contextBalance,
  locations,
  onTransfer,
  onClose,
}: VaultMoveMoneyFormProps) {
  const budgetCopy = copyMatrix.dashboard.vault.budget;
  const savingsCopy = copyMatrix.dashboard.vault.savings;
  const { currencySymbol } = useCurrency();

  const [destinationId, setDestinationId] = useState<string>(locations[0]?.id ?? "");
  const [amountInput, setAmountInput] = useState("");
  const [hitCap, setHitCap] = useState(false);

  useEffect(() => {
    if (!locations.some((entry) => entry.id === destinationId)) {
      setDestinationId(locations[0]?.id ?? "");
    }
  }, [destinationId, locations]);

  function handleAmountChange(nextRaw: string) {
    const { value: next, hitCap: capped } = sanitizeVaultAmountInput(nextRaw);
    setHitCap(capped);
    setAmountInput(next);
  }

  function confirmTransfer(event: FormEvent) {
    event.preventDefault();
    const amount = parsePositiveVaultAmount(amountInput);
    if (amount === null || amount > contextBalance) return;

    const to = destinationId as VaultTransferLocationId;
    if (!to || to === contextId) return;

    onTransfer(contextId, to, amount);
    setAmountInput("");
    onClose();
  }

  return (
    <form
      id={VAULT_BUCKET_MOVE_FORM_ID}
      className="flex min-h-0 flex-1 flex-col"
      onSubmit={confirmTransfer}
    >
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-3">
        <div>
          <p className={manageSheetFieldLabelClass}>{savingsCopy.moveSourceLabel}</p>
          <p className="mt-1 font-sans text-sm text-[#031F82]">{contextLabel}</p>
        </div>

        <div>
          <p className={manageSheetFieldLabelClass}>{budgetCopy.moveAmountLabel}</p>
          <label className="mt-1 flex items-center gap-1.5 rounded-lg border border-[#BDE9FB] bg-white px-2.5 py-1.5">
            <span className="shrink-0 font-heading text-sm font-bold text-[#031F82]">
              {currencySymbol}
            </span>
            <input
              type="text"
              inputMode="numeric"
              value={amountInput}
              onChange={(event) => handleAmountChange(event.target.value)}
              placeholder="0"
              aria-label={budgetCopy.moveAmountLabel}
              className="min-w-0 flex-1 bg-transparent font-sans text-sm tabular-nums text-[#031F82] outline-none"
            />
          </label>
          {hitCap ? (
            <p className="mt-1 font-sans text-sm text-[#1E3A5F]/70" role="status">
              {vaultCopy.maxAmountReachedNotice}
            </p>
          ) : null}
        </div>

        <label className="block">
          <span className={manageSheetFieldLabelClass}>{budgetCopy.moveDestinationLabel}</span>
          <select
            value={destinationId}
            onChange={(event) => setDestinationId(event.target.value)}
            aria-label={budgetCopy.moveDestinationLabel}
            className={manageSheetSelectClass}
          >
            {locations.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="shrink-0 border-t border-[#BDE9FB]/40 bg-white px-5 py-4">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-touch min-h-touch flex-1 items-center justify-center rounded-nga-lg border border-[#BDE9FB] bg-white px-4 font-heading text-sm font-bold text-[#031F82] transition-colors hover:bg-[#F0FBFF] active:bg-[#FAFDFF]"
          >
            {vaultCopy.cancelChanges}
          </button>
          <button
            type="submit"
            disabled={contextBalance <= 0}
            className="inline-flex h-touch min-h-touch flex-1 items-center justify-center rounded-nga-lg border-b-4 border-[#C88202] bg-[#FFA503] px-4 font-heading text-sm font-bold text-[#031F82] transition-all hover:brightness-[1.02] active:translate-y-[2px] active:border-b-2 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {savingsCopy.moveConfirm}
          </button>
        </div>
      </div>
    </form>
  );
}

export const VAULT_SAVE_JAR_MOVE_FORM_ID = "vault-save-jar-move-form";

type VaultSaveJarMoveMoneyFormProps = {
  sources: VaultTransferLocation[];
  destinations: VaultTransferLocation[];
  sourceId: VaultTransferLocationId;
  sourceBalance: number;
  onSourceChange: (sourceId: VaultTransferLocationId) => void;
  onTransfer: (
    from: VaultTransferLocationId,
    to: VaultTransferLocationId,
    amount: number,
  ) => void;
  onClose: () => void;
};

export function VaultSaveJarMoveMoneyForm({
  sources,
  destinations,
  sourceId,
  sourceBalance,
  onSourceChange,
  onTransfer,
  onClose,
}: VaultSaveJarMoveMoneyFormProps) {
  const budgetCopy = copyMatrix.dashboard.vault.budget;
  const savingsCopy = copyMatrix.dashboard.vault.savings;
  const { currencySymbol, formatWholeMoney: formatMoney } = useCurrency();

  const [destinationId, setDestinationId] = useState<string>(destinations[0]?.id ?? "");
  const [amountInput, setAmountInput] = useState("");
  const [hitCap, setHitCap] = useState(false);

  useEffect(() => {
    if (!destinations.some((entry) => entry.id === destinationId)) {
      setDestinationId(destinations[0]?.id ?? "");
    }
  }, [destinationId, destinations]);

  function handleAmountChange(nextRaw: string) {
    const { value: next, hitCap: capped } = sanitizeVaultAmountInput(nextRaw);
    setHitCap(capped);
    setAmountInput(next);
  }

  function confirmTransfer(event: FormEvent) {
    event.preventDefault();
    const amount = parsePositiveVaultAmount(amountInput);
    if (amount === null || amount > sourceBalance) return;

    const to = destinationId as VaultTransferLocationId;
    if (!to || to === sourceId) return;

    onTransfer(sourceId, to, amount);
    setAmountInput("");
    onClose();
  }

  return (
    <form
      id={VAULT_SAVE_JAR_MOVE_FORM_ID}
      className="space-y-3"
      onSubmit={confirmTransfer}
    >
      <label className="block">
        <span className={manageSheetFieldLabelClass}>{savingsCopy.moveSourceLabel}</span>
        <select
          value={sourceId}
          onChange={(event) =>
            onSourceChange(event.target.value as VaultTransferLocationId)
          }
          aria-label={savingsCopy.moveSourceLabel}
          className={manageSheetSelectClass}
        >
          {sources.map((entry) => (
            <option key={entry.id} value={entry.id} disabled={entry.balance <= 0}>
              {entry.label} {formatMoney(entry.balance)}
            </option>
          ))}
        </select>
      </label>

      <div>
        <p className={manageSheetFieldLabelClass}>{budgetCopy.moveAmountLabel}</p>
        <label className="mt-1 flex items-center gap-1.5 rounded-lg border border-[#BDE9FB] bg-white px-2.5 py-1.5">
          <span className="shrink-0 font-heading text-sm font-bold text-[#031F82]">
            {currencySymbol}
          </span>
          <input
            type="text"
            inputMode="numeric"
            value={amountInput}
            onChange={(event) => handleAmountChange(event.target.value)}
            placeholder="0"
            aria-label={budgetCopy.moveAmountLabel}
            className="min-w-0 flex-1 bg-transparent font-sans text-sm tabular-nums text-[#031F82] outline-none"
          />
        </label>
        {hitCap ? (
          <p className="mt-1 font-sans text-sm text-[#1E3A5F]/70" role="status">
            {vaultCopy.maxAmountReachedNotice}
          </p>
        ) : null}
      </div>

      <label className="block">
        <span className={manageSheetFieldLabelClass}>{budgetCopy.moveDestinationLabel}</span>
        <select
          value={destinationId}
          onChange={(event) => setDestinationId(event.target.value)}
          aria-label={budgetCopy.moveDestinationLabel}
          className={manageSheetSelectClass}
        >
          {destinations.map((entry) => (
            <option key={entry.id} value={entry.id}>
              {entry.label} {formatMoney(entry.balance)}
            </option>
          ))}
        </select>
      </label>
    </form>
  );
}
