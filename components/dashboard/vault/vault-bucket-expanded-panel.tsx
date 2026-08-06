"use client";

import { useMemo, useState } from "react";
import { ModalShell } from "@/components/ui/modal-shell";
import { VaultMoveMoneyForm } from "@/components/dashboard/vault/vault-move-money-form";
import { VaultSpendMoneyForm } from "@/components/dashboard/vault/vault-spend-money-form";
import { copyMatrix } from "@/constants/copyMatrix";
import { useCurrency } from "@/lib/dashboard/currency-context";
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
import { vaultCopy } from "@/lib/dashboard/vault/copy";
import {
  vaultActionLinkActiveClass,
  vaultActionLinkClass,
  vaultActionLinkSeparatorClass,
  vaultActionResetLinkClass,
} from "@/lib/dashboard/vault/vault-action-form-styles";
import { cn } from "@/lib/utils/cn";

const orangeCtaClass =
  "rounded-nga-lg border-b-4 border-[#C88202] bg-[#FFA503] font-heading text-xs font-bold uppercase tracking-wide text-[#031F82] disabled:opacity-40";

const destructiveCtaClass =
  "rounded-nga-lg border-b-4 border-[#9F1239] bg-[#BE123C] font-heading text-sm font-bold text-white transition-all hover:brightness-[1.02] active:translate-y-[2px] active:border-b-2 disabled:cursor-not-allowed disabled:opacity-40";

type BucketActionMode = "spend" | "move";

function PremiumCategoriesModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const copy = copyMatrix.dashboard.vault.budget;
  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      labelledBy="vault-premium-categories-title"
      backdropClassName="bg-[#031F82]/45"
      panelClassName="max-w-sm rounded-nga-xl bg-white p-5"
    >
      <h2
        id="vault-premium-categories-title"
        className="font-heading text-lg font-extrabold text-[#031F82]"
      >
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

export type VaultBucketExpandedPanelProps = {
  bucket: VaultBucket;
  buckets: VaultBucket[];
  goals: SavingsGoal[];
  isPremium: boolean;
  spendingCategories: SpendingCategory[];
  onMarkSpent: (amount: number, categoryLabel: string) => void;
  onVaultTransfer: (
    from: VaultTransferLocationId,
    to: VaultTransferLocationId,
    amount: number,
  ) => void;
  onResetBucketBalance: () => void;
  onAddCustomCategory: (label: string) => void;
  onRenameCategory: (categoryId: SpendingCategoryId, label: string) => void;
  onClose: () => void;
};

