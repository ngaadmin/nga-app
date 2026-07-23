"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { ModalShell } from "@/components/ui/modal-shell";
import { VaultTransferControls } from "@/components/dashboard/vault/vault-transfer-controls";
import { copyMatrix } from "@/constants/copyMatrix";
import { useCurrency } from "@/lib/dashboard/currency-context";
import {
  parsePositiveVaultAmount,
  VAULT_AMOUNT_STEP,
} from "@/lib/dashboard/vault-amount-input";
import {
  canMarkBucketAsSpent,
  type VaultBucket,
} from "@/lib/dashboard/vault-buckets";
import type {
  SpendingCategory,
  SpendingCategoryId,
} from "@/lib/dashboard/spending-categories";
import type { SavingsGoal } from "@/lib/dashboard/savings-goals";
import {
  buildVaultTransferLocations,
  type VaultTransferLocationId,
} from "@/lib/dashboard/vault-transfer";
import { cn } from "@/lib/utils/cn";

const orangeCtaClass =
  "rounded-nga-lg border-b-4 border-[#C88202] bg-[#FFA503] font-heading text-xs font-bold uppercase tracking-wide text-[#031F82] disabled:opacity-40";
const ghostBtnClass =
  "rounded-lg px-3 py-1.5 font-heading text-sm font-bold text-[#031F82] transition-colors hover:bg-[#F0FBFF] active:bg-[#F0FBFF]";
const linkBtnClass =
  "font-heading text-xs font-bold text-[#0CC1E0] hover:underline disabled:cursor-not-allowed disabled:opacity-40";
const actionLinkActiveClass = "text-[#031F82] underline decoration-[#0CC1E0]";
const spendConfirmBtnClass =
  "font-heading text-sm font-bold text-[#BE123C] hover:underline disabled:cursor-not-allowed disabled:opacity-40";

type BucketActionMode = "spend" | "move";

function PremiumCategoriesModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const copy = copyMatrix.dashboard.vault.budget;
  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      labelledBy="premium-categories-title"
      backdropClassName="bg-[#031F82]/45"
      panelClassName="max-w-sm rounded-nga-xl bg-white p-5"
    >
      <h2 id="premium-categories-title" className="font-heading text-lg font-extrabold text-[#031F82]">
        {copy.premiumCategoriesTitle}
      </h2>
      <p className="mt-2 text-sm text-[#1E3A5F]">{copy.premiumCategoriesBody}</p>
      <button type="button" className={cn("mt-4 h-touch w-full", orangeCtaClass)}>
        {copy.premiumUnlock}
      </button>
      <button
        type="button"
        onClick={onClose}
        className="mt-2 w-full py-2 text-sm font-bold text-[#0CC1E0]"
      >
        {copy.premiumLater}
      </button>
    </ModalShell>
  );
}

