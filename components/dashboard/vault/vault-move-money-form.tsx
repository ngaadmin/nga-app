"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  VaultActionButtonRow,
  VaultActionFieldRow,
  VaultActionPanel,
  VaultAmountField,
  VaultSelectField,
} from "@/components/dashboard/vault/vault-action-forms";
import { copyMatrix } from "@/constants/copyMatrix";
import { useCurrency } from "@/lib/dashboard/currency-context";
import {
  parsePositiveVaultAmount,
  sanitizeVaultAmountInput,
} from "@/lib/dashboard/vault-amount-input";
import { vaultCopy } from "@/lib/dashboard/vault/copy";
import type {
  VaultTransferLocation,
  VaultTransferLocationId,
} from "@/lib/dashboard/vault-transfer";

type VaultMoveMoneyFormProps = {
  contextId: VaultTransferLocationId;
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

  useEffect(() => {
    if (!locations.some((entry) => entry.id === destinationId)) {
      setDestinationId(locations[0]?.id ?? "");
    }
  }, [destinationId, locations]);

  function confirmTransfer() {
    const amount = parsePositiveVaultAmount(amountInput);
    if (amount === null || amount > contextBalance) return;

    const to = destinationId as VaultTransferLocationId;
    if (!to || to === contextId) return;

    onTransfer(contextId, to, amount);
    setAmountInput("");
    onClose();
  }

  return (
    <VaultActionPanel>
      <VaultActionFieldRow
        amountField={
          <VaultAmountField
            currencySymbol={currencySymbol}
            value={amountInput}
            onChange={setAmountInput}
            ariaLabel={budgetCopy.moveAmountLabel}
          />
        }
        secondaryField={
          <VaultSelectField
            value={destinationId}
            onChange={setDestinationId}
            ariaLabel={budgetCopy.moveDestinationLabel}
          >
            {locations.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.label}
              </option>
            ))}
          </VaultSelectField>
        }
      />
      <VaultActionButtonRow
        primaryLabel={savingsCopy.moveConfirm}
        secondaryLabel={savingsCopy.spendCancel}
        onPrimary={confirmTransfer}
        onSecondary={onClose}
        primaryDisabled={contextBalance <= 0}
      />
    </VaultActionPanel>
  );
}

const manageSheetFieldLabelClass = "font-heading text-sm font-bold text-[#031F82]";

const manageSheetSelectClass =
  "mt-1 w-full rounded-lg border border-[#BDE9FB] bg-white px-2.5 py-2 font-sans text-sm text-[#031F82] outline-none focus:border-[#0CC1E0]";

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
              {entry.label}
            </option>
          ))}
        </select>
      </label>
    </form>
  );
}
