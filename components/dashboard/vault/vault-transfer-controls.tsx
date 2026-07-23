"use client";

import { useEffect, useState } from "react";
import { copyMatrix } from "@/constants/copyMatrix";
import { parsePositiveVaultAmount, VAULT_AMOUNT_STEP } from "@/lib/dashboard/vault-amount-input";
import type { VaultTransferLocation, VaultTransferLocationId } from "@/lib/dashboard/vault-transfer";
import { cn } from "@/lib/utils/cn";

export const vaultActionLinkClass =
  "font-heading text-xs font-bold text-[#0CC1E0] hover:underline disabled:cursor-not-allowed disabled:opacity-40";
export const vaultActionLinkActiveClass = "text-[#031F82] underline decoration-[#0CC1E0]";
export const vaultConfirmLinkClass =
  "font-heading text-sm font-bold text-[#BE123C] hover:underline disabled:cursor-not-allowed disabled:opacity-40";
export const vaultGhostBtnClass =
  "rounded-lg px-3 py-1.5 font-heading text-sm font-bold text-[#031F82] transition-colors hover:bg-[#F0FBFF] active:bg-[#F0FBFF]";
export const vaultActionPanelClass = "space-y-2 rounded-lg bg-[#FAFDFF]/80 py-2";
export const vaultFieldInputClass =
  "rounded-lg border border-[#BDE9FB] bg-white px-2 py-1.5 text-sm outline-none focus:border-[#0CC1E0]";

export type VaultTransferControlsProps = {
  contextId: VaultTransferLocationId;
  contextBalance: number;
  locations: VaultTransferLocation[];
  isOpen: boolean;
  onToggle: () => void;
  onTransfer: (from: VaultTransferLocationId, to: VaultTransferLocationId, amount: number) => void;
  onClose: () => void;
  showToggle?: boolean;
};

export function VaultTransferControls({
  contextId,
  contextBalance,
  locations,
  isOpen,
  onToggle,
  onTransfer,
  onClose,
  showToggle = true,
}: VaultTransferControlsProps) {
  const savingsCopy = copyMatrix.dashboard.vault.savings;
  const budgetCopy = copyMatrix.dashboard.vault.budget;

  const [destinationId, setDestinationId] = useState<string>(locations[0]?.id ?? "");
  const [amountInput, setAmountInput] = useState("");

  const canMoveOut = contextBalance > 0 && locations.length > 0;

  useEffect(() => {
    if (!isOpen) setAmountInput("");
  }, [isOpen]);

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
    <div className={showToggle ? "space-y-2" : undefined}>
      {showToggle ? (
        <button
          type="button"
          onClick={onToggle}
          disabled={!canMoveOut}
          className={cn(vaultActionLinkClass, isOpen && vaultActionLinkActiveClass)}
        >
          {savingsCopy.moveMoney}
        </button>
      ) : null}

      {isOpen ? (
        <div className={vaultActionPanelClass}>
          <div className="flex min-w-0 gap-2">
            <input
              type="number"
              min={0}
              step={VAULT_AMOUNT_STEP}
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              placeholder={budgetCopy.moveAmountLabel}
              aria-label={budgetCopy.moveAmountLabel}
              className={cn("w-24 shrink-0", vaultFieldInputClass)}
            />
            <select
              value={destinationId}
              onChange={(e) => setDestinationId(e.target.value)}
              aria-label={budgetCopy.moveDestinationLabel}
              className={cn("min-w-0 flex-1", vaultFieldInputClass)}
            >
              {locations.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={confirmTransfer}
              disabled={contextBalance <= 0}
              className={vaultConfirmLinkClass}
            >
              {savingsCopy.moveConfirm}
            </button>
            <button type="button" onClick={onClose} className={vaultGhostBtnClass}>
              {savingsCopy.spendCancel}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export type VaultTransferToggleProps = {
  isOpen: boolean;
  disabled?: boolean;
  onToggle: () => void;
};

export function VaultTransferToggle({ isOpen, disabled, onToggle }: VaultTransferToggleProps) {
  const savingsCopy = copyMatrix.dashboard.vault.savings;

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={cn(vaultActionLinkClass, isOpen && vaultActionLinkActiveClass)}
    >
      {savingsCopy.moveMoney}
    </button>
  );
}
