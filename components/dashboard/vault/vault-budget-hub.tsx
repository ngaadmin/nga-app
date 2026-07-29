"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { ModalShell } from "@/components/ui/modal-shell";
import {
  JarFillVisual,
  BucketEmojiIcon,
  BucketPieChart,
  BucketPieLegend,
  bucketTheme,
} from "@/components/dashboard/vault/vault-visuals";
import {
  FuturePotentialCalculator,
  FuturePotentialCompactButton,
} from "@/components/dashboard/vault/vault-future-potential";
import { copyMatrix } from "@/constants/copyMatrix";
import { useCurrency } from "@/lib/dashboard/currency-context";
import { roundAudAmount, SAVINGS_JAR_ID } from "@/lib/dashboard/destination-jars";
import {
  parsePositiveVaultAmount,
  capAllocationDrafts,
  clampVaultAllocationEntry,
  isVaultAllocationComplete,
  sumAllocationDraftValues,
  vaultAllocationRemaining,
} from "@/lib/dashboard/vault-amount-input";
import {
  canAddVaultBucket,
  canRenameFoundationBucket,
  isCustomBucketId,
  maxVaultBuckets,
  sumAllocations,
  savingsBucketDisplayBalance,
  withSavingsBucketDisplayTotal,
  type VaultBucket,
  type VaultBucketId,
} from "@/lib/dashboard/vault-buckets";
import { SaveJarExpandedPanel, VaultSavingsGoalsSection } from "@/components/dashboard/vault/vault-save-jar-panel";
import { BucketExpandedPanel } from "@/components/dashboard/vault/vault-bucket-expanded-panel";
import { VaultAllocationMeter } from "@/components/dashboard/vault/vault-allocation-meter";
import { VaultExpandableSectionHeader } from "@/components/dashboard/vault/vault-expandable-section-header";
import type { SpendingCategory, SpendingCategoryId } from "@/lib/dashboard/spending-categories";
import type { SavingsGoal, SavingsGoalId } from "@/lib/dashboard/savings-goals";
import type { VaultTransferLocationId } from "@/lib/dashboard/vault-transfer";
import {
  DEFAULT_VAULT_INCOME_SOURCE_ID,
  VAULT_INCOME_SOURCES,
  type VaultIncomeSourceId,
} from "@/lib/dashboard/vault-income-sources";
import { useAutoExpandOnIncrease } from "@/lib/dashboard/use-auto-expand-on-increase";
import { cn } from "@/lib/utils/cn";

const orangeCtaClass =
  "rounded-nga-lg border-b-4 border-[#C88202] bg-[#FFA503] font-heading text-xs font-bold uppercase tracking-wide text-[#031F82] transition-all hover:brightness-[1.02] active:translate-y-[2px] active:border-b-2 disabled:cursor-not-allowed disabled:opacity-40";

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

export type { VaultTransferLocationId } from "@/lib/dashboard/vault-transfer";

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
  const { formatMoney, currencySymbol } = useCurrency();
  const theme = bucketTheme(bucket);

  return (
    <div className="py-2.5">
      <p className={cn("mb-1.5 truncate font-heading text-xs font-bold", theme.label)}>
        {bucket.name}
      </p>
      <div className="flex min-w-0 items-center gap-2">
        <div className="shrink-0 self-center">
          <JarFillVisual
            size="sm"
            emoji={bucket.emoji}
            theme={theme}
            fillPercent={poolTotal > 0 ? (draft / poolTotal) * 100 : 0}
          />
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
            aria-label={`Amount to allocate to ${bucket.name}`}
            className="min-w-0 flex-1 bg-transparent text-right font-sans text-sm tabular-nums text-[#031F82] outline-none"
          />
        </label>
        <div className="min-w-0 flex-1">
          <VaultAllocationMeter
            value={draft}
            poolTotal={poolTotal}
            accentColor={theme.accent}
            trackClassName={theme.track}
            ariaLabel={`${bucket.name} allocation: ${formatMoney(draft)} of ${formatMoney(poolTotal)}`}
            className="[&>div]:min-h-7 [&>div]:px-1 [&>div]:py-0"
          />
        </div>
      </div>
    </div>
  );
}

