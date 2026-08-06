"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  BucketEmojiIcon,
  bucketTheme,
} from "@/components/dashboard/vault/vault-visuals";
import { VaultCoinStackVisual } from "@/components/dashboard/vault/vault-coin-stack-visual";
import { ModalShell } from "@/components/ui/modal-shell";
import { copyMatrix } from "@/constants/copyMatrix";
import { useCurrency } from "@/lib/dashboard/currency-context";
import { roundAudAmount } from "@/lib/dashboard/destination-jars";
import {
  capAllocationDrafts,
  clampVaultAllocationEntry,
  formatVaultAmountInputValue,
  parseVaultAmountInput,
  sanitizeVaultAmountInput,
  sumAllocationDraftValues,
} from "@/lib/dashboard/vault-amount-input";
import {
  savingsBucketDisplayBalance,
  type VaultBucket,
  type VaultBucketId,
} from "@/lib/dashboard/vault-buckets";
import { vaultBucketDisplayName } from "@/lib/dashboard/vault/bucket-display-name";
import {
  isAllocationOverPool,
  sumEffectiveAllocationInputs,
  sumEffectiveAllocationInputsExcept,
  vaultAllocationRemainingDisplay,
} from "@/lib/dashboard/vault/allocation-remaining";
import { ALLOCATION_COIN_SIZE_PX } from "@/lib/dashboard/vault/allocation-coin-stacks";
import { vaultCopy } from "@/lib/dashboard/vault/copy";
import { cn } from "@/lib/utils/cn";

const orangeCtaClass =
  "rounded-nga-lg border-b-4 border-[#C88202] bg-[#FFA503] font-heading text-xs font-bold uppercase tracking-wide text-[#031F82] transition-all hover:brightness-[1.02] active:translate-y-[2px] active:border-b-2 disabled:cursor-not-allowed disabled:opacity-40";

const allocationRowClass =
  "flex w-full min-w-0 items-end gap-x-2 py-2.5";

const allocationJarInfoClass =
  "flex w-[5.75rem] shrink-0 flex-col items-center justify-end gap-0.5 self-stretch pb-0.5";

const allocationCoinSlotClass =
  "flex min-h-0 min-w-0 flex-1 items-end justify-end overflow-visible [container-type:inline-size]";

const allocationAmountInputClass =
  "flex h-9 w-[5.25rem] shrink-0 items-center gap-1 rounded-lg border border-[#BDE9FB] bg-white px-2";

function AllocationInputRow({
  bucket,
  draft,
  poolTotal,
  totalSavings,
  inputValue,
  onInputChange,
  onInputBlur,
  onInputFocus,
}: {
  bucket: VaultBucket;
  draft: number;
  poolTotal: number;
  totalSavings: number;
  inputValue: string;
  onInputChange: (bucketId: string, rawValue: string) => void;
  onInputBlur: (bucketId: string) => void;
  onInputFocus: (bucketId: string) => void;
}) {
  const { currencySymbol, formatWholeMoney: formatMoney } = useCurrency();
  const theme = bucketTheme(bucket);
  const displayName = vaultBucketDisplayName(bucket);
  const currentBalance = savingsBucketDisplayBalance(bucket, totalSavings);

  return (
    <div className={allocationRowClass}>
      <div className={allocationJarInfoClass}>
        <BucketEmojiIcon size="lg" emoji={bucket.emoji} theme={theme} />
        <p
          className={cn(
            "line-clamp-2 w-full text-center font-heading text-[11px] font-bold leading-tight",
            theme.label,
          )}
        >
          {displayName}
        </p>
        <p className="w-full truncate text-center font-heading text-[10px] font-extrabold leading-none tabular-nums text-[#1E3A5F]/70">
          {formatMoney(currentBalance)}
        </p>
      </div>

      <div className={allocationCoinSlotClass}>
        <VaultCoinStackVisual
          allocatedAmount={draft}
          poolTotal={poolTotal}
          coinSizePx={ALLOCATION_COIN_SIZE_PX - 2}
        />
      </div>

      <label className={allocationAmountInputClass}>
        <span className="shrink-0 font-heading text-xs font-bold text-[#031F82]">
          {currencySymbol}
        </span>
        <input
          type="text"
          inputMode="numeric"
          value={inputValue}
          onChange={(event) => onInputChange(bucket.id, event.target.value)}
          onFocus={() => onInputFocus(bucket.id)}
          onBlur={() => onInputBlur(bucket.id)}
          aria-label={`Amount to allocate to ${displayName}`}
          className="min-w-0 flex-1 bg-transparent text-right font-sans text-sm leading-none tabular-nums text-[#031F82] outline-none"
        />
      </label>
    </div>
  );
}