export function VaultBucketExpandedPanel({
  bucket,
  buckets,
  goals,
  isPremium,
  spendingCategories,
  onMarkSpent,
  onVaultTransfer,
  onResetBucketBalance,
  onAddCustomCategory,
  onRenameCategory,
  onClose,
}: VaultBucketExpandedPanelProps) {
  const copy = copyMatrix.dashboard.vault.budget;
  const savingsCopy = copyMatrix.dashboard.vault.savings;
  const { formatWholeMoney: formatMoney } = useCurrency();

  const [activeAction, setActiveAction] = useState<BucketActionMode | null>(null);
  const [premiumCategoriesOpen, setPremiumCategoriesOpen] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  const showSpend = canMarkBucketAsSpent(bucket);
  const transferLocations = useMemo(
    () => buildVaultTransferLocations(buckets, goals, bucket.id),
    [bucket.id, buckets, goals],
  );

  const canUseFunds = bucket.balance > 0;
  const canMoveOut = bucket.balance > 0 && transferLocations.length > 0;
  const canReset = bucket.balance > 0;
  const hasActions = showSpend || canMoveOut || canReset;
  const spendOpen = showSpend && activeAction === "spend";
  const moveOpen = activeAction === "move";

  return (
    <>
      <div className="mt-2 rounded-xl border border-[#BDE9FB] bg-white p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="min-w-0 font-heading text-sm font-extrabold text-[#031F82]">
            {bucket.emoji} {bucket.name}
          </p>
          <div className="flex shrink-0 items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1 font-heading text-[11px] font-bold text-[#0CC1E0]/90 hover:text-[#031F82] hover:underline"
            >
              <span aria-hidden>←</span>
              {vaultCopy.backToOverview}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="font-heading text-xs font-bold text-[#1E3A5F]/60 hover:text-[#031F82]"
            >
              Close
            </button>
          </div>
        </div>

        <p className="mt-2 font-heading text-lg font-extrabold leading-tight text-[#031F82]">
          {formatMoney(bucket.balance)}
        </p>

        {hasActions ? (
          <div className="mt-2 space-y-2 border-t border-[#BDE9FB]/40 pt-2">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              {showSpend ? (
                <button
                  type="button"
                  onClick={() =>
                    setActiveAction((current) => (current === "spend" ? null : "spend"))
                  }
                  disabled={!canUseFunds}
                  className={cn(vaultActionLinkClass, spendOpen && vaultActionLinkActiveClass)}
                >
                  {savingsCopy.spendMoney}
                </button>
              ) : null}
              {showSpend && canMoveOut ? (
                <span className={vaultActionLinkSeparatorClass} aria-hidden>
                  |
                </span>
              ) : null}
              {canMoveOut ? (
                <button
                  type="button"
                  onClick={() =>
                    setActiveAction((current) => (current === "move" ? null : "move"))
                  }
                  disabled={!canMoveOut}
                  className={cn(vaultActionLinkClass, moveOpen && vaultActionLinkActiveClass)}
                >
                  {savingsCopy.moveMoney}
                </button>
              ) : null}
              {(showSpend || canMoveOut) && canReset ? (
                <span className={vaultActionLinkSeparatorClass} aria-hidden>
                  |
                </span>
              ) : null}
              {canReset ? (
                <button
                  type="button"
                  onClick={() => setResetConfirmOpen(true)}
                  className={vaultActionResetLinkClass}
                >
                  {vaultCopy.resetBalanceToZero}
                </button>
              ) : null}
            </div>

            {spendOpen && canUseFunds ? (
              <VaultSpendMoneyForm
                maxAmount={bucket.balance}
                categories={spendingCategories}
                isPremium={isPremium}
                onSpend={onMarkSpent}
                onClose={() => setActiveAction(null)}
                onPremiumCategoriesRequest={() => setPremiumCategoriesOpen(true)}
                onAddCustomCategory={onAddCustomCategory}
                onRenameCategory={onRenameCategory}
              />
            ) : null}

            {moveOpen && canMoveOut ? (
              <VaultMoveMoneyForm
                contextId={bucket.id}
                contextBalance={bucket.balance}
                locations={transferLocations}
                onTransfer={onVaultTransfer}
                onClose={() => setActiveAction(null)}
              />
            ) : null}

            {!canUseFunds && spendOpen ? (
              <p className="font-sans text-[10px] text-[#1E3A5F]/70">{copy.bucketEmptyHint}</p>
            ) : null}
          </div>
        ) : (
          <p className="mt-2 font-sans text-[10px] text-[#1E3A5F]/70">{copy.bucketEmptyHint}</p>
        )}
      </div>

      <PremiumCategoriesModal
        isOpen={premiumCategoriesOpen}
        onClose={() => setPremiumCategoriesOpen(false)}
      />

      <ModalShell
        isOpen={resetConfirmOpen}
        onClose={() => setResetConfirmOpen(false)}
        align="center"
        labelledBy="vault-reset-jar-balance-title"
        backdropClassName="bg-[#031F82]/55"
        panelClassName="max-w-sm rounded-2xl border-0 bg-white p-5 shadow-md"
      >
        <h2
          id="vault-reset-jar-balance-title"
          className="font-heading text-lg font-extrabold text-[#031F82]"
        >
          {vaultCopy.resetBucketBalanceConfirmTitle}
        </h2>
        <p className="mt-2 font-sans text-sm leading-snug text-[#1E3A5F]">
          {vaultCopy.resetBucketBalanceConfirmBody}
        </p>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => setResetConfirmOpen(false)}
            className="flex-1 py-2 font-heading text-sm font-bold text-[#0CC1E0]"
          >
            {vaultCopy.resetCancel}
          </button>
          <button
            type="button"
            onClick={() => {
              onResetBucketBalance();
              setResetConfirmOpen(false);
            }}
            className={cn("flex-1 px-3 py-2", destructiveCtaClass)}
          >
            {vaultCopy.resetConfirm}
          </button>
        </div>
      </ModalShell>
    </>
  );
}