type VaultBudgetHubProps = {
  isPremium: boolean;
  totalBalance: number;
  moneyToAllocate: number;
  buckets: VaultBucket[];
  totalSavings: number;
  futureSavingsPotential: number;
  futureSubtext: string;
  calculatorOpen: boolean;
  onToggleCalculator: () => void;
  onCloseCalculator: () => void;
  calculatorPanel: ReactNode;
  goals: SavingsGoal[];
  onDeposit: (amount: number, source: VaultIncomeSourceId) => void;
  onLockIn: (allocations: Record<string, number>) => void;
  onVaultTransfer: (
    from: VaultTransferLocationId,
    to: VaultTransferLocationId,
    amount: number,
  ) => void;
  onMarkSpent: (bucketId: VaultBucketId, amount: number, categoryLabel: string) => void;
  spendingCategories: SpendingCategory[];
  onAddCustomSpendingCategory: (label: string) => void;
  onRenameSpendingCategory: (categoryId: SpendingCategoryId, label: string) => void;
  onAddGoal: (name: string, targetAmount: number) => void;
  onUpdateGoalTarget: (goalId: SavingsGoalId, targetAmount: number) => void;
  onAssignGoals: (allocations: Record<string, number>) => void;
  onSpendFromGoal: (goalId: SavingsGoalId, amount: number, note?: string) => void;
  onRenameBucket: (bucketId: VaultBucketId, name: string) => void;
  onAddCustomBucket: () => void;
  onDeleteCustomBucket: (bucketId: VaultBucketId) => void;
};

