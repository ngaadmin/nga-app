"use client";

import { copyMatrix } from "@/constants/copyMatrix";
import { useCurrency } from "@/lib/dashboard/currency-context";
import {
  MAX_AUD_SLIDER_INDEX,
  MIN_AUD_SLIDER_INDEX,
  formatConversionRateLabel,
} from "@/lib/dashboard/point-conversion";
import { useDashboardWallet } from "@/lib/dashboard/dashboard-wallet-context";
import { cn } from "@/lib/utils/cn";

type ParentConversionRatePanelProps = {
  isEditable: boolean;
  className?: string;
};

export function ParentConversionRatePanel({
  isEditable,
  className,
}: ParentConversionRatePanelProps) {
  const conversionCopy = copyMatrix.dashboard.settings.conversion;
  const vaultHint = copyMatrix.dashboard.settings.conversion.vaultCashInHint;
  const { currencyCode } = useCurrency();
  const { audSliderIndex, setAudSliderIndex, audPer100Xp, xpExchangeRateSet } =
    useDashboardWallet();
  const conversionRateLabel = formatConversionRateLabel(audPer100Xp, currencyCode);

  if (!isEditable) {
    return (
      <div className={cn("min-w-0", className)}>
        <p className="font-heading text-sm font-extrabold text-[#031F82]">
          {conversionCopy.heading}
        </p>
        <p className="mt-2 font-sans text-sm leading-relaxed text-[#1E3A5F]">
          {vaultHint}
        </p>
        <p className="mt-2 font-heading text-base font-extrabold text-[#031F82]">
          {xpExchangeRateSet
            ? conversionRateLabel
            : copyMatrix.dashboard.settings.parentHubFeatures.pointsConversionNotSet}
        </p>
      </div>
    );
  }

  return (
    <div className={cn("min-w-0", className)}>
      <p className="font-heading text-sm font-extrabold text-[#031F82]">
        {conversionCopy.heading}
      </p>
      <p className="mt-2 font-heading text-base font-extrabold text-[#031F82]">
        {conversionRateLabel}
      </p>
      <label className="mt-4 block">
        <span className="sr-only">{conversionCopy.heading}</span>
        <input
          type="range"
          min={MIN_AUD_SLIDER_INDEX}
          max={MAX_AUD_SLIDER_INDEX}
          step={1}
          value={audSliderIndex}
          onChange={(event) => {
            const next = Number.parseInt(event.target.value, 10);
            if (Number.isFinite(next)) setAudSliderIndex(next);
          }}
          className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-[#BDE9FB]/50 accent-[#0CC1E0]"
        />
      </label>
      <p className="mt-3 font-sans text-sm leading-relaxed text-[#1E3A5F]">
        {xpExchangeRateSet ? conversionCopy.summary : conversionCopy.unsetHint}
      </p>
      <button
        type="button"
        onClick={() => setAudSliderIndex(audSliderIndex)}
        className="mt-3 h-touch w-full rounded-nga-lg border-b-4 border-[#C88202] bg-[#FFA503] px-4 font-heading text-sm font-bold uppercase tracking-wide text-[#031F82] shadow-md transition-all hover:brightness-[1.02] active:translate-y-[2px] active:border-b-2"
      >
        {conversionCopy.saveRate}
      </button>
    </div>
  );
}
