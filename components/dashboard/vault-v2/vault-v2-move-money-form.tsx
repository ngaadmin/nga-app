"use client";

import { useEffect, useState } from "react";
import {
  VaultV2ActionButtonRow,
  VaultV2ActionFieldRow,
  VaultV2ActionPanel,
  VaultV2AmountField,
  VaultV2LabeledSelectField,
  VaultV2SelectField,
} from "@/components/dashboard/vault-v2/vault-v2-action-forms";
import { copyMatrix } from "@/constants/copyMatrix";
import { useCurrency } from "@/lib/dashboard/currency-context";
import { parsePositiveVaultAmount } from "@/lib/dashboard/vault-amount-input";
import type {
  VaultTransferLocation,
  VaultTransferLocationId,
} from "@/lib/dashboard/vault-transfer";

type VaultV2MoveMoneyFormProps = {
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

export function VaultV2MoveMoneyForm({
  contextId,
  contextBalance,
  locations,
  onTransfer,
  onClose,
}: VaultV2MoveMoneyFormProps) {
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
    <VaultV2ActionPanel>
      <VaultV2ActionFieldRow
        amountField={
          <VaultV2AmountField
            currencySymbol={currencySymbol}
            value={amountInput}
            onChange={setAmountInput}
            ariaLabel={budgetCopy.moveAmountLabel}
          />
        }
        secondaryField={
          <VaultV2SelectField
            value={destinationId}
            onChange={setDestinationId}
            ariaLabel={budgetCopy.moveDestinationLabel}
          >
            {locations.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.label}
              </option>
            ))}
          </VaultV2SelectField>
        }
      />
      <VaultV2ActionButtonRow
        primaryLabel={savingsCopy.moveConfirm}
        secondaryLabel={savingsCopy.spendCancel}
        onPrimary={confirmTransfer}
        onSecondary={onClose}
        primaryDisabled={contextBalance <= 0}
      />
    </VaultV2ActionPanel>
  );
}

type VaultV2SaveJarMoveMoneyFormProps = {
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

export function VaultV2SaveJarMoveMoneyForm({
  sources,
  destinations,
  sourceId,
  sourceBalance,
  onSourceChange,
  onTransfer,
  onClose,
}: VaultV2SaveJarMoveMoneyFormProps) {
  const budgetCopy = copyMatrix.dashboard.vault.budget;
  const savingsCopy = copyMatrix.dashboard.vault.savings;
  const { currencySymbol, formatMoney } = useCurrency();

  const [destinationId, setDestinationId] = useState<string>(destinations[0]?.id ?? "");
  const [amountInput, setAmountInput] = useState("");

  useEffect(() => {
    if (!destinations.some((entry) => entry.id === destinationId)) {
      setDestinationId(destinations[0]?.id ?? "");
    }
  }, [destinationId, destinations]);

  function confirmTransfer() {
    const amount = parsePositiveVaultAmount(amountInput);
    if (amount === null || amount > sourceBalance) return;

    const to = destinationId as VaultTransferLocationId;
    if (!to || to === sourceId) return;

    onTransfer(sourceId, to, amount);
    setAmountInput("");
    onClose();
  }

  return (
    <VaultV2ActionPanel>
      <VaultV2LabeledSelectField
        label={savingsCopy.moveSourceLabel}
        value={sourceId}
        onChange={(value) => onSourceChange(value as VaultTransferLocationId)}
        ariaLabel={savingsCopy.moveSourceLabel}
      >
        {sources.map((entry) => (
          <option key={entry.id} value={entry.id} disabled={entry.balance <= 0}>
            {entry.label} {formatMoney(entry.balance)}
          </option>
        ))}
      </VaultV2LabeledSelectField>

      <VaultV2ActionFieldRow
        amountField={
          <VaultV2AmountField
            currencySymbol={currencySymbol}
            value={amountInput}
            onChange={setAmountInput}
            ariaLabel={budgetCopy.moveAmountLabel}
          />
        }
        secondaryField={
          <VaultV2SelectField
            value={destinationId}
            onChange={setDestinationId}
            ariaLabel={budgetCopy.moveDestinationLabel}
          >
            {destinations.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.label}
              </option>
            ))}
          </VaultV2SelectField>
        }
      />

      <VaultV2ActionButtonRow
        primaryLabel={savingsCopy.moveConfirm}
        secondaryLabel={savingsCopy.spendCancel}
        onPrimary={confirmTransfer}
        onSecondary={onClose}
        primaryDisabled={sourceBalance <= 0}
      />
    </VaultV2ActionPanel>
  );
}
