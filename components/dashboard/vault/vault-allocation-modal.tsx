"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  BucketEmojiIcon,
  bucketTheme,
} from "@/components/dashboard/vault/vault-visuals";
import { AllocationSheetCoins } from "@/components/dashboard/vault/vault-allocation-sheet-ui";
import { ModalShell } from "@/components/ui/modal-shell";
import { copyMatrix } from "@/constants/copyMatrix";
import { useCurrency } from "@/lib/dashboard/currency-context";
import {
  roundAudAmount,
  type DestinationJarId,
} from "@/lib/dashboard/destination-jars";
import {
  formatVaultCentsInputValue,
  parseVaultCentsInput,
  sanitizeVaultCentsInput,
  sumAllocationDraftValues,
} from "@/lib/dashboard/vault-amount-input";
import {
  savingsBucketDisplayBalance,
  type VaultBucket,
} from "@/lib/dashboard/vault-buckets";
import { vaultBucketDisplayName } from "@/lib/dashboard/vault/bucket-display-name";
import {
  isVaultAllocationBalanced,
  vaultNotAllocatedAmount,
} from "@/lib/dashboard/vault/allocation-remaining";
import { foundationAllocationDrafts } from "@/lib/dashboard/vault/foundation-allocation-split";
import { vaultCopy } from "@/lib/dashboard/vault/copy";
import { cn } from "@/lib/utils/cn";

const orangeCtaClass =
  "rounded-nga-lg border-b-4 border-[#C88202] bg-[#FFA503] font-heading text-sm font-bold uppercase tracking-wide text-[#031F82] transition-all hover:brightness-[1.02] active:translate-y-[2px] active:border-b-2 disabled:cursor-not-allowed disabled:opacity-40";

const allocationRowClass =
  "flex w-full min-w-0 flex-wrap items-center gap-x-2 gap-y-1.5 overflow-visible py-1.5";

const allocationJarInfoClass =
  "flex min-w-0 flex-1 basis-[9.5rem] items-center gap-1.5";

const allocationAmountInputClass =
  "ml-auto flex h-8 max-w-full shrink-0 items-center gap-0.5 rounded-lg border border-[#BDE9FB] bg-white px-1.5";

/** Long totals take their own row so they cannot paint over the neighbouring figure. */
function allocationMetricWrapClass(formatted: string): string {
  if (formatted.length >= 13) return "min-w-full flex-none basis-full";
  return "min-w-0 flex-1 basis-[7rem]";
}

function allocationFigureClass(formatted: string): string {
  if (formatted.length >= 14) return "text-lg leading-tight";
  if (formatted.length >= 10) return "text-xl leading-tight";
  return "text-2xl leading-none";
}

/** Grow with the digits, and never narrower than the original field. */
function allocationInputWidth(value: string): string {
  const chars = Math.max(value.length, 1);
  return `min(100%, max(5.75rem, calc(${chars}ch + 2rem)))`;
}

function AllocationInputRow({
  bucket,
  draft,
  moneyIn,
  totalSavings,
  inputValue,
  onInputChange,
  onInputBlur,
  onInputFocus,
}: {
  bucket: VaultBucket;
  draft: number;
  moneyIn: number;
  totalSavings: number;
  inputValue: string;
  onInputChange: (bucketId: string, rawValue: string) => void;
  onInputBlur: (bucketId: string) => void;
  onInputFocus: (bucketId: string) => void;
}) {
  const { currencySymbol, formatMoney } = useCurrency();
  const theme = bucketTheme(bucket);
  const displayName = vaultBucketDisplayName(bucket);
  const currentBalance = savingsBucketDisplayBalance(bucket, totalSavings);
  const balanceText = formatMoney(currentBalance);
  const wideFigures = inputValue.length >= 10 || balanceText.length >= 12;

  return (
    <div className={cn(allocationRowClass, wideFigures && "flex-col items-stretch")}>
      <div className={cn(allocationJarInfoClass, wideFigures && "w-full flex-none basis-auto")}>
        <BucketEmojiIcon size="sm" emoji={bucket.emoji} theme={theme} />
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "whitespace-normal break-words font-heading text-sm font-bold leading-tight",
              theme.label,
            )}
          >
            {displayName}
          </p>
          <p className="whitespace-normal break-words font-heading text-xs font-extrabold leading-tight tabular-nums text-[#1E3A5F]/70">
            {balanceText}
          </p>
        </div>
      </div>

      <div
        className={cn(
          "flex min-w-0 max-w-full items-center gap-1.5",
          wideFigures ? "w-full justify-end" : "ml-auto",
        )}
      >
        {draft > 0 ? (
          <div className="min-w-0 shrink overflow-hidden">
            <AllocationSheetCoins allocatedAmount={draft} poolTotal={moneyIn} />
          </div>
        ) : null}
        <label
          className={allocationAmountInputClass}
          style={{ width: allocationInputWidth(inputValue) }}
        >
          <span className="shrink-0 font-heading text-sm font-bold text-[#031F82]">
            {currencySymbol}
          </span>
          <input
            type="text"
            inputMode="decimal"
            value={inputValue}
            onChange={(event) => onInputChange(bucket.id, event.target.value)}
            onFocus={() => onInputFocus(bucket.id)}
            onBlur={() => onInputBlur(bucket.id)}
            aria-label={`Amount to allocate to ${displayName}`}
            className="min-w-0 flex-1 bg-transparent text-right font-sans text-sm leading-none tabular-nums text-[#031F82] outline-none"
          />
        </label>
      </div>
    </div>
  );
}