function BucketFundsActions({
  bucket,
  categories,
  transferLocations,
  showSpend,
  spendOpen,
  moveOpen,
  onToggleSpend,
  onToggleMove,
  onSpend,
  onTransfer,
  onClose,
}: {
  bucket: VaultBucket;
  categories: SpendingCategory[];
  transferLocations: ReturnType<typeof buildVaultTransferLocations>;
  showSpend: boolean;
  spendOpen: boolean;
  moveOpen: boolean;
  onToggleSpend: () => void;
  onToggleMove: () => void;
  onSpend: (amount: number, categoryLabel: string) => void;
  onTransfer: (
    from: VaultTransferLocationId,
    to: VaultTransferLocationId,
    amount: number,
  ) => void;
  onClose: () => void;
}) {
  const budgetCopy = copyMatrix.dashboard.vault.budget;
  const savingsCopy = copyMatrix.dashboard.vault.savings;
  const [spendAmount, setSpendAmount] = useState("");
  const [categoryId, setCategoryId] = useState<SpendingCategoryId>(
    categories[0]?.id ?? "other",
  );

  const selectedCategory = categories.find((entry) => entry.id === categoryId) ?? categories[0];

  useEffect(() => {
    if (!spendOpen) setSpendAmount("");
  }, [spendOpen]);

  useEffect(() => {
    if (!categories.some((entry) => entry.id === categoryId)) {
      setCategoryId(categories[0]?.id ?? "other");
    }
  }, [categories, categoryId]);

  function confirmSpend() {
    const amount = parsePositiveVaultAmount(spendAmount);
    if (amount === null || amount > bucket.balance || !selectedCategory) return;
    onSpend(amount, selectedCategory.label);
    onClose();
  }

  const canUseFunds = bucket.balance > 0;

  return (
    <div className="space-y-2 border-t border-[#BDE9FB]/40 pt-2">
      {showSpend ? (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <button
            type="button"
            onClick={onToggleSpend}
            disabled={!canUseFunds}
            className={cn(linkBtnClass, spendOpen && actionLinkActiveClass)}
          >
            {savingsCopy.spendMoney}
          </button>
        </div>
      ) : null}

      {showSpend && spendOpen && canUseFunds ? (
        <div className="space-y-2 rounded-lg bg-[#FAFDFF]/80 py-2">
          <div className="flex min-w-0 flex-col gap-2 sm:flex-row">
            <input
              type="number"
              min={0}
              step={VAULT_AMOUNT_STEP}
              value={spendAmount}
              onChange={(e) => setSpendAmount(e.target.value)}
              placeholder={budgetCopy.spendAmountLabel}
              aria-label={budgetCopy.spendAmountLabel}
              className="w-full shrink-0 rounded-lg border border-[#BDE9FB] bg-white px-2 py-1.5 text-sm outline-none focus:border-[#0CC1E0] sm:w-24"
            />
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value as SpendingCategoryId)}
              aria-label={budgetCopy.spendCategoryLabel}
              className="min-w-0 flex-1 rounded-lg border border-[#BDE9FB] bg-white px-2 py-1.5 text-sm outline-none focus:border-[#0CC1E0]"
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-3">
            <button type="button" onClick={confirmSpend} className={spendConfirmBtnClass}>
              {budgetCopy.spendConfirm}
            </button>
            <button type="button" onClick={onClose} className={ghostBtnClass}>
              {savingsCopy.spendCancel}
            </button>
          </div>
        </div>
      ) : null}

      <VaultTransferControls
        contextId={bucket.id}
        contextLabel={bucket.name}
        contextBalance={bucket.balance}
        locations={transferLocations}
        isOpen={moveOpen}
        onToggle={onToggleMove}
        onTransfer={onTransfer}
        onClose={onClose}
      />

      {!canUseFunds && showSpend && spendOpen ? (
        <p className="font-sans text-[10px] text-[#1E3A5F]/70">{budgetCopy.bucketEmptyHint}</p>
      ) : null}
    </div>
  );
}

export type BucketExpandedPanelProps = {
  bucket: VaultBucket;
  buckets: VaultBucket[];
  goals: SavingsGoal[];
  moneyToAllocate: number;
  poolLabel: string;
  isPremium: boolean;
  spendingCategories: SpendingCategory[];
  onMarkSpent: (amount: number, categoryLabel: string) => void;
  onVaultTransfer: (
    from: VaultTransferLocationId,
    to: VaultTransferLocationId,
    amount: number,
  ) => void;
  onAddCustomCategory: (label: string) => void;
  onRenameCategory: (categoryId: SpendingCategoryId, label: string) => void;
  onClose: () => void;
};

