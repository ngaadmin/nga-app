"use client";

import { useState } from "react";
import { PremiumUpgradeModal } from "@/components/dashboard/premium-upgrade-modal";
import {
  VaultSpendMoneyForm,
  VaultSpendingCategoryAdmin,
} from "@/components/dashboard/vault/vault-spend-money-form";
import { ModalShell } from "@/components/ui/modal-shell";
import { copyMatrix } from "@/constants/copyMatrix";
import { useCurrency } from "@/lib/dashboard/currency-context";
import { SettingsIcon } from "@/lib/dashboard/icons";
import {
  canMarkBucketAsSpent,
  type VaultBucket,
  type VaultBucketId,
} from "@/lib/dashboard/vault-buckets";
import type {
  SpendingCategory,
  SpendingCategoryId,
} from "@/lib/dashboard/spending-categories";
import { vaultBucketDisplayName } from "@/lib/dashboard/vault/bucket-display-name";
import { vaultCopy } from "@/lib/dashboard/vault/copy";
import {
  vaultCardBalanceClass,
  vaultCardMainTitleClass,
  vaultManageJarsButtonClass,
} from "@/lib/dashboard/vault/vault-my-money-card-styles";
import { vaultHomeCompactCtaAutoClass } from "@/lib/dashboard/vault/vault-action-form-styles";
import { cn } from "@/lib/utils/cn";

const destructiveCtaClass =
  "rounded-nga-lg border-b-4 border-[#9F1239] bg-[#BE123C] font-heading text-sm font-bold text-white transition-all hover:brightness-[1.02] active:translate-y-[2px] active:border-b-2 disabled:cursor-not-allowed disabled:opacity-40";

const resetLinkClass =
  "font-heading text-sm font-bold text-[#BE123C]/80 underline-offset-2 transition-colors hover:text-[#BE123C] hover:underline disabled:cursor-not-allowed disabled:opacity-40";

function primaryUseLabel(bucket: VaultBucket): string {
  if (bucket.foundationRole === "spend") return vaultCopy.iSpentThis;
  if (bucket.foundationRole === "give") return vaultCopy.iGaveThis;
  return vaultCopy.iUsedThis;
}

function moneyOutSheetCopy(bucket: VaultBucket, displayName: string): {
  title: string;
  helper: string;
} {
  if (bucket.foundationRole === "spend") {
    return {
      title: vaultCopy.recordSpendingTitle,
      helper: vaultCopy.recordSpendingHelper,
    };
  }
  if (bucket.foundationRole === "give") {
    return {
      title: vaultCopy.recordGiftTitle,
      helper: vaultCopy.recordGiftHelper,
    };
  }
  return {
    title: vaultCopy.recordMoneyOutTitle,
    helper: vaultCopy.recordMoneyOutHelperTemplate.replace("{name}", displayName),
  };
}

export type VaultBucketExpandedPanelProps = {
  bucket: VaultBucket;
  isPremium: boolean;
  spendingCategories: SpendingCategory[];
  onMarkSpent: (amount: number, categoryLabel: string) => void;
  onAddCustomCategory: (label: string) => void;
  onRenameCategory: (categoryId: SpendingCategoryId, label: string) => void;
  onResetBucketBalance: (bucketId: VaultBucketId) => void;
  onClose: () => void;
};

