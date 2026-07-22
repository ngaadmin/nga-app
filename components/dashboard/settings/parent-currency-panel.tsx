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
  const { currency, currencyCode, supportedCurrencies, setCurrencyCode, currencySymbol } =
    useCurrency();

  return (
    <div className={cn("min-w-0", className)}>
      <p className="font-heading text-sm font-extrabold text-[#031F82]">
        {copy.heading}
      </p>
      <p className="mt-1 font-sans text-xs leading-relaxed text-[#1E3A5F]">
        {copy.summary}
      </p>
      <p className="mt-2 font-heading text-base font-extrabold text-[#031F82]">
        {currency.flag} {currency.label} ({currencySymbol} · {currencyCode})
      </p>

      {isEditable ? (
        <div className="mt-3 grid grid-cols-2 gap-2">
          {supportedCurrencies.map((entry) => {
            const isActive = entry.code === currencyCode;
            return (
              <button
                key={entry.code}
                type="button"
                onClick={() => setCurrencyCode(entry.code as SupportedCurrencyCode)}
                className={cn(
                  "rounded-xl border-2 px-2.5 py-2 text-left transition-all",
                  isActive
                    ? "border-[#0CC1E0] bg-[#BDE9FB]/25 shadow-sm"
                    : "border-[#BDE9FB]/60 bg-white hover:border-[#0CC1E0]/50",
                )}
                aria-pressed={isActive}
              >
                <span className="font-heading text-sm font-extrabold text-[#031F82]">
                  {entry.flag} {entry.code}
                </span>
                <span className="mt-0.5 block font-sans text-[10px] leading-tight text-[#1E3A5F]">
                  {entry.label}
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <p className="mt-2 font-sans text-[10px] leading-relaxed text-[#1E3A5F]">
          {copy.lockedHint}
        </p>
      )}
    </div>
  );
}