export function VaultBudgetHub({
  isPremium,
  totalBalance,
  moneyToAllocate,
  buckets,
  totalSavings,
  futureSavingsPotential,
  futureSubtext,
  calculatorOpen,
  onToggleCalculator,
  onCloseCalculator,
  calculatorPanel,
  goals,
  onDeposit,
  onLockIn,
  onVaultTransfer,
  onMarkSpent,
  spendingCategories,
  onAddCustomSpendingCategory,
  onRenameSpendingCategory,
  onAddGoal,
  onUpdateGoalTarget,
  onAssignGoals,
  onSpendFromGoal,
  onRenameBucket,
  onAddCustomBucket,
  onDeleteCustomBucket,
}: VaultBudgetHubProps) {
  const copy = copyMatrix.dashboard.vault.budget;
  const { formatMoney, currencySymbol } = useCurrency();
  const bucketIds = useMemo(() => buckets.map((b) => b.id), [buckets]);

  const [depositInput, setDepositInput] = useState("");
  const [incomeSource, setIncomeSource] = useState<VaultIncomeSourceId>(
    DEFAULT_VAULT_INCOME_SOURCE_ID,
  );
  const [allocationInputs, setAllocationInputs] = useState<Record<string, string>>({});
  const [focusedAllocationBucketId, setFocusedAllocationBucketId] = useState<string | null>(
    null,
  );
  const [allocationDrafts, setAllocationDrafts] = useState<Record<string, number>>({});
  const [allocationSectionOpen, setAllocationSectionOpen] = useState(false);
  const [premiumModalOpen, setPremiumModalOpen] = useState(false);
  const [expandedBucketId, setExpandedBucketId] = useState<VaultBucketId | null>(null);
  const [renameBucketId, setRenameBucketId] = useState<VaultBucketId | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const poolTotal = roundAudAmount(Math.max(0, moneyToAllocate));
  const saveJarBucket = buckets.find((bucket) => bucket.id === SAVINGS_JAR_ID);
  const unassignedSavings = roundAudAmount(Math.max(0, saveJarBucket?.balance ?? 0));
  const allocatedTotal = sumAllocations(allocationDrafts);
  const remainingTotal = vaultAllocationRemaining(allocatedTotal, poolTotal);
  const isFullyAllocated = isVaultAllocationComplete(allocatedTotal, poolTotal);
  const hasAllocationDraft = allocatedTotal > 0;
  const expandedBucket = buckets.find((b) => b.id === expandedBucketId) ?? null;

  useAutoExpandOnIncrease(poolTotal, setAllocationSectionOpen);

  const displayBuckets = useMemo(
    () => withSavingsBucketDisplayTotal(buckets, totalSavings),
    [buckets, totalSavings],
  );

  useEffect(() => {
    if (poolTotal <= 0) {
      setAllocationDrafts({});
      return;
    }

    setAllocationDrafts((current) => {
      if (sumAllocationDraftValues(current) <= poolTotal) return current;
      return capAllocationDrafts(current, poolTotal, bucketIds);
    });
  }, [bucketIds, poolTotal]);

  useEffect(() => {
    setAllocationDrafts((current) => {
      const next = { ...current };
      for (const id of bucketIds) if (next[id] === undefined) next[id] = 0;
      for (const id of Object.keys(next)) if (!bucketIds.includes(id as VaultBucketId)) delete next[id];
      return next;
    });
  }, [bucketIds]);

  useEffect(() => {
    if (poolTotal <= 0) {
      setAllocationInputs({});
      setFocusedAllocationBucketId(null);
    }
  }, [poolTotal]);

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
  }, [allocatedTotal, allocationDrafts, onLockIn]);

  function handleDepositSubmit(event: FormEvent) {
    event.preventDefault();
    const amount = parsePositiveVaultAmount(depositInput);
    if (amount === null) return;
    onDeposit(amount, incomeSource);
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

  function handleDeleteBucket(bucket: VaultBucket) {
    if (!isCustomBucketId(bucket.id) || bucket.balance > 0) return;
    onDeleteCustomBucket(bucket.id);
    setExpandedBucketId(null);
  }

  const bucketLimit = maxVaultBuckets(isPremium);
  const canAddMore = canAddVaultBucket(buckets.length, isPremium);

  function scrollToAllocationSection() {
    setAllocationSectionOpen(true);
    document
      .getElementById("vault-allocation-section")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const allocationBadge = isFullyAllocated ? (
    <span className="rounded-full bg-[#22C55E]/15 px-2.5 py-0.5 font-heading text-xs font-bold text-[#15803D]">
      {copy.fullyAllocatedLabel}
    </span>
  ) : (
    <div className="text-right">
      <p className="font-heading text-xs font-bold uppercase tracking-wide text-[#FFA503]">
        {copy.remainingLabel}
      </p>
      <p className="mt-0.5 font-heading text-2xl font-extrabold leading-none tabular-nums text-[#031F82]">
        {formatMoney(remainingTotal)}
      </p>
    </div>
  );

  return (
    <>
      <div className="w-full min-w-0 space-y-6 overflow-x-hidden">
        <div className="flex min-w-0 items-stretch gap-2">
          <div className="flex min-h-full min-w-0 flex-[2] flex-col rounded-xl border border-white/10 bg-gradient-to-br from-[#3D5F8C] to-[#2E4A72] p-3 text-white shadow-sm">
            <div className="grid flex-1 grid-rows-[auto_auto_minmax(0,1fr)] gap-1.5">
              <p className="font-heading text-[10px] font-bold uppercase tracking-wide text-white/65">
                {copy.totalBalanceLabel}
              </p>
              <div className="flex items-end justify-between gap-2">
                <p className="font-heading text-xl font-extrabold leading-none">
                  {formatMoney(totalBalance)}
                </p>
                {poolTotal > 0 ? (
                  <button
                    type="button"
                    onClick={scrollToAllocationSection}
                    aria-label={copy.toAllocateAriaLabel.replace(
                      "{amount}",
                      formatMoney(poolTotal),
                    )}
                    className="shrink-0 rounded-full bg-[#FFA503] px-2 py-1 text-center font-heading text-[10px] font-bold leading-tight text-[#031F82] transition-all hover:brightness-105 active:scale-[0.98]"
                  >
                    <span className="block tabular-nums">
                      {copy.toAllocateAmountTemplate.replace(
                        "{amount}",
                        formatMoney(poolTotal),
                      )}
                    </span>
                    <span className="block">{copy.toAllocateActionLabel}</span>
                  </button>
                ) : null}
              </div>
              <div className="grid min-h-0 grid-cols-[3.25rem_minmax(0,1fr)] items-center gap-2">
                <BucketPieChart buckets={displayBuckets} size={52} />
                <BucketPieLegend buckets={displayBuckets} layout="vertical" />
              </div>
            </div>
          </div>
          <FuturePotentialCompactButton
            className="min-w-0 flex-1"
            totalSavings={totalSavings}
            futureSavingsPotential={futureSavingsPotential}
            futureSubtext={futureSubtext}
            isOpen={calculatorOpen}
            onToggle={onToggleCalculator}
          />
        </div>
        <FuturePotentialCalculator
          isOpen={calculatorOpen}
          calculatorPanel={calculatorPanel}
          onClose={onCloseCalculator}
        />

        <section aria-label="Deposit income">
          <form onSubmit={handleDepositSubmit} className="space-y-3">
            <h2 className="font-heading text-base font-extrabold text-[#031F82]">{copy.depositHeading}</h2>
            <div className="grid min-w-0 grid-cols-[minmax(8rem,9.25rem)_minmax(0,1fr)_auto] items-stretch gap-2">
              <label className="flex min-w-0 items-center gap-1.5 rounded-xl border border-[#BDE9FB] bg-white px-2.5 py-3">
                <span className="shrink-0 font-heading text-base font-bold text-[#031F82]">{currencySymbol}</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={depositInput}
                  onChange={(event) => {
                    const next = event.target.value;
                    if (next === "" || /^\d*\.?\d*$/.test(next)) {
                      setDepositInput(next);
                    }
                  }}
                  placeholder="0.00"
                  aria-label={copy.depositHeading}
                  className="min-w-0 flex-1 bg-transparent font-sans text-base text-[#031F82] outline-none"
                />
              </label>
              <select
                value={incomeSource}
                onChange={(event) =>
                  setIncomeSource(event.target.value as VaultIncomeSourceId)
                }
                aria-label="Income source"
                className="min-w-0 rounded-xl border border-[#BDE9FB] bg-white px-3 py-3 font-sans text-base text-[#031F82] outline-none focus:border-[#0CC1E0]"
              >
                {VAULT_INCOME_SOURCES.map((source) => (
                  <option key={source.id} value={source.id}>
                    {source.label}
                  </option>
                ))}
              </select>
              <button type="submit" className={cn("shrink-0 px-5 py-3", orangeCtaClass)}>Add</button>
            </div>
            <p className="font-sans text-xs leading-snug text-[#1E3A5F]/70">
              {copy.depositSectionDisclaimer}
            </p>
          </form>
        </section>

        <section
          id="vault-allocation-section"
          aria-label={copy.sectionTitle}
          className="scroll-mt-4 space-y-4 border-t border-[#BDE9FB]/40 pt-5"
        >
          <VaultExpandableSectionHeader
            title={copy.sectionTitle}
            isOpen={allocationSectionOpen}
            onToggle={() => setAllocationSectionOpen((open) => !open)}
            onClose={() => setAllocationSectionOpen(false)}
            badge={allocationBadge}
          />
          <div
            className={cn(
              "grid transition-all duration-300 ease-in-out",
              allocationSectionOpen
                ? "grid-rows-[1fr] opacity-100"
                : "grid-rows-[0fr] opacity-0",
            )}
            aria-hidden={!allocationSectionOpen}
          >
            <div className="space-y-4 overflow-hidden">
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
              <button
                type="button"
                onClick={handleLockInSubmit}
                disabled={!hasAllocationDraft}
                className={cn("h-touch w-full px-4 py-2.5", orangeCtaClass)}
              >
                {copy.lockItIn}
              </button>
            </div>
          </div>
        </section>

        <VaultSavingsGoalsSection
          unassignedSavings={unassignedSavings}
          buckets={buckets}
          isPremium={isPremium}
          goals={goals}
          onAddGoal={onAddGoal}
          onUpdateGoalTarget={onUpdateGoalTarget}
          onAssignGoals={onAssignGoals}
          onSpendFromGoal={onSpendFromGoal}
          onVaultTransfer={onVaultTransfer}
        />

        <section aria-label={copy.bucketsOverviewTitle} className="border-t border-[#BDE9FB]/40 pt-5">
            <h2 className="font-heading text-base font-extrabold text-[#031F82]">{copy.bucketsOverviewTitle}</h2>
            <div className={cn("mt-3 grid gap-2", buckets.length <= 3 ? "grid-cols-3" : "grid-cols-3 sm:grid-cols-4")}>
              {buckets.map((bucket) => {
                const theme = bucketTheme(bucket);
                const isActive = expandedBucketId === bucket.id;
                const shownBalance = savingsBucketDisplayBalance(bucket, totalSavings);
                return (
                  <button
                    key={bucket.id}
                    type="button"
                    onClick={() => toggleBucket(bucket.id)}
                    aria-expanded={isActive}
                    className={cn(
                      "flex flex-col items-center rounded-xl border-2 px-1 py-2 transition-colors",
                      isActive ? "bg-transparent" : "border-transparent hover:bg-[#F7FBFF]",
                    )}
                    style={isActive ? { borderColor: theme.accent } : undefined}
                  >
                    <BucketEmojiIcon size="lg" emoji={bucket.emoji} theme={theme} />
                    <p className={cn("mt-1.5 font-heading text-xs font-bold leading-tight", theme.label)}>{bucket.name}</p>
                    <p className="font-heading text-sm font-extrabold text-[#031F82]">{formatMoney(shownBalance)}</p>
                  </button>
                );
              })}
            </div>

            {expandedBucket ? (
              expandedBucket.id === SAVINGS_JAR_ID ? (
                <SaveJarExpandedPanel
                  bucket={expandedBucket}
                  onClose={() => setExpandedBucketId(null)}
                />
              ) : (
                <BucketExpandedPanel
                  bucket={expandedBucket}
                  buckets={buckets}
                  goals={goals}
                  isPremium={isPremium}
                  spendingCategories={spendingCategories}
                  onVaultTransfer={onVaultTransfer}
                  onMarkSpent={(amount, categoryLabel) =>
                    onMarkSpent(expandedBucket.id, amount, categoryLabel)
                  }
                  onAddCustomCategory={onAddCustomSpendingCategory}
                  onRenameCategory={onRenameSpendingCategory}
                  onClose={() => setExpandedBucketId(null)}
                />
              )
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
              {expandedBucket && isCustomBucketId(expandedBucket.id) ? (
                <button
                  type="button"
                  onClick={() => handleDeleteBucket(expandedBucket)}
                  disabled={expandedBucket.balance > 0}
                  title={expandedBucket.balance > 0 ? copy.deleteBucketDisabledHint : undefined}
                  className="font-heading text-[10px] font-bold text-[#BE123C] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {copy.deleteBucket}
                </button>
              ) : null}
            </div>
        </section>
      </div>

      <PremiumRenameModal isOpen={premiumModalOpen} onClose={() => setPremiumModalOpen(false)} />
    </>
  );
}
