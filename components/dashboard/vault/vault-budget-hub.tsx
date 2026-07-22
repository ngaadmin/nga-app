"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import { ModalShell } from "@/components/ui/modal-shell";
import { copyMatrix } from "@/constants/copyMatrix";
import { useCurrency } from "@/lib/dashboard/currency-context";
import { roundAudAmount, roundToHalfStep } from "@/lib/dashboard/destination-jars";
import {
  MAX_CUSTOM_VAULT_BUCKETS,
  canMarkBucketAsSpent,
  clampAllocationDrafts,
  sumAllocations,
  type VaultBucket,
  type VaultBucketId,
} from "@/lib/dashboard/vault-buckets";
import { cn } from "@/lib/utils/cn";

const floatingPanelClass = "rounded-2xl border-0 bg-white shadow-md";

const orangeCtaClass =
  "rounded-nga-lg border-b-4 border-[#C88202] bg-[#FFA503] font-heading text-xs font-bold uppercase tracking-wide text-[#031F82] transition-all hover:brightness-[1.02] active:translate-y-[2px] active:border-b-2 disabled:cursor-not-allowed disabled:opacity-40 disabled:active:translate-y-0 sm:text-sm";

const tealOutlineClass =
  "rounded-nga-lg border-2 border-[#0CC1E0] bg-white px-3 py-2 font-heading text-xs font-bold text-[#031F82] transition-colors hover:bg-[#BDE9FB]/25 active:bg-[#BDE9FB]/40";

const ALLOCATION_STEP = 0.5;

function parsePositiveAmount(rawValue: string): number | null {
  const trimmed = rawValue.trim();
  if (!trimmed) return null;
  const parsed = Number.parseFloat(trimmed);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return roundToHalfStep(parsed);
}

function ChevronIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <svg
      className={cn(
        "size-4 shrink-0 text-[#0CC1E0] transition-transform duration-300",
        isOpen && "rotate-180",
      )}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M6 9l6 6 6-6"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type PremiumVaultModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

function PremiumVaultModal({ isOpen, onClose }: PremiumVaultModalProps) {
  const copy = copyMatrix.dashboard.vault.budget;

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      labelledBy="premium-vault-title"
      backdropClassName="bg-[#031F82]/45"
      panelClassName="max-w-sm rounded-nga-xl bg-white p-5 shadow-nga-pop sm:p-6"
    >
      <p className="font-heading text-xs font-bold uppercase tracking-wide text-[#DCB766]">
        Premium unlock
      </p>
      <h2
        id="premium-vault-title"
        className="mt-2 font-heading text-xl font-extrabold text-[#031F82] sm:text-2xl"
      >
        {copy.premiumModalTitle}
      </h2>
      <p className="mt-3 font-sans text-sm leading-relaxed text-[#1E3A5F]">
        {copy.premiumModalBody}
      </p>
      <button type="button" className={cn("mt-5 h-touch w-full px-4 shadow-nga-pop", orangeCtaClass)}>
        {copy.premiumUnlock}
      </button>
      <button
        type="button"
        onClick={onClose}
        className="mt-3 w-full rounded-nga-lg px-4 py-2 font-heading text-sm font-bold text-[#0CC1E0] transition-colors hover:bg-[#BDE9FB]/40"
      >
        {copy.premiumLater}
      </button>
    </ModalShell>
  );
}

export type MoveTarget = VaultBucketId | "pool";

type MoveMoneyModalProps = {
  isOpen: boolean;
  bucket: VaultBucket | null;
  buckets: VaultBucket[];
  onClose: () => void;
  onConfirm: (amount: number, destination: MoveTarget) => void;
};