export function BucketExpandedPanel({
  bucket,
  buckets,
  goals,
  moneyToAllocate,
  poolLabel,
  isPremium,
  spendingCategories,
  onMarkSpent,
  onVaultTransfer,
  onAddCustomCategory,
  onRenameCategory,
  onClose,
}: BucketExpandedPanelProps) {
  const copy = copyMatrix.dashboard.vault.budget;
  const { formatMoney } = useCurrency();

  const [activeAction, setActiveAction] = useState<BucketActionMode | null>(null);
  const [premiumCategoriesOpen, setPremiumCategoriesOpen] = useState(false);
  const [manageCategoriesOpen, setManageCategoriesOpen] = useState(false);
  const [newCategoryLabel, setNewCategoryLabel] = useState("");
  const [renameDrafts, setRenameDrafts] = useState<Record<string, string>>({});

  const showSpend = canMarkBucketAsSpent(bucket);

  const transferLocations = useMemo(
    () =>
      buildVaultTransferLocations(
        buckets,
        goals,
        moneyToAllocate,
        poolLabel,
        bucket.id,
      ),
    [bucket.id, buckets, goals, moneyToAllocate, poolLabel],
  );

  function handleManageCategoriesClick() {
    if (!isPremium) {
      setPremiumCategoriesOpen(true);
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

  function handleRenameBlur(categoryId: SpendingCategoryId) {
    const draft = renameDrafts[categoryId]?.trim();
    if (!draft) return;
    const current = spendingCategories.find((entry) => entry.id === categoryId);
    if (current && draft !== current.label) {
      onRenameCategory(categoryId, draft);
    }
  }

  return (
    <>
      <div className="mt-2 rounded-xl border border-[#BDE9FB] bg-white p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="font-heading text-sm font-extrabold text-[#031F82]">
            {bucket.emoji} {bucket.name}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="font-heading text-xs font-bold text-[#1E3A5F]/60 hover:text-[#031F82]"
          >
            Close
          </button>
        </div>

        <p className="mt-2 font-heading text-lg font-extrabold leading-tight text-[#031F82]">
          {formatMoney(bucket.balance)}
        </p>

        {showSpend || bucket.balance > 0 || transferLocations.some((entry) => entry.balance > 0) ? (
          <BucketFundsActions
            bucket={bucket}
            categories={spendingCategories}
            transferLocations={transferLocations}
            showSpend={showSpend}
            spendOpen={showSpend && activeAction === "spend"}
            moveOpen={activeAction === "move"}
            onToggleSpend={() => {
              if (!showSpend) return;
              setActiveAction((current) =>
                current === "spend" ? null : "spend",
              );
            }}
            onToggleMove={() => {
              setActiveAction((current) => (current === "move" ? null : "move"));
            }}
            onSpend={onMarkSpent}
            onTransfer={onVaultTransfer}
            onClose={() => setActiveAction(null)}
          />
        ) : (
          <p className="mt-2 font-sans text-[10px] text-[#1E3A5F]/70">{copy.bucketEmptyHint}</p>
        )}

        {showSpend ? (
          <>
            {manageCategoriesOpen && isPremium ? (
              <div className="mt-3 space-y-2 border-t border-[#BDE9FB]/50 pt-2">
                <p className="font-heading text-xs font-extrabold text-[#031F82]">
                  {copy.manageCategoriesHeading}
                </p>
                <ul className="space-y-1.5">
                  {spendingCategories.map((category) => (
                    <li key={category.id} className="flex min-w-0 items-center gap-2">
                      <input
                        value={renameDrafts[category.id] ?? category.label}
                        onChange={(e) =>
                          setRenameDrafts((current) => ({
                            ...current,
                            [category.id]: e.target.value,
                          }))
                        }
                        onBlur={() => handleRenameBlur(category.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleRenameBlur(category.id);
                        }}
                        aria-label={`Rename ${category.label}`}
                        className="min-w-0 flex-1 rounded-lg border border-[#BDE9FB] px-2 py-1.5 text-sm outline-none focus:border-[#0CC1E0]"
                      />
                    </li>
                  ))}
                </ul>
                <form onSubmit={handleAddCategory} className="flex min-w-0 gap-1.5">
                  <input
                    value={newCategoryLabel}
                    onChange={(e) => setNewCategoryLabel(e.target.value)}
                    placeholder={copy.customCategoryPlaceholder}
                    className="min-w-0 flex-1 rounded-lg border border-[#BDE9FB] px-2 py-1.5 text-sm outline-none focus:border-[#0CC1E0]"
                  />
                  <button type="submit" className={cn("shrink-0 px-3 py-1.5", orangeCtaClass)}>
                    {copy.addCategory}
                  </button>
                </form>
              </div>
            ) : null}

            <button
              type="button"
              onClick={handleManageCategoriesClick}
              className="mt-3 font-heading text-xs font-bold text-[#0CC1E0] hover:underline"
            >
              {copy.manageSpendingCategories}
            </button>
          </>
        ) : null}
      </div>

      <PremiumCategoriesModal
        isOpen={premiumCategoriesOpen}
        onClose={() => setPremiumCategoriesOpen(false)}
      />
    </>
  );
}
