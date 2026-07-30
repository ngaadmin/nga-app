"use client";

import { useEffect, useMemo, useState } from "react";
import { VaultV2SaveJarMoveMoneyForm } from "@/components/dashboard/vault-v2/vault-v2-move-money-form";
import { copyMatrix } from "@/constants/copyMatrix";
import { useCurrency } from "@/lib/dashboard/currency-context";
import { roundAudAmount, SAVINGS_JAR_ID } from "@/lib/dashboard/destination-jars";
import type { VaultBucket } from "@/lib/dashboard/vault-buckets";
import type { SavingsGoal } from "@/lib/dashboard/savings-goals";
import {
  buildSaveJarTransferDestinations,
  buildSaveJarTransferSources,
  type VaultTransferLocationId,
} from "@/lib/dashboard/vault-transfer";
import {
  vaultV2ActionLinkActiveClass,
  vaultV2ActionLinkClass,
} from "@/lib/dashboard/vault-v2/vault-v2-action-form-styles";
import { cn } from "@/lib/utils/cn";

export type VaultV2SaveJarExpandedPanelProps = {
  bucket: VaultBucket;
  buckets: VaultBucket[];
  goals: SavingsGoal[];
  totalSavings: number;
  onVaultTransfer: (
    from: VaultTransferLocationId,
    to: VaultTransferLocationId,
    amount: number,
  ) => void;
  onClose: () => void;
};

export function VaultV2SaveJarExpandedPanel({
  bucket,
  buckets,
  goals,
  totalSavings,
  onVaultTransfer,
  onClose,
}: VaultV2SaveJarExpandedPanelProps) {
  const savingsCopy = copyMatrix.dashboard.vault.savings;
  const budgetCopy = copyMatrix.dashboard.vault.budget;
  const { formatMoney } = useCurrency();
  const [moveOpen, setMoveOpen] = useState(false);

  const unassignedBalance = roundAudAmount(Math.max(0, bucket.balance));
  const canMoveFunds =
    unassignedBalance > 0 || goals.some((goal) => goal.balance > 0);

  const sources = useMemo(
    () =>
      buildSaveJarTransferSources(
        unassignedBalance,
        goals,
        savingsCopy.unallocatedSourceLabel,
      ),
    [goals, savingsCopy.unallocatedSourceLabel, unassignedBalance],
  );

  const fundedSources = sources.filter((entry) => entry.balance > 0);

  const [sourceId, setSourceId] = useState<VaultTransferLocationId>(
    fundedSources[0]?.id ?? SAVINGS_JAR_ID,
  );

  const sourceBalance = sources.find((entry) => entry.id === sourceId)?.balance ?? 0;

  const destinations = useMemo(
    () => buildSaveJarTransferDestinations(buckets, sourceId),
    [buckets, sourceId],
  );

  const canMove = fundedSources.length > 0 && destinations.length > 0;

  useEffect(() => {
    if (sources.some((entry) => entry.id === sourceId && entry.balance > 0)) return;
    const nextSource = sources.find((entry) => entry.balance > 0);
    setSourceId(nextSource?.id ?? SAVINGS_JAR_ID);
  }, [sourceId, sources]);

  return (
    <div className="mt-2 rounded-xl border border-[#BDE9FB] bg-white p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="font-heading text-sm font-extrabold text-[#031F82]">
          {bucket.emoji} {savingsCopy.sectionTitle}
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
        {formatMoney(totalSavings)}
      </p>

      {canMoveFunds ? (
        <div className="mt-2 space-y-2 border-t border-[#BDE9FB]/40 pt-2">
          <div className="flex items-center justify-end gap-x-4 gap-y-1">
            <button
              type="button"
              onClick={() => setMoveOpen((open) => !open)}
              disabled={!canMove}
              className={cn(vaultV2ActionLinkClass, moveOpen && vaultV2ActionLinkActiveClass)}
            >
              {savingsCopy.moveMoney}
            </button>
          </div>

          {moveOpen && canMove ? (
            <VaultV2SaveJarMoveMoneyForm
              sources={sources}
              destinations={destinations}
              sourceId={sourceId}
              sourceBalance={sourceBalance}
              onSourceChange={setSourceId}
              onTransfer={onVaultTransfer}
              onClose={() => setMoveOpen(false)}
            />
          ) : null}
        </div>
      ) : (
        <p className="mt-2 font-sans text-[10px] text-[#1E3A5F]/70">{budgetCopy.bucketEmptyHint}</p>
      )}

      <p className="mt-2 font-sans text-xs leading-snug text-[#1E3A5F]/70">
        {savingsCopy.saveJarExpandedHintTemplate.replace(
          "{unallocated}",
          formatMoney(unassignedBalance),
        )}
      </p>
    </div>
  );
}
