"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
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
  vaultFieldInputClass,
} from "@/lib/dashboard/vault/vault-action-form-styles";
import type {
  SpendingCategory,
  SpendingCategoryId,
} from "@/lib/dashboard/spending-categories";
import {
  moneyOutWhatForOptions,
  VAULT_WHAT_FOR_CUSTOM_OPTION_ID,
  type VaultMoneyOutWhatForKind,
} from "@/lib/dashboard/vault-what-for";
import { cn } from "@/lib/utils/cn";

const orangeCtaClass =
  "rounded-nga-lg border-b-4 border-[#C88202] bg-[#FFA503] font-heading text-sm font-bold uppercase tracking-wide text-[#031F82] transition-all hover:brightness-[1.02] active:translate-y-[2px] active:border-b-2 disabled:cursor-not-allowed disabled:opacity-40";

export const VAULT_BUCKET_SPEND_FORM_ID = "vault-bucket-spend-form";

type VaultSpendingCategoryAdminProps = {
  categories: SpendingCategory[];
  isPremium: boolean;
  onPremiumCategoriesRequest: () => void;
  onAddCustomCategory: (label: string) => void;
  onRenameCategory: (categoryId: SpendingCategoryId, label: string) => void;
};

export function VaultSpendingCategoryAdmin({
  categories,
  isPremium,
  onPremiumCategoriesRequest,
  onAddCustomCategory,
  onRenameCategory,
}: VaultSpendingCategoryAdminProps) {
  const budgetCopy = copyMatrix.dashboard.vault.budget;
  const [newCategoryLabel, setNewCategoryLabel] = useState("");
  const [renameDrafts, setRenameDrafts] = useState<Record<string, string>>({});

  function handleAddCategory(event: FormEvent) {
    event.preventDefault();
    const label = newCategoryLabel.trim();
    if (!label) return;
    onAddCustomCategory(label);
    setNewCategoryLabel("");
  }

  function handleRenameBlur(id: SpendingCategoryId) {
    const draft = renameDrafts[id]?.trim();
    if (!draft) return;
    const current = categories.find((entry) => entry.id === id);
    if (current && draft !== current.label) {
      onRenameCategory(id, draft);
    }
  }

  if (!isPremium) {
    return (
      <button
        type="button"
        onClick={onPremiumCategoriesRequest}
        className="text-left font-heading text-sm font-bold text-[#0CC1E0] hover:underline"
      >
        {budgetCopy.manageSpendingCategories}
      </button>
    );
  }

  return (
    <div className="space-y-2">
      <p className="font-heading text-sm font-extrabold text-[#031F82]">
        {budgetCopy.manageCategoriesHeading}
      </p>
      <ul className="space-y-1.5">
        {categories.map((category) => (
          <li key={category.id} className="flex min-w-0 items-center gap-2">
            <input
              value={renameDrafts[category.id] ?? category.label}
              onChange={(event) =>
                setRenameDrafts((current) => ({
                  ...current,
                  [category.id]: event.target.value,
                }))
              }
              onBlur={() => handleRenameBlur(category.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter") handleRenameBlur(category.id);
              }}
              aria-label={`Rename ${category.label}`}
              className={cn("min-w-0 flex-1", vaultFieldInputClass)}
            />
          </li>
        ))}
      </ul>
      <form onSubmit={handleAddCategory} className="flex min-w-0 gap-1.5">
        <input
          value={newCategoryLabel}
          onChange={(event) => setNewCategoryLabel(event.target.value)}
          placeholder={budgetCopy.customCategoryPlaceholder}
          className={cn("min-w-0 flex-1", vaultFieldInputClass)}
        />
        <button type="submit" className={cn("shrink-0 px-3", orangeCtaClass)}>
          {budgetCopy.addCategory}
        </button>
      </form>
    </div>
  );
}

type VaultSpendMoneyFormProps = {
  maxAmount: number;
  categories: SpendingCategory[];
  whatForKind: VaultMoneyOutWhatForKind;
  onSpend: (amount: number, categoryLabel: string) => void;
  onPremiumCustomRequest: () => void;
  onClose: () => void;
};

