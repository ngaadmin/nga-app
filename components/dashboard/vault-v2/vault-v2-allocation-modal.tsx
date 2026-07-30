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
import { VaultV2CoinStackVisual } from "@/components/dashboard/vault-v2/vault-v2-coin-stack-visual";
import { ModalShell } from "@/components/ui/modal-shell";
import { copyMatrix } from "@/constants/copyMatrix";
import { useCurrency } from "@/lib/dashboard/currency-context";
import { roundAudAmount } from "@/lib/dashboard/destination-jars";
import {
  capAllocationDrafts,
  clampVaultAllocationEntry,
  sumAllocationDraftValues,
} from "@/lib/dashboard/vault-amount-input";
import {
  sumAllocations,
  type VaultBucket,
  type VaultBucketId,
} from "@/lib/dashboard/vault-buckets";
import { vaultV2BucketDisplayName } from "@/lib/dashboard/vault-v2/bucket-display-name";
import { vaultV2Copy } from "@/lib/dashboard/vault-v2/copy";
import { cn } from "@/lib/utils/cn";

const orangeCtaClass =
  "rounded-nga-lg border-b-4 border-[#C88202] bg-[#FFA503] font-heading text-xs font-bold uppercase tracking-wide text-[#031F82] transition-all hover:brightness-[1.02] active:translate-y-[2px] active:border-b-2 disabled:cursor-not-allowed disabled:opacity-40";

function AllocationInputRow({
  bucket,
  draft,
  poolTotal,
  inputValue,
  onInputChange,
  onInputBlur,
  onInputFocus,
}: {
  bucket: VaultBucket;
  draft: number;
  poolTotal: number;
  inputValue: string;
  onInputChange: (bucketId: string, rawValue: string) => void;
  onInputBlur: (bucketId: string) => void;
  onInputFocus: (bucketId: string) => void;
}) {
  const { currencySymbol } = useCurrency();
  const theme = bucketTheme(bucket);
  const displayName = vaultV2BucketDisplayName(bucket);

  return (
    <div className="flex min-w-0 items-end gap-2 py-2.5">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <BucketEmojiIcon size="sm" emoji={bucket.emoji} theme={theme} />
        <p className={cn("truncate font-heading text-xs font-bold", theme.label)}>
          {displayName}
        </p>
      </div>

      <label className="flex w-[5.75rem] shrink-0 items-center gap-1 rounded-lg border border-[#BDE9FB] bg-white px-2 py-1.5">
        <span className="shrink-0 font-heading text-xs font-bold text-[#031F82]">
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
          className="min-w-0 flex-1 bg-transparent text-right font-sans text-sm tabular-nums text-[#031F82] outline-none"
        />
      </label>

      <VaultV2CoinStackVisual
        allocatedAmount={draft}
        poolTotal={poolTotal}
        className="flex h-[4.25rem] w-[4.5rem] shrink-0 items-end justify-end"
      />
    </div>
  );
}

type VaultV2AllocationModalProps = {
  isOpen: boolean;
  onClose: () => void;
  buckets: VaultBucket[];
  moneyToAllocate: number;
  onLockIn: (allocations: Record<string, number>) => void;
};

export function VaultV2AllocationModal({
  isOpen,
  onClose,
  buckets,
  moneyToAllocate,
  onLockIn,
}: VaultV2AllocationModalProps) {
  const copy = copyMatrix.dashboard.vault.budget;
  const { formatMoney } = useCurrency();
  const bucketIds = useMemo(() => buckets.map((bucket) => bucket.id), [buckets]);

  const [allocationInputs, setAllocationInputs] = useState<Record<string, string>>({});
  const [focusedAllocationBucketId, setFocusedAllocationBucketId] = useState<string | null>(null);
  const [allocationDrafts, setAllocationDrafts] = useState<Record<string, number>>({});

  const poolTotal = roundAudAmount(Math.max(0, moneyToAllocate));
  const allocatedTotal = sumAllocations(allocationDrafts);
  const hasAllocationDraft = allocatedTotal > 0;

  useEffect(() => {
    if (!isOpen) {
      setAllocationDrafts({});
      setAllocationInputs({});
      setFocusedAllocationBucketId(null);
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
        return allocationInputs[bucketId] ?? (draft > 0 ? String(draft) : "");
      }
      return draft > 0 ? String(draft) : "";
    },
    [allocationInputs, focusedAllocationBucketId],
  );

  const handleAllocationInputChange = useCallback(
    (bucketId: string, rawValue: string) => {
      if (rawValue !== "" && !/^\d*\.?\d*$/.test(rawValue)) return;

      setAllocationInputs((current) => ({ ...current, [bucketId]: rawValue }));

      if (rawValue === "" || rawValue === ".") {
        handleAllocationChange(bucketId, 0);
        return;
      }

      const parsed = Number.parseFloat(rawValue);
      if (Number.isFinite(parsed) && parsed >= 0) {
        handleAllocationChange(bucketId, parsed);
      }
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
          [bucketId]: draft > 0 ? String(draft) : "",
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
        [bucketId]: draft > 0 ? String(draft) : "",
      }));
    },
    [allocationDrafts],
  );

  const handleLockInSubmit = useCallback(() => {
    if (allocatedTotal <= 0) return;

    onLockIn(allocationDrafts);
    setAllocationDrafts({});
    setAllocationInputs({});
    setFocusedAllocationBucketId(null);
    onClose();
  }, [allocatedTotal, allocationDrafts, onClose, onLockIn]);

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      align="center"
      labelledBy="vault-v2-allocation-title"
      backdropClassName="bg-[#031F82]/50"
      panelClassName="max-w-lg rounded-2xl border-0 bg-white p-5 shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2
            id="vault-v2-allocation-title"
            className="font-heading text-lg font-extrabold text-[#031F82]"
          >
            {copy.poolLabel}
          </h2>
          <p className="mt-1 font-heading text-3xl font-extrabold leading-none tabular-nums text-[#FFA503]">
            {formatMoney(poolTotal)}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={vaultV2Copy.closeModalLabel}
          className="shrink-0 rounded-lg px-2 py-1 font-heading text-lg font-bold leading-none text-[#1E3A5F]/60 transition-colors hover:bg-[#BDE9FB]/40 hover:text-[#031F82]"
        >
          ✕
        </button>
      </div>

      <div className="mt-4 max-h-[min(60vh,24rem)] overflow-y-auto">
        <div className="min-w-0 divide-y divide-[#BDE9FB]/30">
          {buckets.map((bucket) => (
            <AllocationInputRow
              key={bucket.id}
              bucket={bucket}
              draft={allocationDrafts[bucket.id] ?? 0}
              poolTotal={poolTotal}
              inputValue={getAllocationInputValue(
                bucket.id,
                allocationDrafts[bucket.id] ?? 0,
              )}
              onInputChange={handleAllocationInputChange}
              onInputBlur={handleAllocationInputBlur}
              onInputFocus={handleAllocationInputFocus}
            />
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={handleLockInSubmit}
        disabled={!hasAllocationDraft}
        className={cn("mt-4 h-touch w-full px-4 py-2.5", orangeCtaClass)}
      >
        {copy.lockItIn}
      </button>
    </ModalShell>
  );
}
