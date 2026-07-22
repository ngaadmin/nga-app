"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import { ModalShell } from "@/components/ui/modal-shell";
import {
  JarFillVisual,
  bucketTheme,
  jarFillPercent,
} from "@/components/dashboard/vault/vault-visuals";
import { copyMatrix } from "@/constants/copyMatrix";
import { useCurrency } from "@/lib/dashboard/currency-context";
import { roundAudAmount, roundToHalfStep } from "@/lib/dashboard/destination-jars";
import {
  canAddVaultBucket,
  canMarkBucketAsSpent,
  canRenameFoundationBucket,
  maxVaultBuckets,
  sumAllocations,
  isSavingsBucket,
  type VaultBucket,
  type VaultBucketId,
} from "@/lib/dashboard/vault-buckets";
import { cn } from "@/lib/utils/cn";

const orangeCtaClass =
  "rounded-nga-lg border-b-4 border-[#C88202] bg-[#FFA503] font-heading text-xs font-bold uppercase tracking-wide text-[#031F82] transition-all hover:brightness-[1.02] active:translate-y-[2px] active:border-b-2 disabled:cursor-not-allowed disabled:opacity-40";

const tealBtnClass =
  "rounded-lg border border-[#0CC1E0] bg-white px-3 py-1.5 font-heading text-[10px] font-bold text-[#031F82] disabled:opacity-40";

const spendBtnClass =
  "rounded-lg border border-[#FDA4AF] bg-[#FDA4AF]/25 px-3 py-1.5 font-heading text-[10px] font-bold text-[#031F82] disabled:opacity-40";

const ALLOCATION_STEP = 0.5;

function parsePositiveAmount(rawValue: string): number | null {
  const trimmed = rawValue.trim();
  if (!trimmed) return null;
  const parsed = Number.parseFloat(trimmed);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return roundToHalfStep(parsed);
}

function PremiumRenameModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const copy = copyMatrix.dashboard.vault.budget;
  return (
    <ModalShell isOpen={isOpen} onClose={onClose} labelledBy="premium-rename-title" backdropClassName="bg-[#031F82]/45" panelClassName="max-w-sm rounded-nga-xl bg-white p-5">
      <h2 id="premium-rename-title" className="font-heading text-lg font-extrabold text-[#031F82]">{copy.premiumRenameTitle}</h2>
      <p className="mt-2 text-sm text-[#1E3A5F]">{copy.premiumRenameBody}</p>
      <button type="button" className={cn("mt-4 h-touch w-full px-4", orangeCtaClass)}>{copy.premiumUnlock}</button>
      <button type="button" onClick={onClose} className="mt-2 w-full py-2 text-sm font-bold text-[#0CC1E0]">{copy.premiumLater}</button>
    </ModalShell>
  );
}

export type MoveTarget = VaultBucketId | "pool";

function AllocationSliderRow({
  bucket,
  draft,
  poolTotal,
  onSliderChange,
}: {
  bucket: VaultBucket;
  draft: number;
  poolTotal: number;
  onSliderChange: (bucketId: string, value: number) => void;
}) {
  const { formatMoney } = useCurrency();
  const theme = bucketTheme(bucket);

  return (
    <div className="py-2">
      <div className="flex items-center gap-3">
        <JarFillVisual size="sm" emoji={bucket.emoji} theme={theme} fillPercent={poolTotal > 0 ? (draft / poolTotal) * 100 : 0} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className={cn("font-heading text-xs font-bold", theme.label)}>{bucket.name}</span>
            <span className="font-heading text-xs font-extrabold text-[#031F82]">{formatMoney(draft)}</span>
          </div>
          <input
            type="range"
            min={0}
            max={poolTotal}
            step={ALLOCATION_STEP}
            value={draft}
            onChange={(e) => onSliderChange(bucket.id, Number.parseFloat(e.target.value))}
            className={cn("mt-1.5 h-1.5 w-full cursor-pointer appearance-none rounded-full", theme.track)}
            style={{ accentColor: theme.accent }}
            aria-label={`Allocate to ${bucket.name}`}
          />
        </div>
      </div>
    </div>
  );
}

