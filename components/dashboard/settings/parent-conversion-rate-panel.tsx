"use client";

import { useEffect, useState } from "react";
import { copyMatrix } from "@/constants/copyMatrix";
import { useCurrency } from "@/lib/dashboard/currency-context";
import { formatMoney } from "@/lib/dashboard/currency/format-money";
import {
  loadLinkedChildrenCashRates,
  markLinkedChildCashInPaid,
  saveLinkedChildExchangeRate,
  type LinkedChildCashRate,
} from "@/lib/dashboard/linked-child-exchange-rate";
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
  const [children, setChildren] = useState<LinkedChildCashRate[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [amountInput, setAmountInput] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadingChildren, setLoadingChildren] = useState(false);
  const [confirmingChildId, setConfirmingChildId] = useState<string | null>(null);
  const [payingChildId, setPayingChildId] = useState<string | null>(null);

  useEffect(() => {
    if (!isParentMaster) return;

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
  }, [conversionCopy.noLinkedChild, isParentMaster]);

  if (!isParentMaster) return null;

  const previewCents = parseExchangeRateToCents(amountInput);
  const preview =
    previewCents != null
      ? `100 XP = ${formatMoney(previewCents / 100, currencyCode)}`
      : null;

  function rateLabel(cents: number | null): string {
    if (cents == null) {
      return copyMatrix.dashboard.settings.parentHubFeatures.pointsConversionNotSet;
    }
    return `100 XP = ${formatMoney(cents / 100, currencyCode)}`;
  }

  function selectChild(childId: string) {
    setSelectedChildId(childId);
    setStatus(null);
    setConfirmingChildId(null);
    const child = children.find((entry) => entry.userId === childId);
    setAmountInput(
      child?.centsPer100Xp != null ? formatExchangeRateInput(child.centsPer100Xp) : "",
    );
  }

  async function handleSave() {
    setStatus(null);
    setError(null);
    const cents = parseExchangeRateToCents(amountInput);
    if (cents == null) {
      setError(conversionCopy.invalidRateError);
      return;
    }
    if (!selectedChildId) {
      setError(conversionCopy.noLinkedChild);
      return;
    }

    setSaving(true);
    try {
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
    } finally {
      setSaving(false);
    }
  }

  async function handleMarkPaid(childId: string) {
    setError(null);
    setStatus(null);
    setPayingChildId(childId);
    try {
      const result = await markLinkedChildCashInPaid({ childId });
      if (!result.ok) {
        setError(result.error || conversionCopy.markAsPaidError);
        return;
      }
      setChildren((current) =>
        current.map((child) =>
          child.userId === childId ? { ...child, owedCents: 0 } : child,
        ),
      );
      setConfirmingChildId(null);
    } finally {
      setPayingChildId(null);
    }
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

      {loadingChildren ? (
        <p className="mt-3 font-sans text-sm text-[#1E3A5F]">{conversionCopy.checkingAccount}</p>
      ) : null}

      {!loadingChildren && children.length === 0 ? (
        <p className="mt-3 font-sans text-sm leading-relaxed text-[#1E3A5F]" role="status">
          {conversionCopy.noLinkedChild}
        </p>
      ) : null}

      {children.length > 0 ? (
        <ul className="mt-4 space-y-3">
          {children.map((child) => {
            const selected = child.userId === selectedChildId;
            const owedLabel = conversionCopy.owedToTemplate.replace("{name}", child.username);
            return (
              <li
                key={child.userId}
                className={cn(
                  "rounded-xl border-2 px-3 py-3",
                  selected ? "border-[#0CC1E0] bg-[#F7FBFF]" : "border-[#BDE9FB] bg-white",
                )}
              >
                <button
                  type="button"
                  onClick={() => selectChild(child.userId)}
                  className="w-full text-left"
                >
                  <span className="font-heading text-sm font-extrabold text-[#031F82]">
                    {child.username}
                  </span>
                  <span className="mt-1 block font-sans text-sm text-[#1E3A5F]">
                    {rateLabel(child.centsPer100Xp)}
                  </span>
                </button>
                <p className="mt-2 font-heading text-sm font-extrabold text-[#031F82]">
                  {owedLabel}: {formatMoney(child.owedCents / 100, currencyCode)}
                </p>
                {confirmingChildId === child.userId ? (
                  <div className="mt-2">
                    <p className="font-sans text-sm leading-relaxed text-[#1E3A5F]">
                      {conversionCopy.markAsPaidConfirm}
                    </p>
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        disabled={payingChildId === child.userId}
                        onClick={() => {
                          void handleMarkPaid(child.userId);
                        }}
                        className="h-touch flex-1 rounded-nga-lg border-b-4 border-[#C88202] bg-[#FFA503] px-3 font-heading text-xs font-bold uppercase tracking-wide text-[#031F82] disabled:opacity-40"
                      >
                        {conversionCopy.markAsPaidYes}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmingChildId(null)}
                        className="h-touch flex-1 rounded-nga-lg px-3 font-heading text-xs font-bold text-[#0CC1E0]"
                      >
                        {conversionCopy.markAsPaidCancel}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={child.owedCents <= 0 || payingChildId != null}
                    onClick={() => setConfirmingChildId(child.userId)}
                    className="mt-2 font-heading text-sm font-bold text-[#0CC1E0] underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:opacity-40 disabled:no-underline"
                  >
                    {conversionCopy.markAsPaid}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      ) : null}

      {children.length > 0 ? (
        <label className="mt-4 block">
          <span className="font-heading text-xs font-bold text-[#031F82]">
            {conversionCopy.rateAmountLabel}
            {children.length > 1 && selectedChildId
              ? ` · ${children.find((child) => child.userId === selectedChildId)?.username ?? ""}`
              : ""}
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
      ) : null}

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
        disabled={saving || children.length === 0}
        className="mt-3 h-touch w-full rounded-nga-lg border-b-4 border-[#C88202] bg-[#FFA503] px-4 font-heading text-sm font-bold uppercase tracking-wide text-[#031F82] shadow-md transition-all hover:brightness-[1.02] active:translate-y-[2px] active:border-b-2 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {saving ? conversionCopy.claimingLabel : conversionCopy.saveRate}
      </button>
    </div>
  );
}
