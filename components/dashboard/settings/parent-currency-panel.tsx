"use client";

import { copyMatrix } from "@/constants/copyMatrix";
import { useCurrency } from "@/lib/dashboard/currency-context";
import type { SupportedCurrencyCode } from "@/lib/dashboard/currency/currencies";
import { cn } from "@/lib/utils/cn";

type ParentCurrencyPanelProps = {
  isEditable: boolean;
  className?: string;
};

export function ParentCurrencyPanel({
  isEditable,
  className,
}: ParentCurrencyPanelProps) {
  const copy = copyMatrix.dashboard.settings.currency;
  const { currency, currencyCode, supportedCurrencies, setCurrencyCode } =
    useCurrency();

  return (
    <div className={cn("min-w-0", className)}>
      <div className="flex items-center justify-between gap-3">
        <label
          htmlFor="display-currency"
          className="shrink-0 font-heading text-sm font-extrabold text-[#031F82]"
        >
          {copy.heading}
        </label>

        {isEditable ? (
          <select
            id="display-currency"
            value={currencyCode}
            onChange={(event) => {
              setCurrencyCode(event.target.value as SupportedCurrencyCode);
            }}
            aria-label={copy.heading}
            className="min-w-0 max-w-[12.5rem] rounded-xl border-2 border-[#BDE9FB] bg-white px-2.5 py-1.5 font-heading text-sm font-bold text-[#031F82] outline-none focus:border-[#0CC1E0]"
          >
            {supportedCurrencies.map((entry) => (
              <option key={entry.code} value={entry.code}>
                {entry.flag} {entry.code}
              </option>
            ))}
          </select>
        ) : (
          <p className="font-heading text-sm font-extrabold text-[#031F82]">
            {currency.flag} {currencyCode}
          </p>
        )}
      </div>
    </div>
  );
}