export function VaultBucketExpandedPanel({
  bucket,
  isPremium,
  spendingCategories,
  onMarkSpent,
  onAddCustomCategory,
  onRenameCategory,
  onResetBucketBalance,
  onClose,
}: VaultBucketExpandedPanelProps) {
  const copy = copyMatrix.dashboard.vault.budget;
  const { formatWholeMoney: formatMoney } = useCurrency();

  const [spendOpen, setSpendOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [premiumCategoriesOpen, setPremiumCategoriesOpen] = useState(false);

  const displayName = vaultBucketDisplayName(bucket);
  const useLabel = primaryUseLabel(bucket);
  const moneyOutCopy = moneyOutSheetCopy(bucket, displayName);
  const showSpend = canMarkBucketAsSpent(bucket);
  const canUseFunds = bucket.balance > 0;

  return (
    <>
      <div className="mt-2 space-y-3">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-1 font-heading text-sm font-bold text-[#0CC1E0]/90 hover:text-[#031F82] hover:underline"
        >
          <span aria-hidden>←</span>
          {vaultCopy.backToOverview}
        </button>

        <div className="flex min-w-0 items-start gap-2">
          <p className={cn(vaultCardMainTitleClass, "min-w-0 shrink pt-0.5")}>
            {displayName}
          </p>
          <div className="ml-auto min-w-0 text-right">
            <p className={cn(vaultCardBalanceClass, "min-w-0")}>
              {formatMoney(bucket.balance)}
            </p>
            <p className="mt-0.5 font-heading text-xs font-bold leading-tight text-[#1E3A5F]/55">
              {vaultCopy.jarTotalCaptionTemplate.replace("{name}", displayName)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            aria-label={vaultCopy.jarSettingsLabel}
            className={vaultManageJarsButtonClass}
          >
            <SettingsIcon className="size-5 shrink-0 text-[#031F82]" />
          </button>
        </div>

        {showSpend ? (
          <button
            type="button"
            onClick={() => setSpendOpen(true)}
            disabled={!canUseFunds}
            className={vaultHomeCompactCtaAutoClass}
          >
            {useLabel}
          </button>
        ) : null}

        {!canUseFunds ? (
          <p className="font-sans text-sm text-[#1E3A5F]/70">{copy.bucketEmptyHint}</p>
        ) : null}
      </div>

      <ModalShell
        isOpen={spendOpen && showSpend && canUseFunds}
        onClose={() => setSpendOpen(false)}
        align="center"
        labelledBy="vault-bucket-spend-title"
        backdropClassName="bg-[#031F82]/50"
        panelClassName="flex max-h-[min(92vh,40rem)] max-w-lg flex-col rounded-2xl border-0 bg-white p-0 shadow-md"
      >
        <div className="shrink-0 border-b border-[#BDE9FB]/40 px-5 pb-4 pt-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2
                id="vault-bucket-spend-title"
                className="font-heading text-lg font-extrabold text-[#031F82]"
              >
                {moneyOutCopy.title}
              </h2>
              <p className="mt-1 font-sans text-sm leading-snug text-[#1E3A5F]/70">
                {moneyOutCopy.helper}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSpendOpen(false)}
              aria-label={vaultCopy.closeModalLabel}
              className="shrink-0 rounded-lg px-2 py-1 font-heading text-lg font-bold leading-none text-[#1E3A5F]/60 transition-colors hover:bg-[#BDE9FB]/40 hover:text-[#031F82]"
            >
              ✕
            </button>
          </div>
        </div>

        <VaultSpendMoneyForm
          maxAmount={bucket.balance}
          categories={spendingCategories}
          isPremium={isPremium}
          onSpend={onMarkSpent}
          onAddCustomCategory={onAddCustomCategory}
          onClose={() => setSpendOpen(false)}
        />
      </ModalShell>

      <ModalShell
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        align="center"
        labelledBy="vault-jar-settings-title"
        backdropClassName="bg-[#031F82]/50"
        panelClassName="flex max-h-[min(92vh,40rem)] max-w-lg flex-col rounded-2xl border-0 bg-white p-0 shadow-md"
      >
        <div className="shrink-0 border-b border-[#BDE9FB]/40 px-5 pb-4 pt-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2
                id="vault-jar-settings-title"
                className="font-heading text-lg font-extrabold text-[#031F82]"
              >
                {vaultCopy.jarSettingsTitleTemplate.replace("{name}", displayName)}
              </h2>
              <p className="mt-1 font-sans text-sm leading-snug text-[#1E3A5F]/70">
                {vaultCopy.jarSettingsBody}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSettingsOpen(false)}
              aria-label={vaultCopy.closeModalLabel}
              className="shrink-0 rounded-lg px-2 py-1 font-heading text-lg font-bold leading-none text-[#1E3A5F]/60 transition-colors hover:bg-[#BDE9FB]/40 hover:text-[#031F82]"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-3">
          {showSpend ? (
            <VaultSpendingCategoryAdmin
              categories={spendingCategories}
              isPremium={isPremium}
              onPremiumCategoriesRequest={() => setPremiumCategoriesOpen(true)}
              onAddCustomCategory={onAddCustomCategory}
              onRenameCategory={onRenameCategory}
            />
          ) : null}
          <button
            type="button"
            onClick={() => setConfirmReset(true)}
            disabled={bucket.balance <= 0}
            className={resetLinkClass}
          >
            {vaultCopy.resetBucketBalance}
          </button>
        </div>

        <div className="shrink-0 border-t border-[#BDE9FB]/40 bg-white px-5 py-4">
          <button
            type="button"
            onClick={() => setSettingsOpen(false)}
            className="inline-flex h-touch min-h-touch w-full items-center justify-center rounded-nga-lg border border-[#BDE9FB] bg-white px-4 font-heading text-sm font-bold text-[#031F82] transition-colors hover:bg-[#F0FBFF] active:bg-[#FAFDFF]"
          >
            {vaultCopy.doneEditing}
          </button>
        </div>
      </ModalShell>

      <ModalShell
        isOpen={confirmReset}
        onClose={() => setConfirmReset(false)}
        align="center"
        labelledBy="vault-jar-panel-reset-title"
        backdropClassName="bg-[#031F82]/55"
        panelClassName="max-w-sm rounded-2xl border-0 bg-white p-5 shadow-md"
      >
        <h2
          id="vault-jar-panel-reset-title"
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
            onClick={() => setConfirmReset(false)}
            className="flex-1 py-2 font-heading text-sm font-bold text-[#0CC1E0]"
          >
            {vaultCopy.resetCancel}
          </button>
          <button
            type="button"
            onClick={() => {
              onResetBucketBalance(bucket.id);
              setConfirmReset(false);
            }}
            className={cn("flex-1 px-3 py-2", destructiveCtaClass)}
          >
            {vaultCopy.resetConfirm}
          </button>
        </div>
      </ModalShell>

      <PremiumUpgradeModal
        isOpen={premiumCategoriesOpen}
        onClose={() => setPremiumCategoriesOpen(false)}
        titleId="vault-premium-categories-title"
      />
    </>
  );
}
