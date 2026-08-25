"use client";

import { useState, type FormEvent } from "react";
import { copyMatrix } from "@/constants/copyMatrix";
import { useCurrency } from "@/lib/dashboard/currency-context";
import { parsePositiveVaultAmount, sanitizeVaultAmountInput } from "@/lib/dashboard/vault-amount-input";
import {
  DEFAULT_VAULT_INCOME_SOURCE_ID,
  VAULT_INCOME_SOURCES,
  type VaultIncomeSourceId,
} from "@/lib/dashboard/vault-income-sources";
import { vaultCopy } from "@/lib/dashboard/vault/copy";
import { vaultHomeCompactCtaClass } from "@/lib/dashboard/vault/vault-action-form-styles";
import {
  vaultLightSectionTitleClass,
  vaultSimulatorDisclaimerClass,
} from "@/lib/dashboard/vault/vault-my-money-card-styles";
import { cn } from "@/lib/utils/cn";

const orangeCtaClass = vaultHomeCompactCtaClass;

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

  function handleDepositSubmit(event: FormEvent) {
    event.preventDefault();
    const amount = parsePositiveVaultAmount(depositInput);
    if (amount === null) return;
    onDeposit(amount, incomeSource);
    setDepositInput("");
  }

  return (
    <section
      aria-label="Deposit income"
      className="border-t border-[#BDE9FB]/40 pb-1 pt-5"
    >
      <form onSubmit={handleDepositSubmit} className="space-y-3">
        <h2 className={vaultLightSectionTitleClass}>
          {copy.depositHeading}
        </h2>
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
        <p className={cn(vaultSimulatorDisclaimerClass, "mt-3")}>
          {copy.depositSectionDisclaimerLead}
          <span className="font-bold">{copy.depositSectionDisclaimerEmphasis}</span>
          {copy.depositSectionDisclaimerRest}
        </p>
      </form>
    </section>
  );
}
