"use client";

import { useState } from "react";
import { PremiumUpgradeModal } from "@/components/dashboard/premium-upgrade-modal";
import {
  BucketEmojiIcon,
  bucketTheme,
} from "@/components/dashboard/vault/vault-visuals";
import { VaultSpendMoneyForm } from "@/components/dashboard/vault/vault-spend-money-form";
import { ModalShell } from "@/components/ui/modal-shell";
import { copyMatrix } from "@/constants/copyMatrix";
import { useCurrency } from "@/lib/dashboard/currency-context";
import { canMarkBucketAsSpent, type VaultBucket } from "@/lib/dashboard/vault-buckets";
import { moneyOutWhatForKind } from "@/lib/dashboard/vault-what-for";
import type { SpendingCategory } from "@/lib/dashboard/spending-categories";
import { vaultBucketDisplayName } from "@/lib/dashboard/vault/bucket-display-name";
import { vaultCopy } from "@/lib/dashboard/vault/copy";
import { vaultHomeCompactCtaAutoClass } from "@/lib/dashboard/vault/vault-action-form-styles";

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
  spendingCategories: SpendingCategory[];
  onMarkSpent: (amount: number, categoryLabel: string) => void;
  onClose: () => void;
};

export function VaultBucketExpandedPanel({
  bucket,
  spendingCategories,
  onMarkSpent,
}: VaultBucketExpandedPanelProps) {
  const copy = copyMatrix.dashboard.vault.budget;
  const { formatMoney } = useCurrency();

  const [spendOpen, setSpendOpen] = useState(false);
  const [premiumCategoriesOpen, setPremiumCategoriesOpen] = useState(false);

  const displayName = vaultBucketDisplayName(bucket);
  const useLabel = primaryUseLabel(bucket);
  const moneyOutCopy = moneyOutSheetCopy(bucket, displayName);
  const showSpend = canMarkBucketAsSpent(bucket);
  const canUseFunds = bucket.balance > 0;

  return (
    <>
      <div className="space-y-3">
        <div className="flex min-w-0 items-center gap-2">
          <BucketEmojiIcon
            size="sm"
            emoji={bucket.emoji}
            theme={bucketTheme(bucket)}
          />
          <h2 className="min-w-0 truncate font-heading text-lg font-extrabold text-[#031F82]">
            {displayName}
          </h2>
        </div>

        <div>
          <p className="font-heading text-3xl font-extrabold leading-none tabular-nums text-[#031F82]">
            {formatMoney(bucket.balance)}
          </p>
          <p className="mt-1 font-heading text-xs font-bold leading-tight text-[#1E3A5F]/55">
            {vaultCopy.jarTotalCaptionTemplate.replace("{name}", displayName)}
          </p>
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
        layer="toast"
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
          whatForKind={moneyOutWhatForKind(bucket.foundationRole) ?? "spend"}
          onSpend={onMarkSpent}
          onPremiumCustomRequest={() => setPremiumCategoriesOpen(true)}
          onClose={() => setSpendOpen(false)}
        />
      </ModalShell>

      <PremiumUpgradeModal
        isOpen={premiumCategoriesOpen}
        onClose={() => setPremiumCategoriesOpen(false)}
        titleId="vault-premium-categories-title"
        layer="toast"
      />
    </>
  );
}