export function VaultSpendMoneyForm({
  maxAmount,
  categories,
  whatForKind,
  onSpend,
  onPremiumCustomRequest,
  onClose,
}: VaultSpendMoneyFormProps) {
  const budgetCopy = copyMatrix.dashboard.vault.budget;
  const { currencySymbol } = useCurrency();
  const whatForOptions = useMemo(
    () => moneyOutWhatForOptions(whatForKind, categories),
    [categories, whatForKind],
  );

  const [amountInput, setAmountInput] = useState("");
  const [hitCap, setHitCap] = useState(false);
  const [categoryId, setCategoryId] = useState<string>(
    whatForOptions[0]?.id ?? "other",
  );
  const [customWhatFor, setCustomWhatFor] = useState("");

  const selectedLabel =
    whatForOptions.find((entry) => entry.id === categoryId)?.label ??
    whatForOptions[0]?.label;

  useEffect(() => {
    if (!whatForOptions.some((entry) => entry.id === categoryId)) {
      setCategoryId(whatForOptions[0]?.id ?? "other");
    }
  }, [categoryId, whatForOptions]);

  function handleAmountChange(nextRaw: string) {
    const { value: next, hitCap: capped } = sanitizeVaultAmountInput(nextRaw);
    setHitCap(capped);
    setAmountInput(next);
  }

  function confirmSpend(event: FormEvent) {
    event.preventDefault();
    const amount = parsePositiveVaultAmount(amountInput);
    if (amount === null || amount > maxAmount) return;
    if (!selectedLabel) return;
    onSpend(amount, selectedLabel);
    onClose();
  }

  function openCustomComingSoon() {
    onPremiumCustomRequest();
  }

  function handleWhatForChange(nextId: string) {
    if (nextId === VAULT_WHAT_FOR_CUSTOM_OPTION_ID) {
      openCustomComingSoon();
      return;
    }
    setCategoryId(nextId);
  }

  function handleAddCustomWhatFor() {
    openCustomComingSoon();
  }

  return (
    <form
      id={VAULT_BUCKET_SPEND_FORM_ID}
      className="flex min-h-0 flex-1 flex-col"
      onSubmit={confirmSpend}
    >
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-3">
        <div>
          <p className={manageSheetFieldLabelClass}>{budgetCopy.spendAmountLabel}</p>
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
              aria-label={budgetCopy.spendAmountLabel}
              className="min-w-0 flex-1 bg-transparent font-sans text-sm tabular-nums text-[#031F82] outline-none"
            />
          </label>
          {hitCap ? (
            <p className="mt-1 font-sans text-sm text-[#1E3A5F]/70" role="status">
              {vaultCopy.maxAmountReachedNotice}
            </p>
          ) : null}
        </div>

        <div>
          <label className="block">
            <span className={manageSheetFieldLabelClass}>{vaultCopy.whatForLabel}</span>
            <select
              value={categoryId}
              onChange={(event) => handleWhatForChange(event.target.value)}
              aria-label={vaultCopy.whatForLabel}
              className={manageSheetSelectClass}
            >
              {whatForOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
              <option value={VAULT_WHAT_FOR_CUSTOM_OPTION_ID}>
                {vaultCopy.addCustomWhatForPlaceholder}
              </option>
            </select>
          </label>
          <div className="mt-2 flex min-w-0 gap-1.5">
            <input
              value={customWhatFor}
              onChange={(event) => setCustomWhatFor(event.target.value)}
              placeholder={vaultCopy.addCustomWhatForPlaceholder}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  handleAddCustomWhatFor();
                }
              }}
              className={cn("min-w-0 flex-1", vaultFieldInputClass)}
            />
            <button
              type="button"
              onClick={handleAddCustomWhatFor}
              className={cn("shrink-0 px-3", orangeCtaClass)}
            >
              {vaultCopy.addCustomWhatFor}
            </button>
          </div>
        </div>
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
            disabled={maxAmount <= 0}
            className="inline-flex h-touch min-h-touch flex-1 items-center justify-center rounded-nga-lg border-b-4 border-[#C88202] bg-[#FFA503] px-4 font-heading text-sm font-bold text-[#031F82] transition-all hover:brightness-[1.02] active:translate-y-[2px] active:border-b-2 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {vaultCopy.recordMoneyOutConfirm}
          </button>
        </div>
      </div>
    </form>
  );
}
