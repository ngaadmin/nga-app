"use client";

import { useState } from "react";
import { ModalShell } from "@/components/ui/modal-shell";
import { copyMatrix } from "@/constants/copyMatrix";
import { useCurrency } from "@/lib/dashboard/currency-context";
import { HIGH_ROI_WARNING_THRESHOLD } from "@/lib/dashboard/vault-compounding";
import { vaultV2Copy } from "@/lib/dashboard/vault-v2/copy";
import { cn } from "@/lib/utils/cn";

const orangeCtaClass =
  "rounded-nga-lg border-b-4 border-[#C88202] bg-[#FFA503] font-heading text-xs font-bold uppercase tracking-wide text-[#031F82]";

type VaultV2PremiumCompoundingLimitsModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

function VaultV2PremiumCompoundingLimitsModal({
  isOpen,
  onClose,
}: VaultV2PremiumCompoundingLimitsModalProps) {
  const copy = copyMatrix.dashboard.vault.budget;

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      labelledBy="vault-v2-premium-compounding-title"
      backdropClassName="bg-[#031F82]/45"
      panelClassName="max-w-sm rounded-nga-xl bg-white p-5"
    >
      <h2
        id="vault-v2-premium-compounding-title"
        className="font-heading text-lg font-extrabold text-[#031F82]"
      >
        {copy.premiumCompoundingTitle}
      </h2>
      <p className="mt-2 text-sm text-[#1E3A5F]">{copy.premiumCompoundingBody}</p>
      <button type="button" className={cn("mt-4 h-touch w-full px-4", orangeCtaClass)}>
        {copy.premiumUnlock}
      </button>
      <button
        type="button"
        onClick={onClose}
        className="mt-2 w-full py-2 text-sm font-bold text-[#0CC1E0]"
      >
        {copy.premiumLater}
      </button>
    </ModalShell>
  );
}

export type VaultV2CompoundingCalculatorPanelProps = {
  savingsBalance: number;
  projectedTotal: number;
  isPremium: boolean;
  yearsSaved: number;
  yearsSavedMax: number;
  weeklyTopUp: number;
  weeklyTopUpMax: number;
  expectedRoi: number;
  highRoiWarningCopy: string;
  onYearsSavedChange: (value: number) => void;
  onWeeklyTopUpChange: (value: number) => void;
  onExpectedRoiChange: (value: number) => void;
};