function MoveMoneyModal({
  isOpen,
  bucket,
  buckets,
  onClose,
  onConfirm,
}: MoveMoneyModalProps) {
  const copy = copyMatrix.dashboard.vault.budget;
  const { formatMoney } = useCurrency();
  const [amountInput, setAmountInput] = useState("");
  const [destination, setDestination] = useState<MoveTarget>("pool");

  useEffect(() => {
    if (!isOpen) return;
    setAmountInput("");
    setDestination("pool");
  }, [isOpen, bucket?.id]);

  if (!isOpen || !bucket) return null;

  const destinations = [
    { id: "pool" as const, label: copy.movePoolOption, emoji: "💵" },
    ...buckets
      .filter((entry) => entry.id !== bucket.id)
      .map((entry) => ({
        id: entry.id as MoveTarget,
        label: entry.name,
        emoji: entry.emoji,
      })),
  ];

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!bucket) return;
    const amount = parsePositiveAmount(amountInput);
    if (amount === null || amount > bucket.balance) return;
    onConfirm(amount, destination);
    onClose();
  }

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      labelledBy="move-money-title"
      backdropClassName="bg-[#031F82]/45"
      panelClassName="max-w-sm rounded-2xl bg-white p-5 shadow-md"
    >
      <h2 id="move-money-title" className="font-heading text-lg font-extrabold text-[#031F82]">
        {copy.moveTitle}
      </h2>
      <p className="mt-1 font-sans text-sm text-[#1E3A5F]">
        From {bucket.emoji} {bucket.name} ({formatMoney(bucket.balance)} available)
      </p>
      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <label className="block">
          <span className="font-heading text-xs font-bold text-[#031F82]">
            {copy.moveAmountLabel}
          </span>
          <input
            type="number"
            min={0}
            step={ALLOCATION_STEP}
            inputMode="decimal"
            value={amountInput}
            onChange={(event) => setAmountInput(event.target.value)}
            className="mt-1 w-full rounded-xl border-2 border-[#BDE9FB] bg-[#F7FBFF] px-3 py-2 font-sans text-sm text-[#031F82] outline-none focus:border-[#0CC1E0]"
          />
        </label>
        <label className="block">
          <span className="font-heading text-xs font-bold text-[#031F82]">
            {copy.moveDestinationLabel}
          </span>
          <select
            value={destination}
            onChange={(event) => setDestination(event.target.value as MoveTarget)}
            className="mt-1 w-full rounded-xl border-2 border-[#BDE9FB] bg-[#F7FBFF] px-3 py-2 font-sans text-sm text-[#031F82] outline-none focus:border-[#0CC1E0]"
          >
            {destinations.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.emoji} {entry.label}
              </option>
            ))}
          </select>
        </label>
        <div className="flex gap-2 pt-1">
          <button type="submit" className={cn("flex-1 py-2.5", orangeCtaClass)}>
            {copy.moveConfirm}
          </button>
          <button type="button" onClick={onClose} className={cn("flex-1", tealOutlineClass)}>
            {copy.moveCancel}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