type VaultAllocationModalProps = {
  isOpen: boolean;
  onClose: () => void;
  buckets: VaultBucket[];
  totalSavings: number;
  moneyIn: number;
  onLockIn: (allocations: Record<string, number>) => boolean;
};

export function VaultAllocationModal({
  isOpen,
  onClose,
  buckets,
  totalSavings,
  moneyIn,
  onLockIn,
}: VaultAllocationModalProps) {
  const copy = copyMatrix.dashboard.vault.budget;
  const { formatMoney } = useCurrency();
  const seededOpenRef = useRef(false);

  const [allocationInputs, setAllocationInputs] = useState<Record<string, string>>({});
  const [focusedAllocationBucketId, setFocusedAllocationBucketId] = useState<string | null>(null);
  const [allocationDrafts, setAllocationDrafts] = useState<Record<string, number>>({});
  const [inputWasCapped, setInputWasCapped] = useState(false);
  const [splitTipOpen, setSplitTipOpen] = useState(false);

  const moneyInTotal = roundAudAmount(Math.max(0, moneyIn));
  const allocatedTotal = sumAllocationDraftValues(allocationDrafts);
  const notAllocated = vaultNotAllocatedAmount(moneyInTotal, allocatedTotal);
  const moneyInDisplay = formatMoney(moneyInTotal);
  const notAllocatedDisplay =
    notAllocated < 0 ? `-${formatMoney(-notAllocated)}` : formatMoney(notAllocated);
  const isOverAllocated = notAllocated < 0;
  const canLockIn = isVaultAllocationBalanced(moneyInTotal, allocatedTotal);

  useEffect(() => {
    if (!isOpen) {
      seededOpenRef.current = false;
      setAllocationDrafts({});
      setAllocationInputs({});
      setFocusedAllocationBucketId(null);
      setInputWasCapped(false);
      setSplitTipOpen(false);
      return;
    }

    if (seededOpenRef.current) return;
    seededOpenRef.current = true;

    const foundation = foundationAllocationDrafts(moneyInTotal);
    const nextDrafts: Record<string, number> = {};
    const nextInputs: Record<string, string> = {};
    for (const bucket of buckets) {
      const amount = bucket.isFoundation
        ? (foundation[bucket.id as DestinationJarId] ?? 0)
        : 0;
      nextDrafts[bucket.id] = amount;
      nextInputs[bucket.id] = formatVaultCentsInputValue(amount);
    }
    setAllocationDrafts(nextDrafts);
    setAllocationInputs(nextInputs);
    setFocusedAllocationBucketId(null);
    setInputWasCapped(false);
    setSplitTipOpen(false);
  }, [buckets, isOpen, moneyInTotal]);

  const handleAllocationChange = useCallback((bucketId: string, nextValue: number) => {
    setAllocationDrafts((current) => ({
      ...current,
      [bucketId]: roundAudAmount(Math.max(0, nextValue)),
    }));
  }, []);

  const getAllocationInputValue = useCallback(
    (bucketId: string, draft: number) => {
      if (focusedAllocationBucketId === bucketId) {
        return allocationInputs[bucketId] ?? formatVaultCentsInputValue(draft);
      }
      return formatVaultCentsInputValue(draft);
    },
    [allocationInputs, focusedAllocationBucketId],
  );

  const handleAllocationInputChange = useCallback(
    (bucketId: string, rawValue: string) => {
      const { value: sanitized, hitCap: digitCap } =
        sanitizeVaultCentsInput(rawValue);

      if (sanitized === "") {
        setAllocationInputs((current) => ({ ...current, [bucketId]: "" }));
        handleAllocationChange(bucketId, 0);
        setInputWasCapped(digitCap);
        return;
      }

      const parsed = parseVaultCentsInput(sanitized);
      if (parsed === null) return;

      setAllocationInputs((current) => ({ ...current, [bucketId]: sanitized }));
      setInputWasCapped(digitCap);
      handleAllocationChange(bucketId, parsed);
    },
    [handleAllocationChange],
  );

  const handleAllocationInputFocus = useCallback(
    (bucketId: string) => {
      setFocusedAllocationBucketId(bucketId);
      setAllocationInputs((current) => {
        const draft = allocationDrafts[bucketId] ?? 0;
        if (current[bucketId] !== undefined) return current;
        return {
          ...current,
          [bucketId]: formatVaultCentsInputValue(draft),
        };
      });
    },
    [allocationDrafts],
  );

  const handleAllocationInputBlur = useCallback(
    (bucketId: string) => {
      setFocusedAllocationBucketId((current) => (current === bucketId ? null : current));
      const draft = allocationDrafts[bucketId] ?? 0;
      setAllocationInputs((current) => ({
        ...current,
        [bucketId]: formatVaultCentsInputValue(draft),
      }));
      setInputWasCapped(false);
    },
    [allocationDrafts],
  );

  const handleLockInSubmit = useCallback(() => {
    if (!canLockIn) return;
    const locked = onLockIn(allocationDrafts);
    if (!locked) return;
    setAllocationDrafts({});
    setAllocationInputs({});
    setFocusedAllocationBucketId(null);
  }, [allocationDrafts, canLockIn, onLockIn]);

  const handleClose = useCallback(() => {
    setSplitTipOpen(false);
    onClose();
  }, [onClose]);

  return (
    <ModalShell
      isOpen={isOpen}
      dismissOnBackdrop={false}
      align="center"
      labelledBy="vault-allocation-title"
      backdropClassName="bg-[#031F82]/50"
      panelClassName="w-full max-w-sm rounded-2xl border-0 bg-white px-4 py-5 shadow-md sm:max-w-md sm:px-5"
    >
      <div className="flex items-start gap-2">
        <div className="flex min-w-0 flex-1 flex-wrap items-start gap-x-4 gap-y-3">
          <div className={cn("min-w-0", allocationMetricWrapClass(moneyInDisplay))}>
            <p
              id="vault-allocation-title"
              className="font-heading text-xs font-bold leading-tight text-[#031F82]"
            >
              {copy.moneyInLabel}
            </p>
            <p
              className={cn(
                "mt-1 font-heading font-extrabold tabular-nums text-[#031F82] [overflow-wrap:anywhere]",
                allocationFigureClass(moneyInDisplay),
              )}
            >
              {moneyInDisplay}
            </p>
          </div>
          <div className={cn("min-w-0", allocationMetricWrapClass(notAllocatedDisplay))}>
            <p className="font-heading text-xs font-bold leading-tight text-[#031F82]">
              {copy.notAllocatedLabel}
            </p>
            <p
              className={cn(
                "mt-1 font-heading font-extrabold tabular-nums transition-colors [overflow-wrap:anywhere]",
                allocationFigureClass(notAllocatedDisplay),
                isOverAllocated || inputWasCapped ? "text-[#031F82]" : "text-[#FFA503]",
              )}
              aria-live="polite"
              aria-atomic="true"
            >
              {notAllocatedDisplay}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-start gap-1">
          <div className="relative">
            <button
              type="button"
              onClick={() => setSplitTipOpen((open) => !open)}
              aria-label={copy.allocationSplitTipAriaLabel}
              aria-expanded={splitTipOpen}
              className="flex size-6 shrink-0 items-center justify-center rounded-full border border-[#0CC1E0] font-heading text-xs font-extrabold text-[#031F82] transition-colors hover:bg-[#F0FBFF]"
            >
              i
            </button>
            {splitTipOpen ? (
              <div
                role="tooltip"
                className="absolute right-0 z-overlay mt-2 w-[16.5rem] rounded-xl border border-[#BDE9FB] bg-white p-3 shadow-md"
              >
                <p className="font-sans text-sm leading-relaxed text-[#1E3A5F]">
                  {copy.allocationSplitTip}
                </p>
                <button
                  type="button"
                  onClick={() => setSplitTipOpen(false)}
                  className="mt-3 font-heading text-sm font-bold text-[#031F82] hover:underline"
                >
                  {copy.allocationSplitTipClose}
                </button>
              </div>
            ) : null}
          </div>
          {splitTipOpen ? null : (
            <button
              type="button"
              onClick={handleClose}
              aria-label={vaultCopy.closeModalLabel}
              className="shrink-0 rounded-lg px-2 py-1 font-heading text-lg font-bold leading-none text-[#1E3A5F]/60 transition-colors hover:bg-[#BDE9FB]/40 hover:text-[#031F82]"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="mt-4 max-h-[min(70vh,28rem)] overflow-x-visible overflow-y-auto pr-1 [scrollbar-gutter:stable]">
        <ul className="min-w-0 divide-y divide-[#BDE9FB]/30 overflow-visible">
          {buckets.map((bucket) => (
            <li key={bucket.id}>
              <AllocationInputRow
                bucket={bucket}
                draft={allocationDrafts[bucket.id] ?? 0}
                moneyIn={moneyInTotal}
                totalSavings={totalSavings}
                inputValue={getAllocationInputValue(
                  bucket.id,
                  allocationDrafts[bucket.id] ?? 0,
                )}
                onInputChange={handleAllocationInputChange}
                onInputBlur={handleAllocationInputBlur}
                onInputFocus={handleAllocationInputFocus}
              />
            </li>
          ))}
        </ul>
      </div>

      {!canLockIn ? (
        <p className="mt-3 font-heading text-sm font-bold text-[#031F82]" role="status">
          {copy.assignAllMoneyHint}
        </p>
      ) : null}

      <button
        type="button"
        onClick={handleLockInSubmit}
        disabled={!canLockIn}
        className={cn("mt-4 h-touch w-full px-4 py-2.5", orangeCtaClass)}
      >
        {copy.lockItIn}
      </button>
    </ModalShell>
  );
}
