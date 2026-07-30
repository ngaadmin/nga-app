"use client";

import { useState, type FormEvent } from "react";
import { copyMatrix } from "@/constants/copyMatrix";
import { useCurrency } from "@/lib/dashboard/currency-context";
import { parsePositiveVaultAmount } from "@/lib/dashboard/vault-amount-input";
import {
  DEFAULT_VAULT_INCOME_SOURCE_ID,
  VAULT_INCOME_SOURCES,
  type VaultIncomeSourceId,
} from "@/lib/dashboard/vault-income-sources";
import { vaultV2LightSectionTitleClass } from "@/lib/dashboard/vault-v2/vault-v2-my-money-card-styles";
import { cn } from "@/lib/utils/cn";

const orangeCtaClass =
  "rounded-nga-lg border-b-4 border-[#C88202] bg-[#FFA503] font-heading text-xs font-bold uppercase tracking-wide text-[#031F82] transition-all hover:brightness-[1.02] active:translate-y-[2px] active:border-b-2 disabled:cursor-not-allowed disabled:opacity-40";

type VaultV2DepositSectionProps = {
  onDeposit: (amount: number, source: VaultIncomeSourceId) => void;
};

export function VaultV2DepositSection({ onDeposit }: VaultV2DepositSectionProps) {
  const copy = copyMatrix.dashboard.vault.budget;
  const { currencySymbol } = useCurrency();
  const [depositInput, setDepositInput] = useState("");
  const [incomeSource, setIncomeSource] = useState<VaultIncomeSourceId>(
    DEFAULT_VAULT_INCOME_SOURCE_ID,
  );

  function handleDepositSubmit(event: FormEvent) {
    event.preventDefault();
    const amount = parsePositiveVaultAmount(depositInput);
    if (amount === null) return;
    onDeposit(amount, incomeSource);
    setDepositInput("");
  }

  return (
    <section aria-label="Deposit income" className="border-t border-[#BDE9FB]/40 pt-5">
      <form onSubmit={handleDepositSubmit} className="space-y-3">
        <h2 className={vaultV2LightSectionTitleClass}>
          {copy.depositHeading}
        </h2>
        <div className="grid min-w-0 grid-cols-[minmax(8rem,9.25rem)_minmax(0,1fr)_auto] items-stretch gap-2">
          <label className="flex min-w-0 items-center gap-1.5 rounded-xl border border-[#BDE9FB] bg-white px-2.5 py-3">
            <span className="shrink-0 font-heading text-base font-bold text-[#031F82]">
              {currencySymbol}
            </span>
            <input
              type="text"
              inputMode="decimal"
              value={depositInput}
              onChange={(event) => {
                const next = event.target.value;
                if (next === "" || /^\d*\.?\d*$/.test(next)) {
                  setDepositInput(next);
                }
              }}
              placeholder="0.00"
              aria-label={copy.depositHeading}
              className="min-w-0 flex-1 bg-transparent font-sans text-base text-[#031F82] outline-none"
            />
          </label>
          <select
            value={incomeSource}
            onChange={(event) =>
              setIncomeSource(event.target.value as VaultIncomeSourceId)
            }
            aria-label="Income source"
            className="min-w-0 rounded-xl border border-[#BDE9FB] bg-white px-3 py-3 font-sans text-base text-[#031F82] outline-none focus:border-[#0CC1E0]"
          >
            {VAULT_INCOME_SOURCES.map((source) => (
              <option key={source.id} value={source.id}>
                {source.label}
              </option>
            ))}
          </select>
          <button type="submit" className={cn("shrink-0 px-5 py-3", orangeCtaClass)}>
            Add
          </button>
        </div>
        <p className="font-sans text-xs leading-snug text-[#1E3A5F]/70">
          {copy.depositSectionDisclaimer}
        </p>
      </form>
    </section>
  );
}