type VaultBudgetHubProps = {
  isOpen: boolean;
  onToggle: () => void;
  isPremium: boolean;
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
  isOpen,
  onToggle,
  isPremium,
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
  const bucketIds = useMemo(() => buckets.map((bucket) => bucket.id), [buckets]);

  const [depositInput, setDepositInput] = useState("");
  const [allocationDrafts, setAllocationDrafts] = useState<Record<string, number>>({});
  const [premiumModalOpen, setPremiumModalOpen] = useState(false);
  const [moveBucket, setMoveBucket] = useState<VaultBucket | null>(null);
  const [renameBucketId, setRenameBucketId] = useState<VaultBucketId | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const poolTotal = roundAudAmount(Math.max(0, moneyToAllocate));
  const allocatedTotal = sumAllocations(allocationDrafts);
  const isFullyAllocated =
    poolTotal > 0 && Math.abs(allocatedTotal - poolTotal) < 0.01;
  const allocationProgress =
    poolTotal > 0 ? Math.min(100, (allocatedTotal / poolTotal) * 100) : 0;

  useEffect(() => {
    if (poolTotal <= 0) {
      setAllocationDrafts({});
      return;
    }
    setAllocationDrafts((current) =>
      clampAllocationDrafts(current, bucketIds, poolTotal),
    );
  }, [bucketIds, poolTotal]);

  const handleSliderChange = useCallback(
    (bucketId: string, nextValue: number) => {
      setAllocationDrafts((current) => {
        const others = bucketIds
          .filter((id) => id !== bucketId)
          .reduce((sum, id) => sum + (current[id] ?? 0), 0);
        const maxForBucket = Math.max(0, poolTotal - others);
        const clamped = roundToHalfStep(Math.min(Math.max(0, nextValue), maxForBucket));
        return clampAllocationDrafts(
          { ...current, [bucketId]: clamped },
          bucketIds,
          poolTotal,
        );
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

  function handleLockIn() {
    if (!isFullyAllocated) return;
    onLockIn(allocationDrafts);
    setAllocationDrafts({});
  }

  function requestPremiumFeature(action: () => void) {
    if (isPremium) {
      action();
      return;
    }
    setPremiumModalOpen(true);
  }

  function startRename(bucket: VaultBucket) {
    requestPremiumFeature(() => {
      setRenameBucketId(bucket.id);
      setRenameValue(bucket.name);
    });
  }

  function saveRename() {
    if (!renameBucketId || !renameValue.trim()) return;
    onRenameBucket(renameBucketId, renameValue.trim());
    setRenameBucketId(null);
    setRenameValue("");
  }

  function handleMarkSpent(bucket: VaultBucket) {
    if (!canMarkBucketAsSpent(bucket) || bucket.balance <= 0) return;
    onMarkSpent(bucket.id, bucket.balance);
  }

  return (
    <>
      <section aria-label={copy.hubTitle} className="w-full space-y-3">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={isOpen}
          aria-controls="budget-hub-panel"
          className={cn(
            floatingPanelClass,
            "flex w-full items-center gap-3 p-4 text-left transition-all hover:shadow-lg active:scale-[0.99]",
            isOpen && "ring-2 ring-[#0CC1E0]/25",
          )}
        >
          <span
            className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#BDE9FB]/25"
            aria-hidden
          >
            <Image
              src="/dashboard/money-bag.svg"
              alt=""
              width={26}
              height={26}
              className="size-6"
            />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-heading text-sm font-extrabold text-[#031F82]">
              {copy.hubTitle}
            </p>
            <p className="mt-0.5 font-sans text-xs text-[#1E3A5F]">
              {formatMoney(moneyToAllocate)} {copy.poolLabel.toLowerCase()}
            </p>
          </div>
          <ChevronIcon isOpen={isOpen} />
        </button>

        <div
          id="budget-hub-panel"
          className={cn(
            "grid transition-all duration-300 ease-in-out",
            isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
          )}
          aria-hidden={!isOpen}
        >
          <div className="overflow-hidden">
            <div className="space-y-4">
              <form
                onSubmit={handleDepositSubmit}
                className={cn(floatingPanelClass, "space-y-3 p-4")}
              >
                <h3 className="font-heading text-base font-extrabold text-[#031F82]">
                  {copy.depositHeading}
                </h3>
                <label className="flex items-center gap-2 rounded-xl bg-[#BDE9FB]/20 px-3 py-2.5">
                  <span className="font-heading text-sm font-bold text-[#031F82]">
                    {currencySymbol}
                  </span>
                  <input
                    type="number"
                    min={0}
                    step={ALLOCATION_STEP}
                    inputMode="decimal"
                    value={depositInput}
                    onChange={(event) => setDepositInput(event.target.value)}
                    placeholder="0.00"
                    className="w-full min-w-0 bg-transparent font-sans text-sm text-[#031F82] outline-none"
                    aria-label="Deposit amount"
                  />
                </label>
                <button type="submit" className={cn("h-touch w-full px-4", orangeCtaClass)}>
                  {copy.depositButton}
                </button>
              </form>

              <article className={cn(floatingPanelClass, "p-4 text-center")}>
                <p className="font-heading text-[10px] font-bold uppercase tracking-wide text-[#0CC1E0]">
                  {copy.poolLabel}
                </p>
                <p className="mt-1 font-heading text-2xl font-extrabold text-[#031F82]">
                  {formatMoney(poolTotal)}
                </p>
                <p className="mt-2 font-sans text-[10px] leading-relaxed text-[#1E3A5F]/80">
                  {copy.poolDisclaimer}
                </p>
                <p className="mt-1 font-sans text-[10px] italic leading-relaxed text-[#1E3A5F]/60">
                  {copy.currencySettingsNote}
                </p>
              </article>

              {poolTotal > 0 ? (
                <div className={cn(floatingPanelClass, "space-y-3 p-4")}>
                  <p className="font-heading text-xs font-bold uppercase tracking-wide text-[#0CC1E0]">
                    Split your deposit
                  </p>
                  {buckets.map((bucket) => {
                    const draft = allocationDrafts[bucket.id] ?? 0;
                    const others = allocatedTotal - draft;
                    const maxForSlider = Math.max(0, poolTotal - others);

                    return (
                      <div
                        key={`alloc-${bucket.id}`}
                        className="rounded-xl bg-[#F7FBFF] px-3 py-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-heading text-sm font-bold text-[#031F82]">
                            {bucket.emoji} {bucket.name}
                          </span>
                          <span className="font-heading text-sm font-extrabold text-[#0CC1E0]">
                            {formatMoney(draft)}
                          </span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={maxForSlider || poolTotal}
                          step={ALLOCATION_STEP}
                          value={draft}
                          onChange={(event) =>
                            handleSliderChange(
                              bucket.id,
                              Number.parseFloat(event.target.value),
                            )
                          }
                          className="mt-2 h-2 w-full cursor-pointer appearance-none rounded-full bg-[#BDE9FB]/60 accent-[#FFA503]"
                          aria-label={`Allocate to ${bucket.name}`}
                        />
                        <p className="mt-1 font-sans text-[10px] text-[#1E3A5F]/70">
                          {copy.fromPoolLabel}
                        </p>
                      </div>
                    );
                  })}

                  <div className="pt-1">
                    <p className="font-heading text-xs font-bold text-[#031F82]">
                      {copy.allocatedTemplate
                        .replace("{allocated}", formatMoney(allocatedTotal))
                        .replace("{total}", formatMoney(poolTotal))}
                    </p>
                    <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-[#BDE9FB]/40">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-300",
                          isFullyAllocated
                            ? "bg-[#22C55E]"
                            : "bg-gradient-to-r from-[#0CC1E0] to-[#FFA503]",
                        )}
                        style={{ width: `${allocationProgress}%` }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleLockIn}
                      disabled={!isFullyAllocated}
                      className={cn("mt-3 h-touch w-full px-4", orangeCtaClass)}
                    >
                      {copy.lockItIn}
                    </button>
                  </div>
                </div>
              ) : null}

              <div className="space-y-3">
                {buckets.map((bucket) => (
                  <article
                    key={bucket.id}
                    className={cn(floatingPanelClass, "p-4")}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xl" aria-hidden>
                            {bucket.emoji}
                          </span>
                          {renameBucketId === bucket.id ? (
                            <input
                              value={renameValue}
                              onChange={(event) => setRenameValue(event.target.value)}
                              onBlur={saveRename}
                              onKeyDown={(event) => {
                                if (event.key === "Enter") saveRename();
                                if (event.key === "Escape") setRenameBucketId(null);
                              }}
                              className="rounded-lg border border-[#BDE9FB] px-2 py-0.5 font-heading text-sm font-bold text-[#031F82] outline-none focus:border-[#0CC1E0]"
                              autoFocus
                            />
                          ) : (
                            <h4 className="font-heading text-sm font-extrabold text-[#031F82]">
                              {bucket.name}
                            </h4>
                          )}
                          <button
                            type="button"
                            onClick={() => startRename(bucket)}
                            className="font-heading text-[10px] font-bold uppercase tracking-wide text-[#0CC1E0] hover:text-[#031F82]"
                            aria-label={`${copy.renameBucket} ${bucket.name}`}
                          >
                            {copy.renameBucket}
                          </button>
                        </div>
                        <p className="mt-1 font-heading text-lg font-extrabold text-[#031F82]">
                          {copy.inJarTemplate.replace(
                            "{amount}",
                            formatMoney(bucket.balance),
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={bucket.balance <= 0}
                        onClick={() => setMoveBucket(bucket)}
                        className={cn(tealOutlineClass, "disabled:opacity-40")}
                      >
                        {copy.move}
                      </button>
                      {canMarkBucketAsSpent(bucket) ? (
                        <button
                          type="button"
                          disabled={bucket.balance <= 0}
                          onClick={() => handleMarkSpent(bucket)}
                          className={cn(
                            "rounded-nga-lg border-2 border-[#E11D48] bg-[#FDA4AF]/40 px-3 py-2 font-heading text-xs font-bold text-[#031F82] transition-colors hover:bg-[#FDA4AF]/60 disabled:opacity-40",
                          )}
                        >
                          {copy.markAsSpent}
                        </button>
                      ) : null}
                    </div>
                  </article>
                ))}

                <button
                  type="button"
                  onClick={() =>
                    requestPremiumFeature(() => {
                      if (
                        buckets.filter((entry) => !entry.isFoundation).length >=
                        MAX_CUSTOM_VAULT_BUCKETS
                      ) {
                        return;
                      }
                      onAddCustomBucket();
                    })
                  }
                  className={cn(
                    floatingPanelClass,
                    "flex w-full items-center justify-center gap-2 border border-dashed border-[#DCB766]/50 p-4 text-center transition-all hover:shadow-md active:scale-[0.99]",
                  )}
                >
                  <span className="font-heading text-xl font-bold text-[#DCB766]">+</span>
                  <span className="font-heading text-sm font-bold text-[#031F82]">
                    {copy.addCustomBucket}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <PremiumVaultModal
        isOpen={premiumModalOpen}
        onClose={() => setPremiumModalOpen(false)}
      />

      <MoveMoneyModal
        isOpen={moveBucket !== null}
        bucket={moveBucket}
        buckets={buckets}
        onClose={() => setMoveBucket(null)}
        onConfirm={(amount, destination) => {
          if (!moveBucket) return;
          onMove(moveBucket.id, destination, amount);
        }}
      />
    </>
  );
}
