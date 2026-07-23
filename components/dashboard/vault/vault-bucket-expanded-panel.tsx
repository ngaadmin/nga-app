"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { ModalShell } from "@/components/ui/modal-shell";
import {
  VaultTransferControls,
  VaultTransferToggle,
  vaultActionLinkActiveClass,
  vaultActionLinkClass,
  vaultActionPanelClass,
  vaultConfirmLinkClass,
  vaultFieldInputClass,
  vaultGhostBtnClass,
} from "@/components/dashboard/vault/vault-transfer-controls";
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

type CategoryManagementProps = {
  isPremium: boolean;
  categories: SpendingCategory[];
  manageOpen: boolean;
  onManageClick: () => void;
  renameDrafts: Record<string, string>;
  onRenameDraftChange: (categoryId: SpendingCategoryId, value: string) => void;
  onRenameBlur: (categoryId: SpendingCategoryId) => void;
  newCategoryLabel: string;
  onNewCategoryLabelChange: (value: string) => void;
  onAddCategory: (event: FormEvent) => void;
};

function SpendingCategoryFields({
  isPremium,
  categories,
  manageOpen,
  onManageClick,
  renameDrafts,
  onRenameDraftChange,
  onRenameBlur,
  newCategoryLabel,
  onNewCategoryLabelChange,
  onAddCategory,
  categoryId,
  onCategoryIdChange,
}: CategoryManagementProps & {
  categoryId: SpendingCategoryId;
  onCategoryIdChange: (id: SpendingCategoryId) => void;
}) {
  const budgetCopy = copyMatrix.dashboard.vault.budget;

  return (
    <div className="space-y-1.5">
      <select
        value={categoryId}
        onChange={(e) => onCategoryIdChange(e.target.value as SpendingCategoryId)}
        aria-label={budgetCopy.spendCategoryLabel}
        className={cn("w-full", vaultFieldInputClass)}
      >
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.label}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={onManageClick}
        className="font-heading text-xs font-bold text-[#0CC1E0] hover:underline"
      >
        {budgetCopy.manageSpendingCategories}
      </button>
      {manageOpen && isPremium ? (
        <div className="space-y-2 pt-1">
          <p className="font-heading text-xs font-extrabold text-[#031F82]">
            {budgetCopy.manageCategoriesHeading}
          </p>
          <ul className="space-y-1.5">
            {categories.map((category) => (
              <li key={category.id} className="flex min-w-0 items-center gap-2">
                <input
                  value={renameDrafts[category.id] ?? category.label}
                  onChange={(e) => onRenameDraftChange(category.id, e.target.value)}
                  onBlur={() => onRenameBlur(category.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") onRenameBlur(category.id);
                  }}
                  aria-label={`Rename ${category.label}`}
                  className={cn("min-w-0 flex-1", vaultFieldInputClass)}
                />
              </li>
            ))}
          </ul>
          <form onSubmit={onAddCategory} className="flex min-w-0 gap-1.5">
            <input
              value={newCategoryLabel}
              onChange={(e) => onNewCategoryLabelChange(e.target.value)}
              placeholder={budgetCopy.customCategoryPlaceholder}
              className={cn("min-w-0 flex-1", vaultFieldInputClass)}
            />
            <button type="submit" className={cn("shrink-0 px-3 py-1.5", orangeCtaClass)}>
              {budgetCopy.addCategory}
            </button>
          </form>
        </div>
      ) : null}
    </div>
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
  categoryManagement,
  onPremiumCategoriesRequest,
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
  categoryManagement: CategoryManagementProps;
  onPremiumCategoriesRequest: () => void;
}) {
  const budgetCopy = copyMatrix.dashboard.vault.budget;
  const savingsCopy = copyMatrix.dashboard.vault.savings;
  const [spendAmount, setSpendAmount] = useState("");
  const [categoryId, setCategoryId] = useState<SpendingCategoryId>(
    categories[0]?.id ?? "other",
  );

  const selectedCategory = categories.find((entry) => entry.id === categoryId) ?? categories[0];
  const canUseFunds = bucket.balance > 0;
  const canTransfer =
    bucket.balance > 0 || transferLocations.some((entry) => entry.balance > 0);

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

  function handleManageCategoriesClick() {
    if (!categoryManagement.isPremium) {
      onPremiumCategoriesRequest();
      return;
    }
    categoryManagement.onManageClick();
  }

  const showActionRow = showSpend || canTransfer;

  return (
    <div className="space-y-2 border-t border-[#BDE9FB]/40 pt-2">
      {showActionRow ? (
        <div className="flex items-center justify-between gap-x-4 gap-y-1">
          {showSpend ? (
            <button
              type="button"
              onClick={onToggleSpend}
              disabled={!canUseFunds}
              className={cn(vaultActionLinkClass, spendOpen && vaultActionLinkActiveClass)}
            >
              {savingsCopy.spendMoney}
            </button>
          ) : (
            <span aria-hidden />
          )}
          {canTransfer ? (
            <VaultTransferToggle
              isOpen={moveOpen}
              disabled={transferLocations.length === 0}
              onToggle={onToggleMove}
            />
          ) : null}
        </div>
      ) : null}

      {showSpend && spendOpen && canUseFunds ? (
        <div className={vaultActionPanelClass}>
          <div className="flex min-w-0 gap-2">
            <input
              type="number"
              min={0}
              step={VAULT_AMOUNT_STEP}
              value={spendAmount}
              onChange={(e) => setSpendAmount(e.target.value)}
              placeholder={budgetCopy.spendAmountLabel}
              aria-label={budgetCopy.spendAmountLabel}
              className={cn("w-24 shrink-0", vaultFieldInputClass)}
            />
            <div className="min-w-0 flex-1">
              <SpendingCategoryFields
                {...categoryManagement}
                categoryId={categoryId}
                onCategoryIdChange={setCategoryId}
                onManageClick={handleManageCategoriesClick}
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button type="button" onClick={confirmSpend} className={vaultConfirmLinkClass}>
              {budgetCopy.spendConfirm}
            </button>
            <button type="button" onClick={onClose} className={vaultGhostBtnClass}>
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
        showToggle={false}
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

  const hasActions =
    showSpend ||
    bucket.balance > 0 ||
    transferLocations.some((entry) => entry.balance > 0);

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

        {hasActions ? (
          <BucketFundsActions
            bucket={bucket}
            categories={spendingCategories}
            transferLocations={transferLocations}
            showSpend={showSpend}
            spendOpen={showSpend && activeAction === "spend"}
            moveOpen={activeAction === "move"}
            onToggleSpend={() => {
              setActiveAction((current) => (current === "spend" ? null : "spend"));
            }}
            onToggleMove={() => {
              setActiveAction((current) => (current === "move" ? null : "move"));
            }}
            onSpend={onMarkSpent}
            onTransfer={onVaultTransfer}
            onClose={() => setActiveAction(null)}
            onPremiumCategoriesRequest={() => setPremiumCategoriesOpen(true)}
            categoryManagement={{
              isPremium,
              categories: spendingCategories,
              manageOpen: manageCategoriesOpen,
              onManageClick: () => setManageCategoriesOpen((open) => !open),
              renameDrafts,
              onRenameDraftChange: (categoryId, value) =>
                setRenameDrafts((current) => ({ ...current, [categoryId]: value })),
              onRenameBlur: handleRenameBlur,
              newCategoryLabel,
              onNewCategoryLabelChange: setNewCategoryLabel,
              onAddCategory: handleAddCategory,
            }}
          />
        ) : (
          <p className="mt-2 font-sans text-[10px] text-[#1E3A5F]/70">{copy.bucketEmptyHint}</p>
        )}
      </div>

      <PremiumCategoriesModal
        isOpen={premiumCategoriesOpen}
        onClose={() => setPremiumCategoriesOpen(false)}
      />
    </>
  );
}
