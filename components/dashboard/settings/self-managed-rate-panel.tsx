"use client";

import { useState } from "react";
import { copyMatrix } from "@/constants/copyMatrix";
import { useCurrency } from "@/lib/dashboard/currency-context";
import { useDashboardWallet } from "@/lib/dashboard/dashboard-wallet-context";
import { saveOwnExchangeRate } from "@/lib/dashboard/linked-child-exchange-rate";
import {
  formatExchangeRateInput,
  LARGE_EXCHANGE_RATE_CONFIRM_CENTS,
  parseExchangeRateToCents,
  withExchangeRate,
} from "@/lib/dashboard/xp-cash";
import {
  readDashboardWalletState,
  saveDashboardWalletState,
} from "@/lib/dashboard/dashboard-wallet-storage";
import { formatMoney } from "@/lib/dashboard/currency/format-money";

/** 16+ learners with no account manager set the rate on their own profile. */
export function SelfManagedRatePanel() {
  const conversionCopy = copyMatrix.dashboard.settings.conversion;
  const { currencyCode } = useCurrency();
  const wallet = useDashboardWallet();
  const [amountInput, setAmountInput] = useState(() =>
    wallet.exchangeRateCentsPer100Xp != null
      ? formatExchangeRateInput(wallet.exchangeRateCentsPer100Xp)
      : "",
  );
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const previewCents = parseExchangeRateToCents(amountInput);

  async function save(cents: number) {
    setSaving(true);
    try {
      const result = await saveOwnExchangeRate({ centsPer100Xp: cents });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      const local = readDashboardWalletState();
      if (local) {
        saveDashboardWalletState(withExchangeRate(local, cents, new Date().toISOString()));
      }
      setConfirming(false);
      setStatus(
        conversionCopy.rateSavedTemplate.replace(
          "{amount}",
          formatMoney(cents / 100, currencyCode),
        ),
      );
    } finally {
      setSaving(false);
    }
  }

  function handleSave() {
    setError(null);
    setStatus(null);
    const cents = parseExchangeRateToCents(amountInput);
    if (cents == null) {
      setError(conversionCopy.invalidRateError);
      return;
    }
    if (cents > LARGE_EXCHANGE_RATE_CONFIRM_CENTS && !confirming) {
      setConfirming(true);
      return;
    }
    void save(cents);
  }

  return (
    <section aria-label={conversionCopy.heading} className="shrink-0 rounded-2xl bg-white px-3 py-4 shadow-md">
      <p className="font-heading text-sm font-extrabold text-[#031F82]">{conversionCopy.heading}</p>
      <p className="mt-2 font-sans text-sm leading-relaxed text-[#1E3A5F]">
        Set what 100 coins are worth for your own cash-in. Up to $999.99 per 100 coins.
      </p>
      <label className="mt-4 block">
        <span className="font-heading text-xs font-bold text-[#031F82]">
          {conversionCopy.rateAmountLabel}
        </span>
        <input
          type="text"
          inputMode="decimal"
          value={amountInput}
          onChange={(event) => {
            setConfirming(false);
            setError(null);
            setAmountInput(event.target.value);
          }}
          placeholder={conversionCopy.rateAmountPlaceholder}
          aria-label={conversionCopy.rateAmountLabel}
          className="mt-1.5 w-full rounded-xl border-2 border-[#BDE9FB] bg-[#F7FBFF] px-3 py-2 font-heading text-sm font-bold text-[#031F82] outline-none focus:border-[#0CC1E0]"
        />
      </label>
      {confirming && previewCents != null ? (
        <p className="mt-2 font-sans text-sm font-semibold text-[#031F82]" role="status">
          {conversionCopy.largeRateConfirm.replace(
            "{amount}",
            formatMoney(previewCents / 100, currencyCode),
          )}
        </p>
      ) : null}
      {error ? (
        <p className="mt-2 font-sans text-sm font-semibold text-[#031F82]" role="alert">
          {error}
        </p>
      ) : null}
      {status ? (
        <p className="mt-2 font-sans text-sm text-[#1E3A5F]" role="status">
          {status}
        </p>
      ) : null}
      <div className="mt-3 flex gap-2">
        {confirming ? (
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="h-touch flex-1 rounded-nga-lg font-heading text-sm font-bold text-[#0CC1E0]"
          >
            {conversionCopy.largeRateConfirmNo}
          </button>
        ) : null}
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="h-touch flex-1 rounded-nga-lg border-b-4 border-[#C88202] bg-[#FFA503] px-4 font-heading text-sm font-bold uppercase tracking-wide text-[#031F82] disabled:opacity-40"
        >
          {saving
            ? conversionCopy.claimingLabel
            : confirming
              ? conversionCopy.largeRateConfirmYes
              : conversionCopy.saveRate}
        </button>
      </div>
    </section>
  );
}
