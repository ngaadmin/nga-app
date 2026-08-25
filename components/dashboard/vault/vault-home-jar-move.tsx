"use client";

import { useEffect, useMemo, useState } from "react";
import {
  VaultSaveJarMoveMoneyForm,
  VAULT_SAVE_JAR_MOVE_FORM_ID,
} from "@/components/dashboard/vault/vault-move-money-form";
import { ModalShell } from "@/components/ui/modal-shell";
import { copyMatrix } from "@/constants/copyMatrix";
import { SAVINGS_JAR_ID } from "@/lib/dashboard/destination-jars";
import type { VaultBucket } from "@/lib/dashboard/vault-buckets";
import type { SavingsGoal } from "@/lib/dashboard/savings-goals";
import { vaultCopy } from "@/lib/dashboard/vault/copy";
import {
  buildJarToJarTransferDestinations,
  buildJarToJarTransferSources,
  type VaultTransferLocationId,
} from "@/lib/dashboard/vault-transfer";

type VaultHomeJarMoveProps = {
  buckets: VaultBucket[];
  goals: SavingsGoal[];
  onVaultTransfer: (
    from: VaultTransferLocationId,
    to: VaultTransferLocationId,
    amount: number,
  ) => void;
};

export function VaultHomeJarMove({
  buckets,
  goals,
  onVaultTransfer,
}: VaultHomeJarMoveProps) {
  const budgetCopy = copyMatrix.dashboard.vault.budget;
  const savingsCopy = copyMatrix.dashboard.vault.savings;
  const [moveOpen, setMoveOpen] = useState(false);

  const sources = useMemo(
    () =>
      buildJarToJarTransferSources(
        buckets,
        goals,
        vaultCopy.saveMoveUnassignedLabel,
        vaultCopy.saveMoveGoalLabelTemplate,
      ),
    [buckets, goals],
  );
  const fundedSources = sources.filter((entry) => entry.balance > 0);

  const [sourceId, setSourceId] = useState<VaultTransferLocationId>(
    fundedSources[0]?.id ?? SAVINGS_JAR_ID,
  );

  const sourceBalance = sources.find((entry) => entry.id === sourceId)?.balance ?? 0;

  const destinations = useMemo(
    () =>
      buildJarToJarTransferDestinations(
        buckets,
        goals,
        sourceId,
        vaultCopy.saveMoveUnassignedLabel,
        vaultCopy.saveMoveGoalLabelTemplate,
      ),
    [buckets, goals, sourceId],
  );

  const canMove = fundedSources.length > 0 && destinations.length > 0;

  useEffect(() => {
    if (sources.some((entry) => entry.id === sourceId && entry.balance > 0)) return;
    const nextSource = sources.find((entry) => entry.balance > 0);
    setSourceId(nextSource?.id ?? SAVINGS_JAR_ID);
  }, [sourceId, sources]);

  return (
    <>
      <button
        type="button"
        onClick={() => setMoveOpen(true)}
        disabled={!canMove}
        className="inline-flex h-7 shrink-0 items-center self-start font-heading text-sm font-bold text-[#0CC1E0]/90 hover:text-[#031F82] hover:underline disabled:cursor-not-allowed disabled:opacity-40"
      >
        {savingsCopy.moveMoney}
      </button>

      <ModalShell
        isOpen={moveOpen && canMove}
        onClose={() => setMoveOpen(false)}
        align="center"
        labelledBy="vault-home-jar-move-title"
        backdropClassName="bg-[#031F82]/50"
        panelClassName="flex max-h-[min(92vh,40rem)] max-w-lg flex-col rounded-2xl border-0 bg-white p-0 shadow-md"
      >
        <div className="shrink-0 border-b border-[#BDE9FB]/40 px-5 pb-4 pt-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2
                id="vault-home-jar-move-title"
                className="font-heading text-lg font-extrabold text-[#031F82]"
              >
                {budgetCopy.moveTitle}
              </h2>
              <p className="mt-1 font-sans text-sm leading-snug text-[#1E3A5F]/70">
                {vaultCopy.moveJarHelper}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setMoveOpen(false)}
              aria-label={vaultCopy.closeModalLabel}
              className="shrink-0 rounded-lg px-2 py-1 font-heading text-lg font-bold leading-none text-[#1E3A5F]/60 transition-colors hover:bg-[#BDE9FB]/40 hover:text-[#031F82]"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-3">
          <VaultSaveJarMoveMoneyForm
            sources={fundedSources}
            destinations={destinations}
            sourceId={sourceId}
            sourceBalance={sourceBalance}
            onSourceChange={setSourceId}
            onTransfer={onVaultTransfer}
            onClose={() => setMoveOpen(false)}
          />
        </div>

        <div className="shrink-0 border-t border-[#BDE9FB]/40 bg-white px-5 py-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMoveOpen(false)}
              className="inline-flex h-touch min-h-touch flex-1 items-center justify-center rounded-nga-lg border border-[#BDE9FB] bg-white px-4 font-heading text-sm font-bold text-[#031F82] transition-colors hover:bg-[#F0FBFF] active:bg-[#FAFDFF]"
            >
              {vaultCopy.cancelChanges}
            </button>
            <button
              type="submit"
              form={VAULT_SAVE_JAR_MOVE_FORM_ID}
              disabled={sourceBalance <= 0}
              className="inline-flex h-touch min-h-touch flex-1 items-center justify-center rounded-nga-lg border-b-4 border-[#C88202] bg-[#FFA503] px-4 font-heading text-sm font-bold text-[#031F82] transition-all hover:brightness-[1.02] active:translate-y-[2px] active:border-b-2 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {savingsCopy.moveConfirm}
            </button>
          </div>
        </div>
      </ModalShell>
    </>
  );
}