export function VaultV2CompoundingCalculatorPanel({
  savingsBalance,
  projectedTotal,
  isPremium,
  yearsSaved,
  yearsSavedMax,
  weeklyTopUp,
  weeklyTopUpMax,
  expectedRoi,
  highRoiWarningCopy,
  onYearsSavedChange,
  onWeeklyTopUpChange,
  onExpectedRoiChange,
}: VaultV2CompoundingCalculatorPanelProps) {
  const { formatMoney, currencySymbol } = useCurrency();
  const budgetCopy = copyMatrix.dashboard.vault.budget;
  const showHighRoiWarning = expectedRoi >= HIGH_ROI_WARNING_THRESHOLD;
  const [premiumLimitsOpen, setPremiumLimitsOpen] = useState(false);
  const [weeklyTopUpInput, setWeeklyTopUpInput] = useState("");
  const [weeklyTopUpFocused, setWeeklyTopUpFocused] = useState(false);

  const weeklyTopUpDisplayValue = weeklyTopUpFocused
    ? weeklyTopUpInput
    : weeklyTopUp > 0
      ? String(weeklyTopUp)
      : "";

  function handleWeeklyTopUpInputChange(rawValue: string) {
    if (rawValue !== "" && !/^\d*\.?\d*$/.test(rawValue)) return;

    setWeeklyTopUpInput(rawValue);

    if (rawValue === "" || rawValue === ".") {
      onWeeklyTopUpChange(0);
      return;
    }

    const parsed = Number.parseFloat(rawValue);
    if (Number.isFinite(parsed) && parsed >= 0) {
      onWeeklyTopUpChange(Math.min(weeklyTopUpMax, parsed));
    }
  }

  function handleWeeklyTopUpInputFocus() {
    setWeeklyTopUpFocused(true);
    setWeeklyTopUpInput(weeklyTopUp > 0 ? String(weeklyTopUp) : "");
  }

  function handleWeeklyTopUpInputBlur() {
    setWeeklyTopUpFocused(false);
    setWeeklyTopUpInput(weeklyTopUp > 0 ? String(weeklyTopUp) : "");
  }

  return (
    <>
      <div
        className="space-y-3 rounded-xl bg-[#F7FBFF]/80 p-3"
        role="region"
        aria-label={vaultV2Copy.compoundingCalculatorAriaLabel}
      >
        <p className="font-sans text-xs text-[#1E3A5F]">
          {vaultV2Copy.projectedLabel}{" "}
          <span className="font-semibold text-[#031F82]">{formatMoney(projectedTotal)}</span>
        </p>

        <div className="block">
          <span className="font-heading text-[10px] font-bold uppercase tracking-wide text-[#031F82]">
            {budgetCopy.currentSavingsLabel}
          </span>
          <p
            className="mt-1 w-full rounded-xl bg-[#BDE9FB]/20 px-3 py-1.5 font-heading text-sm font-extrabold text-[#031F82]"
            aria-live="polite"
          >
            {formatMoney(savingsBalance)}
          </p>
        </div>

        <label className="block">
          <span className="flex items-center justify-between font-heading text-[10px] font-bold uppercase tracking-wide text-[#031F82]">
            {vaultV2Copy.yearsSavedLabel}
            <span className="rounded-full bg-[#BDE9FB]/30 px-2 py-0.5 text-[#0CC1E0]">
              {yearsSaved}
            </span>
          </span>
          <input
            type="range"
            min={1}
            max={yearsSavedMax}
            step={1}
            value={Math.min(yearsSaved, yearsSavedMax)}
            onChange={(event) => {
              const next = Number.parseInt(event.target.value, 10) as number;
              if (Number.isFinite(next)) onYearsSavedChange(next);
            }}
            className="mt-1 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-[#BDE9FB]/50 accent-[#0CC1E0]"
          />
          {isPremium ? (
            <input
              type="number"
              min={1}
              max={yearsSavedMax}
              step={1}
              value={yearsSaved}
              onChange={(event) => {
                const next = Number.parseInt(event.target.value, 10);
                if (Number.isFinite(next)) {
                  onYearsSavedChange(Math.min(yearsSavedMax, Math.max(1, next)));
                }
              }}
              className="mt-1.5 w-full rounded-lg border border-[#BDE9FB] bg-white px-2 py-1.5 text-sm outline-none focus:border-[#0CC1E0]"
              aria-label={vaultV2Copy.customYearsSavedAriaLabel}
            />
          ) : null}
        </label>

        <label className="block">
          <span className="flex items-center justify-between gap-2 font-heading text-[10px] font-bold uppercase tracking-wide text-[#031F82]">
            {budgetCopy.weeklyTopUpLabel}
            <span className="flex shrink-0 items-center gap-1 rounded-lg border border-[#BDE9FB] bg-white px-2 py-0.5">
              <span className="font-heading text-xs font-bold text-[#031F82]">{currencySymbol}</span>
              <input
                type="text"
                inputMode="decimal"
                value={weeklyTopUpDisplayValue}
                onChange={(event) => handleWeeklyTopUpInputChange(event.target.value)}
                onFocus={handleWeeklyTopUpInputFocus}
                onBlur={handleWeeklyTopUpInputBlur}
                aria-label={budgetCopy.weeklyTopUpLabel}
                className="w-14 bg-transparent text-right font-sans text-sm tabular-nums text-[#0CC1E0] outline-none"
              />
            </span>
          </span>
          <input
            type="range"
            min={0}
            max={weeklyTopUpMax}
            step={1}
            value={Math.min(weeklyTopUp, weeklyTopUpMax)}
            onChange={(event) => {
              const next = Number.parseInt(event.target.value, 10) as number;
              if (Number.isFinite(next)) onWeeklyTopUpChange(next);
            }}
            className="mt-1 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-[#BDE9FB]/50 accent-[#0CC1E0]"
          />
        </label>

        {!isPremium ? (
          <button
            type="button"
            onClick={() => setPremiumLimitsOpen(true)}
            className="font-heading text-[10px] font-bold text-[#0CC1E0] hover:underline"
          >
            {budgetCopy.changeLimitsLink}
          </button>
        ) : null}

        <label className="block">
          <span className="flex items-center justify-between font-heading text-[10px] font-bold uppercase tracking-wide text-[#031F82]">
            {vaultV2Copy.expectedRoiLabel}
            <span className="rounded-full bg-[#BDE9FB]/30 px-2 py-0.5 text-[#0CC1E0]">
              {expectedRoi}%
            </span>
          </span>
          <input
            type="range"
            min={1}
            max={25}
            step={1}
            value={expectedRoi}
            onChange={(event) => {
              const next = Number.parseInt(event.target.value, 10) as number;
              if (Number.isFinite(next)) onExpectedRoiChange(next);
            }}
            className="mt-1 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-[#BDE9FB]/50 accent-[#DCB766]"
          />
        </label>

        {showHighRoiWarning ? (
          <div role="alert" className="rounded-xl bg-[#FFF7ED] p-2.5">
            <p className="font-sans text-xs leading-relaxed text-[#031F82]">⚠️ {highRoiWarningCopy}</p>
          </div>
        ) : null}
      </div>
      <VaultV2PremiumCompoundingLimitsModal
        isOpen={premiumLimitsOpen}
        onClose={() => setPremiumLimitsOpen(false)}
      />
    </>
  );
}
