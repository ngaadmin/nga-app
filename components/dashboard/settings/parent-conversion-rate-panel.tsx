"use client";

import { useEffect, useState } from "react";
import { copyMatrix } from "@/constants/copyMatrix";
import { persistRegisteredProgressNow } from "@/lib/dashboard/account-progress-sync";
import { useCurrency } from "@/lib/dashboard/currency-context";
import { useDashboardWallet } from "@/lib/dashboard/dashboard-wallet-context";
import {
  loadLinkedChildrenCashRates,
  saveLinkedChildExchangeRate,
  type LinkedChildCashRate,
} from "@/lib/dashboard/linked-child-exchange-rate";
import { formatMoney } from "@/lib/dashboard/currency/format-money";
import { useUserSession } from "@/lib/dashboard/use-user-session";
import {
  formatExchangeRateInput,
  parseExchangeRateToCents,
} from "@/lib/dashboard/xp-cash";
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
  const { currencyCode } = useCurrency();
  const session = useUserSession();
  const isParentMaster = session?.accountRole === "parent_master";
  const { exchangeRateCentsPer100Xp, xpExchangeRateSet, setExchangeRateCents } =
    useDashboardWallet();
  const [children, setChildren] = useState<LinkedChildCashRate[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [amountInput, setAmountInput] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadingChildren, setLoadingChildren] = useState(false);

  useEffect(() => {
    if (!isParentMaster) {
      if (xpExchangeRateSet && exchangeRateCentsPer100Xp != null) {
        setAmountInput(formatExchangeRateInput(exchangeRateCentsPer100Xp));
      }
      return;
    }

    let cancelled = false;
    setLoadingChildren(true);
    void loadLinkedChildrenCashRates()
      .then((result) => {
        if (cancelled) return;
        if (!result.ok) {
          setError(result.error);
          setChildren([]);
          return;
        }
        setChildren(result.children);
        const first = result.children[0];
        if (!first) return;
        setSelectedChildId(first.userId);
        if (first.centsPer100Xp != null) {
          setAmountInput(formatExchangeRateInput(first.centsPer100Xp));
        }
      })
      .catch(() => {
        if (!cancelled) setError(conversionCopy.noLinkedChild);
      })
      .finally(() => {
        if (!cancelled) setLoadingChildren(false);
      });
    return () => {
      cancelled = true;
    };
  }, [conversionCopy.noLinkedChild, exchangeRateCentsPer100Xp, isParentMaster, xpExchangeRateSet]);

  const previewCents = parseExchangeRateToCents(amountInput);
  const preview =
    previewCents != null
      ? `100 XP = ${formatMoney(previewCents / 100, currencyCode)}`
      : null;

  async function handleSave() {
    setStatus(null);
    setError(null);
    const cents = parseExchangeRateToCents(amountInput);
    if (cents == null) {
      setError(conversionCopy.invalidRateError);
      return;
    }

    setSaving(true);
    try {
      if (isParentMaster) {
        const result = await saveLinkedChildExchangeRate({
          centsPer100Xp: cents,
          childId: selectedChildId,
        });
        if (!result.ok) {
          setError(result.error);
          return;
        }
        setChildren((current) =>
          current.map((child) =>
            !selectedChildId || child.userId === selectedChildId
              ? { ...child, centsPer100Xp: cents }
              : child,
          ),
        );
        setStatus(
          `${conversionCopy.rateSavedTemplate.replace("{amount}", formatMoney(cents / 100, currencyCode))} (${result.usernames.join(", ")})`,
        );
        return;
      }

      setExchangeRateCents(cents);
      await persistRegisteredProgressNow();
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

  function selectChild(childId: string) {
    setSelectedChildId(childId);
    setStatus(null);
    const child = children.find((entry) => entry.userId === childId);
    setAmountInput(
      child?.centsPer100Xp != null ? formatExchangeRateInput(child.centsPer100Xp) : "",
    );
  }

  if (!isEditable) {
    return (
      <div className={cn("min-w-0", className)}>
        <p className="font-heading text-sm font-extrabold text-[#031F82]">
          {conversionCopy.heading}
        </p>
        <p className="mt-2 font-sans text-sm leading-relaxed text-[#1E3A5F]">
          {conversionCopy.vaultCashInHint}
        </p>
        <p className="mt-2 font-heading text-base font-extrabold text-[#031F82]">
          {preview ?? copyMatrix.dashboard.settings.parentHubFeatures.pointsConversionNotSet}
        </p>
      </div>
    );
  }

  return (
    <div className={cn("min-w-0", className)}>
      <p className="font-heading text-sm font-extrabold text-[#031F82]">
        {conversionCopy.heading}
      </p>
      <p className="mt-2 font-sans text-sm leading-relaxed text-[#1E3A5F]">
        {conversionCopy.unsetHint}
      </p>
      <p className="mt-2 font-sans text-sm leading-relaxed text-[#1E3A5F]">
        {conversionCopy.summary}
      </p>

      {isParentMaster && children.length > 1 ? (
        <label className="mt-4 block">
          <span className="font-heading text-xs font-bold text-[#031F82]">
            {conversionCopy.whichKidLabel}
          </span>
          <select
            value={selectedChildId ?? ""}
            onChange={(event) => selectChild(event.target.value)}
            className="mt-1.5 w-full rounded-xl border-2 border-[#BDE9FB] bg-[#F7FBFF] px-3 py-2 font-heading text-sm font-bold text-[#031F82] outline-none focus:border-[#0CC1E0]"
          >
            {children.map((child) => (
              <option key={child.userId} value={child.userId}>
                {child.username}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {isParentMaster && !loadingChildren && children.length === 0 ? (
        <p className="mt-3 font-sans text-sm leading-relaxed text-[#1E3A5F]" role="status">
          {conversionCopy.noLinkedChild}
        </p>
      ) : (
        <label className="mt-4 block">
          <span className="font-heading text-xs font-bold text-[#031F82]">
            {conversionCopy.rateAmountLabel}
          </span>
          <input
            type="text"
            inputMode="decimal"
            value={amountInput}
            onChange={(event) => {
              setStatus(null);
              setError(null);
              setAmountInput(event.target.value);
            }}
            placeholder={conversionCopy.rateAmountPlaceholder}
            aria-label={conversionCopy.rateAmountLabel}
            className="mt-1.5 w-full rounded-xl border-2 border-[#BDE9FB] bg-[#F7FBFF] px-3 py-2 font-heading text-sm font-bold tabular-nums text-[#031F82] outline-none focus:border-[#0CC1E0]"
          />
        </label>
      )}

      {preview ? (
        <p className="mt-2 font-heading text-base font-extrabold text-[#031F82]">{preview}</p>
      ) : null}
      {error ? (
        <p className="mt-2 font-sans text-sm font-semibold text-[#031F82]" role="alert">
          {error}
        </p>
      ) : null}
      {status ? (
        <p className="mt-2 font-sans text-sm leading-relaxed text-[#1E3A5F]" role="status">
          {status}
        </p>
      ) : null}

      <button
        type="button"
        onClick={() => {
          void handleSave();
        }}
        disabled={saving || (isParentMaster && children.length === 0)}
        className="mt-3 h-touch w-full rounded-nga-lg border-b-4 border-[#C88202] bg-[#FFA503] px-4 font-heading text-sm font-bold uppercase tracking-wide text-[#031F82] shadow-md transition-all hover:brightness-[1.02] active:translate-y-[2px] active:border-b-2 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {saving ? conversionCopy.claimingLabel : conversionCopy.saveRate}
      </button>
    </div>
  );
}
