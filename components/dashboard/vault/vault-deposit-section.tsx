"use client";

import { useState, type FormEvent } from "react";
import { ModalShell } from "@/components/ui/modal-shell";
import { copyMatrix } from "@/constants/copyMatrix";
import { useCurrency } from "@/lib/dashboard/currency-context";
import { parsePositiveVaultAmount, sanitizeVaultAmountInput } from "@/lib/dashboard/vault-amount-input";
import {
  DEFAULT_VAULT_INCOME_SOURCE_ID,
  VAULT_INCOME_SOURCES,
  type VaultIncomeSourceId,
} from "@/lib/dashboard/vault-income-sources";
import {
  hasSeenVaultAddMoneyIntro,
  markVaultAddMoneyIntroSeen,
} from "@/lib/dashboard/vault/add-money-intro";
import { vaultCopy } from "@/lib/dashboard/vault/copy";
import { vaultHomeCompactCtaClass } from "@/lib/dashboard/vault/vault-action-form-styles";
import { vaultOverviewSectionTitleClass } from "@/lib/dashboard/vault/vault-my-money-card-styles";
import { cn } from "@/lib/utils/cn";

const orangeCtaClass = vaultHomeCompactCtaClass;

type PendingDeposit = {
  amount: number;
  source: VaultIncomeSourceId;
};

type VaultDepositSectionProps = {
  onDeposit: (amount: number, source: VaultIncomeSourceId) => void;
};

export function VaultDepositSection({ onDeposit }: VaultDepositSectionProps) {
  const copy = copyMatrix.dashboard.vault.budget;
  const { currencySymbol } = useCurrency();
  const [depositInput, setDepositInput] = useState("");
  const [amountCapHit, setAmountCapHit] = useState(false);
  const [incomeSource, setIncomeSource] = useState<VaultIncomeSourceId>(
    DEFAULT_VAULT_INCOME_SOURCE_ID,
  );
  const [introOpen, setIntroOpen] = useState(false);
  const [pendingDeposit, setPendingDeposit] = useState<PendingDeposit | null>(null);

  function closeIntro() {
    const pending = pendingDeposit;
    if (pending) {
      markVaultAddMoneyIntroSeen();
      setPendingDeposit(null);
      setIntroOpen(false);
      onDeposit(pending.amount, pending.source);
      return;
    }
    setIntroOpen(false);
  }

  function handleDepositSubmit(event: FormEvent) {
    event.preventDefault();
    const amount = parsePositiveVaultAmount(depositInput);
    if (amount === null) return;

    if (!hasSeenVaultAddMoneyIntro()) {
      setPendingDeposit({ amount, source: incomeSource });
      setDepositInput("");
      setIntroOpen(true);
      return;
    }

    onDeposit(amount, incomeSource);
    setDepositInput("");
  }

  return (
    <section
      aria-label="Deposit income"
      className="relative isolate w-full min-w-0 max-w-full bg-transparent px-0 py-0 text-[#031F82]"
    >
      <form onSubmit={handleDepositSubmit} className="space-y-3">
        <div className="flex min-w-0 items-center gap-2">
          <h2 className={cn(vaultOverviewSectionTitleClass, "min-w-0 flex-1")}>
            {copy.depositHeading}
          </h2>
          <button
            type="button"
            onClick={() => setIntroOpen(true)}
            aria-label={vaultCopy.addMoneyIntroAriaLabel}
            className="flex size-6 shrink-0 items-center justify-center rounded-full border border-[#0CC1E0] font-heading text-xs font-extrabold text-[#031F82] transition-colors hover:bg-[#F0FBFF]"
          >
            i
          </button>
        </div>
        <div className="flex min-w-0 items-center gap-2">
          <label className="flex h-8 w-[5.75rem] shrink-0 items-center gap-1 rounded-xl border border-[#BDE9FB] bg-white px-2">
            <span className="shrink-0 font-heading text-sm font-bold text-[#031F82]">
              {currencySymbol}
            </span>
            <input
              type="text"
              inputMode="numeric"
              value={depositInput}
              onChange={(event) => {
                const { value: next, hitCap } = sanitizeVaultAmountInput(event.target.value);
                setAmountCapHit(hitCap);
                setDepositInput(next);
              }}
              placeholder="0"
              aria-label={copy.depositHeading}
              className="min-w-0 flex-1 bg-transparent font-sans text-sm text-[#031F82] outline-none"
            />
          </label>
          <select
            value={incomeSource}
            onChange={(event) =>
              setIncomeSource(event.target.value as VaultIncomeSourceId)
            }
            aria-label="Income source"
            className="h-8 min-w-0 flex-1 rounded-xl border border-[#BDE9FB] bg-white px-2 font-sans text-sm text-[#031F82] outline-none focus:border-[#0CC1E0]"
          >
            {VAULT_INCOME_SOURCES.map((source) => (
              <option key={source.id} value={source.id}>
                {source.label}
              </option>
            ))}
          </select>
          <button type="submit" className={cn(orangeCtaClass)}>
            Add
          </button>
        </div>
        {amountCapHit ? (
          <p className="font-sans text-sm text-[#1E3A5F]/70" role="status">
            {vaultCopy.maxAmountReachedNotice}
          </p>
        ) : null}
      </form>

      <ModalShell
        isOpen={introOpen}
        onClose={closeIntro}
        align="center"
        labelledBy="vault-add-money-intro-title"
        describedBy="vault-add-money-intro-body"
        backdropClassName="bg-[#031F82]/50"
        panelClassName="rounded-2xl border-0 bg-white p-5 shadow-md sm:p-6"
      >
        <h2
          id="vault-add-money-intro-title"
          className="font-heading text-xl font-extrabold leading-tight text-[#031F82] sm:text-2xl"
        >
          {vaultCopy.addMoneyIntroTitle}
        </h2>
        <div
          id="vault-add-money-intro-body"
          className="mt-3 space-y-2 font-sans text-sm leading-relaxed text-[#1E3A5F]"
        >
          <p>{vaultCopy.addMoneyIntroSentence1}</p>
          <p>{vaultCopy.addMoneyIntroSentence2}</p>
          <p>{vaultCopy.addMoneyIntroSentence3}</p>
        </div>
        <button
          type="button"
          onClick={closeIntro}
          className="mt-5 inline-flex h-touch min-h-touch w-full items-center justify-center rounded-nga-lg border-b-4 border-[#0288A3] bg-[#0CC1E0] px-6 font-heading text-sm font-bold uppercase tracking-wide text-[#031F82] shadow-md transition-all hover:brightness-[1.02] active:translate-y-[2px] active:border-b-2"
        >
          {vaultCopy.addMoneyIntroGotIt}
        </button>
      </ModalShell>
    </section>
  );
}
