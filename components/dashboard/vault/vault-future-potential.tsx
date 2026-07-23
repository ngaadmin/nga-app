"use client";

import type { ReactNode } from "react";
import { ProgressRing } from "@/components/dashboard/vault/vault-visuals";
import { copyMatrix } from "@/constants/copyMatrix";
import { useCurrency } from "@/lib/dashboard/currency-context";
import { cn } from "@/lib/utils/cn";

export type FuturePotentialCompactButtonProps = {
  totalSavings: number;
  futureSavingsPotential: number;
  futureSubtext: string;
  isOpen: boolean;
  onToggle: () => void;
  className?: string;
};

export function FuturePotentialCompactButton({
  totalSavings,
  futureSavingsPotential,
  futureSubtext,
  isOpen,
  onToggle,
  className,
}: FuturePotentialCompactButtonProps) {
  const { formatMoney } = useCurrency();
  const copy = copyMatrix.dashboard.vault.budget;
  const hasSavings = totalSavings > 0;
  const ringProgress =
    futureSavingsPotential > 0 && hasSavings
      ? Math.min(100, (totalSavings / futureSavingsPotential) * 100)
      : 0;

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={isOpen}
      aria-label={`${copy.futurePotentialLabel}: ${formatMoney(futureSavingsPotential)}`}
      className={cn(
        "flex min-h-full min-w-0 flex-col items-center justify-center rounded-xl border-2 px-2 py-3 text-center transition-colors",
        isOpen
          ? "border-[#0CC1E0] bg-[#E0F7FE]/40"
          : "border-[#BDE9FB] bg-white hover:border-[#0CC1E0]/70",
        className,
      )}
    >
      <ProgressRing progress={ringProgress} color="#0CC1E0" trackColor="#E0F7FE" size={40} stroke={3}>
        <span className="text-sm">📈</span>
      </ProgressRing>
      <p className="mt-2 font-heading text-xs font-bold uppercase tracking-wide text-[#0CC1E0]">
        {copy.futurePotentialLabel}
      </p>
      <p className="font-heading text-base font-extrabold leading-tight text-[#031F82]">
        {formatMoney(futureSavingsPotential)}
      </p>
      <p className="mt-1 line-clamp-2 px-1 font-sans text-xs leading-snug text-[#1E3A5F]/70">
        {isOpen ? "Hide forecast" : futureSubtext}
      </p>
    </button>
  );
}

export type FuturePotentialCalculatorProps = {
  isOpen: boolean;
  calculatorPanel: ReactNode;
};

export function FuturePotentialCalculator({
  isOpen,
  calculatorPanel,
}: FuturePotentialCalculatorProps) {
  if (!isOpen) return null;
  return (
    <div className="mt-3" role="region" aria-label="Compounding calculator">
      {calculatorPanel}
    </div>
  );
}
