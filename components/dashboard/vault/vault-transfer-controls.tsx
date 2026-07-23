"use client";

import { useEffect, useMemo, useState } from "react";
import { copyMatrix } from "@/constants/copyMatrix";
import { useCurrency } from "@/lib/dashboard/currency-context";
import { roundAudAmount } from "@/lib/dashboard/destination-jars";
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

const amountChipClass =
  "rounded-full border border-[#BDE9FB] bg-white px-2.5 py-1 font-heading text-[10px] font-bold text-[#031F82] transition-colors hover:border-[#0CC1E0] hover:bg-[#F0FBFF]";

type TransferDirection = "out" | "in";

export type VaultTransferControlsProps = {
  contextId: VaultTransferLocationId;
  contextLabel: string;
  contextBalance: number;
  locations: VaultTransferLocation[];
  isOpen: boolean;
  onToggle: () => void;
  onTransfer: (from: VaultTransferLocationId, to: VaultTransferLocationId, amount: number) => void;
  onClose: () => void;
  showToggle?: boolean;
};

function buildAmountPresets(balance: number): number[] {
  const safeBalance = roundAudAmount(Math.max(0, balance));
  if (safeBalance <= 0) return [];

  const candidates = [1, 5, 10, 25, 50].filter((value) => value < safeBalance);
  const unique = Array.from(new Set([...candidates, safeBalance])).sort((a, b) => a - b);
  return unique.slice(-4);
}

export function VaultTransferControls({
  contextId,
  contextLabel,
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
  const { formatMoney } = useCurrency();

  const [direction, setDirection] = useState<TransferDirection>("out");
  const [counterpartId, setCounterpartId] = useState<string>(locations[0]?.id ?? "pool");
  const [amountInput, setAmountInput] = useState("");

  const counterpart = locations.find((entry) => entry.id === counterpartId);
  const sourceBalance =
    direction === "out" ? contextBalance : (counterpart?.balance ?? 0);
  const presets = useMemo(() => buildAmountPresets(sourceBalance), [sourceBalance]);
  const canMoveOut = contextBalance > 0;
  const canMoveIn = locations.some((entry) => entry.balance > 0);
  const canTransfer = canMoveOut || canMoveIn;

  useEffect(() => {
    if (!isOpen) {
      setAmountInput("");
      setDirection("out");
    }
  }, [isOpen]);

  useEffect(() => {
    if (!locations.some((entry) => entry.id === counterpartId)) {
      setCounterpartId(locations[0]?.id ?? "pool");
    }
  }, [counterpartId, locations]);

  function confirmTransfer() {
    const amount = parsePositiveVaultAmount(amountInput);
    if (amount === null || amount > sourceBalance) return;

    const from = direction === "out" ? contextId : (counterpartId as VaultTransferLocationId);
    const to = direction === "out" ? (counterpartId as VaultTransferLocationId) : contextId;
    if (from === to) return;

    onTransfer(from, to, amount);
    setAmountInput("");
    onClose();
  }

  const moveOutLabel = savingsCopy.moveOutOfTemplate.replace("{name}", contextLabel);
  const moveInLabel = savingsCopy.moveIntoTemplate.replace("{name}", contextLabel);

  return (
    <div className={showToggle ? "space-y-2" : undefined}>
      {showToggle ? (
        <button
          type="button"
          onClick={onToggle}
          disabled={!canTransfer || locations.length === 0}
          className={cn(vaultActionLinkClass, isOpen && vaultActionLinkActiveClass)}
        >
          {savingsCopy.moveMoney}
        </button>
      ) : null}

      {isOpen ? (
        <div className={vaultActionPanelClass}>
          <div className="flex min-w-0 flex-wrap gap-2">
            {presets.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setAmountInput(String(preset))}
                className={cn(
                  amountChipClass,
                  amountInput === String(preset) && "border-[#0CC1E0] bg-[#F0FBFF]",
                )}
              >
                {preset === sourceBalance ? "All" : formatMoney(preset)}
              </button>
            ))}
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
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setDirection("out")}
              disabled={!canMoveOut}
              className={cn(
                "rounded-lg px-2 py-1 font-heading text-[10px] font-bold disabled:opacity-40",
                direction === "out"
                  ? "bg-[#031F82] text-white"
                  : "border border-[#BDE9FB] text-[#031F82]",
              )}
            >
              {moveOutLabel}
            </button>
            <button
              type="button"
              onClick={() => setDirection("in")}
              disabled={!canMoveIn}
              className={cn(
                "rounded-lg px-2 py-1 font-heading text-[10px] font-bold disabled:opacity-40",
                direction === "in"
                  ? "bg-[#031F82] text-white"
                  : "border border-[#BDE9FB] text-[#031F82]",
              )}
            >
              {moveInLabel}
            </button>
          </div>

          <select
            value={counterpartId}
            onChange={(e) => setCounterpartId(e.target.value)}
            aria-label={budgetCopy.moveDestinationLabel}
            className={cn("w-full", vaultFieldInputClass)}
          >
            {locations.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.label}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={confirmTransfer}
              disabled={sourceBalance <= 0}
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