type VaultAllocationModalProps = {
  isOpen: boolean;
  onClose: () => void;
  buckets: VaultBucket[];
  totalSavings: number;
  moneyToAllocate: number;
  onLockIn: (allocations: Record<string, number>) => void;
};

export function VaultAllocationModal({
  isOpen,
  onClose,
  buckets,
  totalSavings,
  moneyToAllocate,
  onLockIn,
}: VaultAllocationModalProps) {
  const copy = copyMatrix.dashboard.vault.budget;
  const { formatWholeMoney: formatMoney } = useCurrency();
  const bucketIds = useMemo(() => buckets.map((bucket) => bucket.id), [buckets]);

  const [allocationInputs, setAllocationInputs] = useState<Record<string, string>>({});
  const [focusedAllocationBucketId, setFocusedAllocationBucketId] = useState<string | null>(null);
  const [allocationDrafts, setAllocationDrafts] = useState<Record<string, number>>({});
  const [inputWasCapped, setInputWasCapped] = useState(false);

  const poolTotal = roundAudAmount(Math.max(0, moneyToAllocate));
  const effectiveAllocatedTotal = useMemo(
    () =>
      sumEffectiveAllocationInputs(
        bucketIds,
        allocationDrafts,
        allocationInputs,
        focusedAllocationBucketId,
      ),
    [allocationDrafts, allocationInputs, bucketIds, focusedAllocationBucketId],
  );
  const remainingToAllocate = vaultAllocationRemainingDisplay(
    poolTotal,
    effectiveAllocatedTotal,
  );
  const isOverAllocated = isAllocationOverPool(poolTotal, effectiveAllocatedTotal);
  const hasAllocationDraft = effectiveAllocatedTotal > 0;
  const canLockIn = hasAllocationDraft && !isOverAllocated;

  useEffect(() => {
    if (!isOpen) {
      setAllocationDrafts({});
      setAllocationInputs({});
      setFocusedAllocationBucketId(null);
      setInputWasCapped(false);
      return;
    }

    if (poolTotal <= 0) {
      setAllocationDrafts({});
      return;
    }

    setAllocationDrafts((current) => {
      if (sumAllocationDraftValues(current) <= poolTotal) return current;
      return capAllocationDrafts(current, poolTotal, bucketIds);
    });
  }, [bucketIds, isOpen, poolTotal]);

  useEffect(() => {
    if (!isOpen) return;

    setAllocationDrafts((current) => {
      const next = { ...current };
      for (const id of bucketIds) if (next[id] === undefined) next[id] = 0;
      for (const id of Object.keys(next)) {
        if (!bucketIds.includes(id as VaultBucketId)) delete next[id];
      }
      return next;
    });
  }, [bucketIds, isOpen]);

  const handleAllocationChange = useCallback(
    (bucketId: string, nextValue: number) => {
      setAllocationDrafts((current) => {
        const others = roundAudAmount(
          bucketIds
            .filter((id) => id !== bucketId)
            .reduce((sum, id) => sum + (current[id] ?? 0), 0),
        );
        const clamped = clampVaultAllocationEntry(poolTotal, others, nextValue);
        return { ...current, [bucketId]: clamped };
      });
    },
    [bucketIds, poolTotal],
  );

  const getAllocationInputValue = useCallback(
    (bucketId: string, draft: number) => {
      if (focusedAllocationBucketId === bucketId) {
        return (
          allocationInputs[bucketId] ?? formatVaultAmountInputValue(draft)
        );
      }
      return formatVaultAmountInputValue(draft);
    },
    [allocationInputs, focusedAllocationBucketId],
  );

  const handleAllocationInputChange = useCallback(
    (bucketId: string, rawValue: string) => {
      const { value: sanitized, hitCap: digitCap } =
        sanitizeVaultAmountInput(rawValue);

      if (sanitized === "") {
        setAllocationInputs((current) => ({ ...current, [bucketId]: "" }));
        handleAllocationChange(bucketId, 0);
        setInputWasCapped(digitCap);
        return;
      }

      const parsed = parseVaultAmountInput(sanitized);
      if (parsed === null) return;

      const othersTotal = sumEffectiveAllocationInputsExcept(
        bucketId,
        bucketIds,
        allocationDrafts,
        allocationInputs,
        focusedAllocationBucketId,
      );
      const capped = clampVaultAllocationEntry(poolTotal, othersTotal, parsed);
      const wasCapped = capped !== parsed || digitCap;
      const nextInput = formatVaultAmountInputValue(capped) || (capped === 0 ? "0" : "");

      setAllocationInputs((current) => ({ ...current, [bucketId]: nextInput }));
      setInputWasCapped(wasCapped);
      handleAllocationChange(bucketId, capped);
    },
    [allocationDrafts, allocationInputs, bucketIds, focusedAllocationBucketId, handleAllocationChange, poolTotal],
  );

  const handleAllocationInputFocus = useCallback(
    (bucketId: string) => {
      setFocusedAllocationBucketId(bucketId);
      setAllocationInputs((current) => {
        const draft = allocationDrafts[bucketId] ?? 0;
        if (current[bucketId] !== undefined) return current;
        return {
          ...current,
          [bucketId]: formatVaultAmountInputValue(draft),
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
        [bucketId]: formatVaultAmountInputValue(draft),
      }));
      setInputWasCapped(false);
    },
    [allocationDrafts],
  );

  const handleLockInSubmit = useCallback(() => {
    if (!canLockIn || isAllocationOverPool(poolTotal, effectiveAllocatedTotal)) return;

    onLockIn(allocationDrafts);
    setAllocationDrafts({});
    setAllocationInputs({});
    setFocusedAllocationBucketId(null);
    onClose();
  }, [allocationDrafts, canLockIn, effectiveAllocatedTotal, onClose, onLockIn, poolTotal]);

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      align="center"
      labelledBy="vault-allocation-title"
      backdropClassName="bg-[#031F82]/50"
      panelClassName="w-full max-w-sm rounded-2xl border-0 bg-white px-4 py-5 shadow-md sm:px-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2
            id="vault-allocation-title"
            className="font-heading text-lg font-extrabold text-[#031F82]"
          >
            {copy.poolLabel}
          </h2>
          <p
            className={cn(
              "mt-1 font-heading text-3xl font-extrabold leading-none tabular-nums transition-colors",
              isOverAllocated || inputWasCapped ? "text-[#BE123C]" : "text-[#FFA503]",
            )}
            aria-live="polite"
            aria-atomic="true"
          >
            {formatMoney(remainingToAllocate)}
          </p>
          {isOverAllocated || inputWasCapped ? (
            <p className="mt-1 font-heading text-xs font-bold text-[#BE123C]" role="status">
              {inputWasCapped
                ? copy.remainingLabel + ": capped to available balance"
                : `${copy.remainingLabel}: exceeds available pool`}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={vaultCopy.closeModalLabel}
          className="shrink-0 rounded-lg px-2 py-1 font-heading text-lg font-bold leading-none text-[#1E3A5F]/60 transition-colors hover:bg-[#BDE9FB]/40 hover:text-[#031F82]"
        >
          ✕
        </button>
      </div>

      <div className="mt-4 max-h-[min(60vh,24rem)] overflow-y-auto overflow-x-hidden pr-1 [scrollbar-gutter:stable]">
        <ul className="min-w-0 divide-y divide-[#BDE9FB]/30 overflow-visible">
          {buckets.map((bucket) => (
            <li key={bucket.id}>
              <AllocationInputRow
                bucket={bucket}
                draft={allocationDrafts[bucket.id] ?? 0}
                poolTotal={poolTotal}
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
