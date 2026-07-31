"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  VaultV2ActionButtonRow,
  VaultV2ActionFieldRow,
  VaultV2ActionPanel,
  VaultV2AmountField,
  VaultV2SelectField,
} from "@/components/dashboard/vault-v2/vault-v2-action-forms";
import { copyMatrix } from "@/constants/copyMatrix";
import { useCurrency } from "@/lib/dashboard/currency-context";
import { parsePositiveVaultAmount } from "@/lib/dashboard/vault-amount-input";
import { vaultV2FieldInputClass } from "@/lib/dashboard/vault-v2/vault-v2-action-form-styles";
import type {
  SpendingCategory,
  SpendingCategoryId,
} from "@/lib/dashboard/spending-categories";
import { cn } from "@/lib/utils/cn";

const orangeCtaClass =
  "rounded-nga-lg border-b-4 border-[#C88202] bg-[#FFA503] font-heading text-xs font-bold uppercase tracking-wide text-[#031F82] transition-all hover:brightness-[1.02] active:translate-y-[2px] active:border-b-2 disabled:cursor-not-allowed disabled:opacity-40";

type VaultV2SpendMoneyFormProps = {
  maxAmount: number;
  categories: SpendingCategory[];
  isPremium: boolean;
  onSpend: (amount: number, categoryLabel: string) => void;
  onClose: () => void;
  onPremiumCategoriesRequest: () => void;
  onAddCustomCategory: (label: string) => void;
  onRenameCategory: (categoryId: SpendingCategoryId, label: string) => void;
};

export function VaultV2SpendMoneyForm({
  maxAmount,
  categories,
  isPremium,
  onSpend,
  onClose,
  onPremiumCategoriesRequest,
  onAddCustomCategory,
  onRenameCategory,
}: VaultV2SpendMoneyFormProps) {
  const budgetCopy = copyMatrix.dashboard.vault.budget;
  const savingsCopy = copyMatrix.dashboard.vault.savings;
  const { currencySymbol } = useCurrency();

  const [amountInput, setAmountInput] = useState("");
  const [categoryId, setCategoryId] = useState<SpendingCategoryId>(
    categories[0]?.id ?? "other",
  );
  const [manageCategoriesOpen, setManageCategoriesOpen] = useState(false);
  const [newCategoryLabel, setNewCategoryLabel] = useState("");
  const [renameDrafts, setRenameDrafts] = useState<Record<string, string>>({});

  const selectedCategory = categories.find((entry) => entry.id === categoryId) ?? categories[0];

  useEffect(() => {
    if (!categories.some((entry) => entry.id === categoryId)) {
      setCategoryId(categories[0]?.id ?? "other");
    }
  }, [categories, categoryId]);

  function confirmSpend() {
    const amount = parsePositiveVaultAmount(amountInput);
    if (amount === null || amount > maxAmount || !selectedCategory) return;
    onSpend(amount, selectedCategory.label);
    onClose();
  }

  function handleManageCategoriesClick() {
    if (!isPremium) {
      onPremiumCategoriesRequest();
      return;
    }
    setManageCategoriesOpen((open) => !open);
  }

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

  return (
    <VaultV2ActionPanel>
      <VaultV2ActionFieldRow
        amountField={
          <VaultV2AmountField
            currencySymbol={currencySymbol}
            value={amountInput}
            onChange={setAmountInput}
            ariaLabel={budgetCopy.spendAmountLabel}
          />
        }
        secondaryField={
          <div className="flex min-w-0 flex-col justify-center gap-1">
            <VaultV2SelectField
              value={categoryId}
              onChange={(value) => setCategoryId(value as SpendingCategoryId)}
              ariaLabel={budgetCopy.spendCategoryLabel}
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.label}
                </option>
              ))}
            </VaultV2SelectField>
            <button
              type="button"
              onClick={handleManageCategoriesClick}
              className="text-left font-heading text-[10px] font-bold text-[#0CC1E0] hover:underline"
            >
              {budgetCopy.manageSpendingCategories}
            </button>
            {manageCategoriesOpen && isPremium ? (
              <div className="space-y-2 pt-1">
                <p className="font-heading text-xs font-extrabold text-[#031F82]">
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
                        className={cn("min-w-0 flex-1", vaultV2FieldInputClass)}
                      />
                    </li>
                  ))}
                </ul>
                <form onSubmit={handleAddCategory} className="flex min-w-0 gap-1.5">
                  <input
                    value={newCategoryLabel}
                    onChange={(event) => setNewCategoryLabel(event.target.value)}
                    placeholder={budgetCopy.customCategoryPlaceholder}
                    className={cn("min-w-0 flex-1", vaultV2FieldInputClass)}
                  />
                  <button type="submit" className={cn("shrink-0 px-3", orangeCtaClass)}>
                    {budgetCopy.addCategory}
                  </button>
                </form>
              </div>
            ) : null}
          </div>
        }
      />

      <VaultV2ActionButtonRow
        primaryLabel={budgetCopy.spendConfirm}
        secondaryLabel={savingsCopy.spendCancel}
        onPrimary={confirmSpend}
        onSecondary={onClose}
        primaryDisabled={maxAmount <= 0}
      />
    </VaultV2ActionPanel>
  );
}