function BucketInlinePanel({
  bucket,
  buckets,
  onMove,
  onMarkSpent,
  onClose,
}: {
  bucket: VaultBucket;
  buckets: VaultBucket[];
  onMove: (amount: number, destination: MoveTarget) => void;
  onMarkSpent: (amount: number) => void;
  onClose: () => void;
}) {
  const copy = copyMatrix.dashboard.vault.budget;
  const { formatMoney } = useCurrency();
  const theme = bucketTheme(bucket);
  const [amountInput, setAmountInput] = useState("");
  const [destination, setDestination] = useState<MoveTarget>("pool");
  const showSpent = canMarkBucketAsSpent(bucket);
  const isSave = isSavingsBucket(bucket);

  const destinations = [
    { id: "pool" as const, label: copy.movePoolOption },
    ...buckets.filter((e) => e.id !== bucket.id).map((e) => ({ id: e.id as MoveTarget, label: e.name })),
  ];

  function runMove() {
    const amount = parsePositiveAmount(amountInput);
    if (amount === null || amount > bucket.balance) return;
    onMove(amount, destination);
    setAmountInput("");
    onClose();
  }

  function runSpent() {
    const amount = parsePositiveAmount(amountInput);
    if (amount === null || amount > bucket.balance) return;
    onMarkSpent(amount);
    setAmountInput("");
    onClose();
  }

  return (
    <div className={cn("mt-2 rounded-xl border px-3 py-3", theme.track)}>
      <div className="flex items-center justify-between gap-2">
        <p className={cn("font-heading text-xs font-bold", theme.label)}>
          {bucket.emoji} {bucket.name} · {formatMoney(bucket.balance)}
        </p>
        <button type="button" onClick={onClose} className="font-heading text-[10px] font-bold text-[#1E3A5F]/60">Close</button>
      </div>
      {isSave ? (
        <p className="mt-1 font-sans text-[10px] text-[#1E3A5F]/75">Move only — assign to goals in the section below.</p>
      ) : null}
      <div className="mt-2 flex gap-2">
        <input
          type="number"
          min={0}
          step={ALLOCATION_STEP}
          value={amountInput}
          onChange={(e) => setAmountInput(e.target.value)}
          placeholder="Amount"
          className="min-w-0 flex-1 rounded-lg border border-[#BDE9FB] bg-white px-2 py-1.5 text-sm outline-none focus:border-[#0CC1E0]"
        />
        <select
          value={destination}
          onChange={(e) => setDestination(e.target.value as MoveTarget)}
          className="max-w-[45%] rounded-lg border border-[#BDE9FB] bg-white px-2 py-1.5 text-xs outline-none"
        >
          {destinations.map((d) => (
            <option key={d.id} value={d.id}>{d.label}</option>
          ))}
        </select>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        <button type="button" disabled={bucket.balance <= 0} onClick={runMove} className={tealBtnClass}>
          {copy.moveConfirm}
        </button>
        {showSpent ? (
          <button type="button" disabled={bucket.balance <= 0} onClick={runSpent} className={spendBtnClass}>
            {copy.markAsSpent}
          </button>
        ) : null}
      </div>
    </div>
  );
}

type VaultBudgetHubProps = {
  isPremium: boolean;
  totalBalance: number;
  moneyToAllocate: number;
  buckets: VaultBucket[];
  onDeposit: (amount: number) => void;
  onLockIn: (allocations: Record<string, number>) => void;
  onMove: (fromId: VaultBucketId, destination: MoveTarget, amount: number) => void;
  onMarkSpent: (bucketId: VaultBucketId, amount: number) => void;
  onRenameBucket: (bucketId: VaultBucketId, name: string) => void;
  onAddCustomBucket: () => void;
};

export function VaultBudgetHub({
  isPremium,
  totalBalance,
  moneyToAllocate,
  buckets,
  onDeposit,
  onLockIn,
  onMove,
  onMarkSpent,
  onRenameBucket,
  onAddCustomBucket,
}: VaultBudgetHubProps) {
  const copy = copyMatrix.dashboard.vault.budget;
  const { formatMoney, currencySymbol } = useCurrency();
  const bucketIds = useMemo(() => buckets.map((b) => b.id), [buckets]);
  const maxJarBalance = useMemo(() => Math.max(...buckets.map((b) => b.balance), 1), [buckets]);

  const [depositInput, setDepositInput] = useState("");
  const [allocationDrafts, setAllocationDrafts] = useState<Record<string, number>>({});
  const [premiumModalOpen, setPremiumModalOpen] = useState(false);
  const [balanceExpanded, setBalanceExpanded] = useState(false);
  const [expandedBucketId, setExpandedBucketId] = useState<VaultBucketId | null>(null);
  const [renameBucketId, setRenameBucketId] = useState<VaultBucketId | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const poolTotal = roundAudAmount(Math.max(0, moneyToAllocate));
  const allocatedTotal = sumAllocations(allocationDrafts);
  const remainingTotal = roundAudAmount(Math.max(0, poolTotal - allocatedTotal));
  const isFullyAllocated = poolTotal > 0 && Math.abs(remainingTotal) < 0.01;
  const showAllocation = poolTotal > 0;
  const showBucketsOverview = !showAllocation;
  const expandedBucket = buckets.find((b) => b.id === expandedBucketId) ?? null;

  useEffect(() => {
    if (poolTotal <= 0) setAllocationDrafts({});
  }, [poolTotal]);

  useEffect(() => {
    setAllocationDrafts((current) => {
      const next = { ...current };
      for (const id of bucketIds) if (next[id] === undefined) next[id] = 0;
      for (const id of Object.keys(next)) if (!bucketIds.includes(id as VaultBucketId)) delete next[id];
      return next;
    });
  }, [bucketIds]);

  const handleSliderChange = useCallback(
    (bucketId: string, nextValue: number) => {
      setAllocationDrafts((current) => {
        const others = bucketIds.filter((id) => id !== bucketId).reduce((s, id) => s + (current[id] ?? 0), 0);
        const clamped = roundToHalfStep(Math.min(Math.max(0, nextValue), Math.max(0, poolTotal - others)));
        return { ...current, [bucketId]: clamped };
      });
    },
    [bucketIds, poolTotal],
  );

  function handleDepositSubmit(event: FormEvent) {
    event.preventDefault();
    const amount = parsePositiveAmount(depositInput);
    if (amount === null) return;
    onDeposit(amount);
    setDepositInput("");
  }

  function toggleBucket(bucketId: VaultBucketId) {
    setExpandedBucketId((current) => (current === bucketId ? null : bucketId));
  }

  function startRename(bucket: VaultBucket) {
    if (!canRenameFoundationBucket(bucket, isPremium)) {
      setPremiumModalOpen(true);
      return;
    }
    setRenameBucketId(bucket.id);
    setRenameValue(bucket.name);
  }

  function saveRename() {
    if (!renameBucketId || !renameValue.trim()) return;
    onRenameBucket(renameBucketId, renameValue.trim());
    setRenameBucketId(null);
    setRenameValue("");
  }

  const bucketLimit = maxVaultBuckets(isPremium);
  const canAddMore = canAddVaultBucket(buckets.length, isPremium);

  return (
    <>
      <div className="w-full space-y-5">
        <div>
          <button
            type="button"
            onClick={() => setBalanceExpanded((o) => !o)}
            aria-expanded={balanceExpanded}
            className="flex w-full items-center justify-between gap-3 rounded-xl bg-gradient-to-r from-[#031F82] to-[#0CC1E0]/75 px-4 py-3 text-left text-white shadow-sm"
          >
            <div>
              <p className="font-heading text-[9px] font-bold uppercase tracking-wider text-white/70">
                {copy.totalBalanceLabel}
              </p>
              <p className="font-heading text-2xl font-extrabold leading-tight">{formatMoney(totalBalance)}</p>
              <p className="font-sans text-[10px] text-white/70">{copy.totalBalanceHint}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              {poolTotal > 0 ? (
                <span className="rounded-full bg-[#FFA503] px-2 py-0.5 font-heading text-[9px] font-bold text-[#031F82]">
                  +{formatMoney(poolTotal)}
                </span>
              ) : null}
              <span className="text-white/60">{balanceExpanded ? "▲" : "▼"}</span>
            </div>
          </button>
          {balanceExpanded ? (
            <ul className="mt-1 space-y-1 rounded-b-xl border border-t-0 border-[#BDE9FB]/50 bg-[#F7FBFF]/60 px-3 py-2">
              {buckets.map((bucket) => {
                const theme = bucketTheme(bucket);
                return (
                  <li key={bucket.id} className="flex items-center justify-between gap-2 text-[11px]">
                    <span className={cn("font-heading font-bold", theme.label)}>{bucket.emoji} {bucket.name}</span>
                    <span className="font-heading font-extrabold text-[#031F82]">{formatMoney(bucket.balance)}</span>
                  </li>
                );
              })}
              {poolTotal > 0 ? (
                <li className="flex items-center justify-between gap-2 border-t border-[#BDE9FB]/40 pt-1 text-[11px]">
                  <span className="font-heading font-bold text-[#FFA503]">{copy.poolLabel}</span>
                  <span className="font-heading font-extrabold text-[#FFA503]">{formatMoney(poolTotal)}</span>
                </li>
              ) : null}
            </ul>
          ) : null}
        </div>

        <section aria-label="Deposit income">
          <form onSubmit={handleDepositSubmit} className="space-y-3">
            <h2 className="font-heading text-sm font-extrabold text-[#031F82]">{copy.depositHeading}</h2>
            <div className="flex gap-2">
              <label className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-[#BDE9FB] bg-[#F7FBFF]/50 px-3 py-2.5">
                <span className="font-heading text-sm font-bold text-[#031F82]">{currencySymbol}</span>
                <input
                  type="number"
                  min={0}
                  step={ALLOCATION_STEP}
                  inputMode="decimal"
                  value={depositInput}
                  onChange={(e) => setDepositInput(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-transparent font-sans text-sm text-[#031F82] outline-none"
                />
              </label>
              <button type="submit" className={cn("shrink-0 px-5 py-2.5", orangeCtaClass)}>Add</button>
            </div>
          </form>
        </section>

        {showAllocation ? (
          <section aria-label={copy.sectionTitle} className="space-y-3 border-t border-[#BDE9FB]/40 pt-4">
            <div className="flex items-end justify-between gap-3">
              <h2 className="font-heading text-sm font-extrabold text-[#031F82]">{copy.sectionTitle}</h2>
              {isFullyAllocated ? (
                <span className="rounded-full bg-[#22C55E]/15 px-2 py-0.5 font-heading text-[10px] font-bold text-[#15803D]">
                  {copy.fullyAllocatedLabel}
                </span>
              ) : (
                <p className="font-heading text-xs font-extrabold text-[#FFA503]">
                  {copy.remainingLabel}: {formatMoney(remainingTotal)}
                </p>
              )}
            </div>
            <div className="divide-y divide-[#BDE9FB]/30">
              {buckets.map((bucket) => (
                <AllocationSliderRow
                  key={bucket.id}
                  bucket={bucket}
                  draft={allocationDrafts[bucket.id] ?? 0}
                  poolTotal={poolTotal}
                  onSliderChange={handleSliderChange}
                />
              ))}
            </div>
            <button type="button" onClick={() => onLockIn(allocationDrafts)} disabled={!isFullyAllocated} className={cn("h-touch w-full px-4 py-2.5", orangeCtaClass)}>
              {copy.lockItIn}
            </button>
          </section>
        ) : null}

        {showBucketsOverview ? (
          <section aria-label={copy.bucketsOverviewTitle} className="border-t border-[#BDE9FB]/40 pt-4">
            <h2 className="font-heading text-sm font-extrabold text-[#031F82]">{copy.bucketsOverviewTitle}</h2>
            <div className={cn("mt-3 grid gap-2", buckets.length <= 3 ? "grid-cols-3" : "grid-cols-3 sm:grid-cols-4")}>
              {buckets.map((bucket) => {
                const theme = bucketTheme(bucket);
                const isActive = expandedBucketId === bucket.id;
                return (
                  <button
                    key={bucket.id}
                    type="button"
                    onClick={() => toggleBucket(bucket.id)}
                    aria-expanded={isActive}
                    className={cn(
                      "flex flex-col items-center rounded-xl px-1 py-2 transition-colors",
                      isActive ? theme.track : "hover:bg-[#F7FBFF]",
                    )}
                  >
                    <JarFillVisual size="sm" emoji={bucket.emoji} theme={theme} fillPercent={jarFillPercent(bucket.balance, maxJarBalance)} />
                    <p className={cn("mt-1 font-heading text-[9px] font-bold leading-tight", theme.label)}>{bucket.name}</p>
                    <p className="font-heading text-[11px] font-extrabold text-[#031F82]">{formatMoney(bucket.balance)}</p>
                  </button>
                );
              })}
            </div>

            {expandedBucket ? (
              <BucketInlinePanel
                bucket={expandedBucket}
                buckets={buckets}
                onMove={(amount, dest) => onMove(expandedBucket.id, dest, amount)}
                onMarkSpent={(amount) => onMarkSpent(expandedBucket.id, amount)}
                onClose={() => setExpandedBucketId(null)}
              />
            ) : null}

            <div className="mt-2 flex flex-wrap items-center gap-3">
              {expandedBucket && renameBucketId !== expandedBucket.id ? (
                <button type="button" onClick={() => startRename(expandedBucket)} className="font-heading text-[10px] font-bold text-[#0CC1E0]">
                  {copy.renameBucket}
                </button>
              ) : null}
              {renameBucketId ? (
                <input
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onBlur={saveRename}
                  onKeyDown={(e) => { if (e.key === "Enter") saveRename(); if (e.key === "Escape") setRenameBucketId(null); }}
                  className="rounded border border-[#BDE9FB] px-2 py-0.5 text-xs font-bold outline-none"
                  autoFocus
                />
              ) : null}
              <button type="button" onClick={onAddCustomBucket} disabled={!canAddMore} className="font-heading text-[10px] font-bold text-[#DCB766] disabled:opacity-40">
                + {copy.addCustomBucket} ({buckets.length}/{bucketLimit})
              </button>
            </div>
          </section>
        ) : null}
      </div>

      <PremiumRenameModal isOpen={premiumModalOpen} onClose={() => setPremiumModalOpen(false)} />
    </>
  );
}
