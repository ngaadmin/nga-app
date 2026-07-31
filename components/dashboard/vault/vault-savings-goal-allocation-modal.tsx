"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
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
import { sumAllocations } from "@/lib/dashboard/vault-buckets";
import type { SavingsGoal, SavingsGoalId } from "@/lib/dashboard/savings-goals";
import {
  isAllocationOverPool,
  sumEffectiveAllocationInputs,
  vaultAllocationRemainingDisplay,
} from "@/lib/dashboard/vault-v2/allocation-remaining";
import { vaultV2Copy } from "@/lib/dashboard/vault-v2/copy";
import { cn } from "@/lib/utils/cn";

const orangeCtaClass =
  "rounded-nga-lg border-b-4 border-[#C88202] bg-[#FFA503] font-heading text-xs font-bold uppercase tracking-wide text-[#031F82] transition-all hover:brightness-[1.02] active:translate-y-[2px] active:border-b-2 disabled:cursor-not-allowed disabled:opacity-40";

function GoalAllocationInputRow({
  goal,
  draft,
  poolTotal,
  inputValue,
  onInputChange,
  onInputBlur,
  onInputFocus,
}: {
  goal: SavingsGoal;
  draft: number;
  poolTotal: number;
  inputValue: string;
  onInputChange: (goalId: string, rawValue: string) => void;
  onInputBlur: (goalId: string) => void;
  onInputFocus: (goalId: string) => void;
}) {
  const { currencySymbol } = useCurrency();

  return (
    <div className="flex min-w-0 items-end gap-1.5 py-2.5">
      <div className="flex w-[4.25rem] shrink-0 flex-col items-center">
        <span className="text-2xl leading-none" aria-hidden>
          {goal.emoji}
        </span>
        <p className="mt-1 line-clamp-2 text-center font-heading text-xs font-bold leading-tight text-[#031F82]">
          {goal.name}
        </p>
      </div>

      <label className="flex w-[5.25rem] shrink-0 items-center gap-1 rounded-lg border border-[#BDE9FB] bg-white px-2 py-1.5">
        <span className="shrink-0 font-heading text-xs font-bold text-[#031F82]">
          {currencySymbol}
        </span>
        <input
          type="text"
          inputMode="decimal"
          value={inputValue}
          onChange={(event) => onInputChange(goal.id, event.target.value)}
          onFocus={() => onInputFocus(goal.id)}
          onBlur={() => onInputBlur(goal.id)}
          aria-label={`Amount to allocate to ${goal.name}`}
          className="min-w-0 flex-1 bg-transparent text-right font-sans text-sm tabular-nums text-[#031F82] outline-none"
        />
      </label>

      <VaultV2CoinStackVisual
        allocatedAmount={draft}
        poolTotal={poolTotal}
        className="ml-auto flex min-w-[3.5rem] flex-1 items-end justify-end pl-1"
      />
    </div>
  );
}

type VaultV2SavingsGoalAllocationModalProps = {
  isOpen: boolean;
  onClose: () => void;
  goals: SavingsGoal[];
  poolBalance: number;
  onAssignGoals: (allocations: Record<string, number>) => void;
};

export function VaultV2SavingsGoalAllocationModal({
  isOpen,
  onClose,
  goals,
  poolBalance,
  onAssignGoals,
}: VaultV2SavingsGoalAllocationModalProps) {
  const savingsCopy = copyMatrix.dashboard.vault.savings;
  const budgetCopy = copyMatrix.dashboard.vault.budget;
  const { formatMoney } = useCurrency();
  const goalIds = useMemo(() => goals.map((goal) => goal.id), [goals]);

  const [allocationInputs, setAllocationInputs] = useState<Record<string, string>>({});
  const [focusedGoalId, setFocusedGoalId] = useState<string | null>(null);
  const [allocationDrafts, setAllocationDrafts] = useState<Record<string, number>>({});
  const [inputWasCapped, setInputWasCapped] = useState(false);

  const poolTotal = roundAudAmount(Math.max(0, poolBalance));
  const allocatedTotal = sumAllocations(allocationDrafts);
  const effectiveAllocatedTotal = useMemo(
    () =>
      sumEffectiveAllocationInputs(
        goalIds,
        allocationDrafts,
        allocationInputs,
        focusedGoalId,
      ),
    [allocationDrafts, allocationInputs, focusedGoalId, goalIds],
  );
  const remainingToAllocate = vaultAllocationRemainingDisplay(
    poolTotal,
    effectiveAllocatedTotal,
  );
  const isOverAllocated = isAllocationOverPool(poolTotal, effectiveAllocatedTotal);
  const hasAllocationDraft = allocatedTotal > 0;
  const canAssign = hasAllocationDraft && !isOverAllocated && goals.length > 0;

  useEffect(() => {
    if (!isOpen) {
      setAllocationDrafts({});
      setAllocationInputs({});
      setFocusedGoalId(null);
      setInputWasCapped(false);
      return;
    }

    if (poolTotal <= 0) {
      setAllocationDrafts({});
      return;
    }

    setAllocationDrafts((current) => {
      if (sumAllocationDraftValues(current) <= poolTotal) return current;
      return capAllocationDrafts(current, poolTotal, goalIds);
    });
  }, [goalIds, isOpen, poolTotal]);

  useEffect(() => {
    if (!isOpen) return;

    setAllocationDrafts((current) => {
      const next = { ...current };
      for (const id of goalIds) if (next[id] === undefined) next[id] = 0;
      for (const id of Object.keys(next)) {
        if (!goalIds.includes(id as SavingsGoalId)) delete next[id];
      }
      return next;
    });
  }, [goalIds, isOpen]);

  const handleAllocationChange = useCallback(
    (goalId: string, nextValue: number) => {
      setAllocationDrafts((current) => {
        const others = roundAudAmount(
          goalIds
            .filter((id) => id !== goalId)
            .reduce((sum, id) => sum + (current[id] ?? 0), 0),
        );
        const clamped = clampVaultAllocationEntry(poolTotal, others, nextValue);
        return { ...current, [goalId]: clamped };
      });
    },
    [goalIds, poolTotal],
  );

  const getAllocationInputValue = useCallback(
    (goalId: string, draft: number) => {
      if (focusedGoalId === goalId) {
        return allocationInputs[goalId] ?? (draft > 0 ? String(draft) : "");
      }
      return draft > 0 ? String(draft) : "";
    },
    [allocationInputs, focusedGoalId],
  );

  const handleAllocationInputChange = useCallback(
    (goalId: string, rawValue: string) => {
      if (rawValue !== "" && !/^\d*\.?\d*$/.test(rawValue)) return;

      if (rawValue === "" || rawValue === ".") {
        setAllocationInputs((current) => ({ ...current, [goalId]: rawValue }));
        handleAllocationChange(goalId, 0);
        setInputWasCapped(false);
        return;
      }

      const parsed = Number.parseFloat(rawValue);
      if (!Number.isFinite(parsed) || parsed < 0) return;

      const othersTotal = roundAudAmount(
        goalIds
          .filter((id) => id !== goalId)
          .reduce((sum, id) => sum + (allocationDrafts[id] ?? 0), 0),
      );
      const capped = clampVaultAllocationEntry(poolTotal, othersTotal, parsed);
      const wasCapped = capped !== parsed;
      const nextInput =
        wasCapped && capped > 0
          ? String(capped)
          : wasCapped && capped === 0
            ? "0"
            : rawValue;

      setAllocationInputs((current) => ({ ...current, [goalId]: nextInput }));
      setInputWasCapped(wasCapped);
      handleAllocationChange(goalId, capped);
    },
    [allocationDrafts, goalIds, handleAllocationChange, poolTotal],
  );

  const handleAllocationInputFocus = useCallback(
    (goalId: string) => {
      setFocusedGoalId(goalId);
      setAllocationInputs((current) => {
        const draft = allocationDrafts[goalId] ?? 0;
        if (current[goalId] !== undefined) return current;
        return {
          ...current,
          [goalId]: draft > 0 ? String(draft) : "",
        };
      });
    },
    [allocationDrafts],
  );

  const handleAllocationInputBlur = useCallback(
    (goalId: string) => {
      setFocusedGoalId((current) => (current === goalId ? null : current));
      const draft = allocationDrafts[goalId] ?? 0;
      setAllocationInputs((current) => ({
        ...current,
        [goalId]: draft > 0 ? String(draft) : "",
      }));
      setInputWasCapped(false);
    },
    [allocationDrafts],
  );

  const handleAssignSubmit = useCallback(() => {
    if (!canAssign || isAllocationOverPool(poolTotal, allocatedTotal)) return;

    onAssignGoals(capAllocationDrafts(allocationDrafts, poolTotal, goalIds));
    setAllocationDrafts({});
    setAllocationInputs({});
    setFocusedGoalId(null);
    onClose();
  }, [
    allocatedTotal,
    allocationDrafts,
    canAssign,
    goalIds,
    onAssignGoals,
    onClose,
    poolTotal,
  ]);

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      align="center"
      labelledBy="vault-v2-savings-goal-allocation-title"
      backdropClassName="bg-[#031F82]/50"
      panelClassName="max-w-lg rounded-2xl border-0 bg-white p-5 shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2
            id="vault-v2-savings-goal-allocation-title"
            className="font-heading text-lg font-extrabold text-[#031F82]"
          >
            {savingsCopy.goalAllocationHeading}
          </h2>
          <p className="mt-0.5 font-heading text-xs font-bold uppercase tracking-wide text-[#1E3A5F]/60">
            {budgetCopy.poolLabel}
          </p>
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
                ? savingsCopy.goalRemainingLabel + ": capped to available balance"
                : `${savingsCopy.goalRemainingLabel}: exceeds available pool`}
            </p>
          ) : null}
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
        {goals.length > 0 ? (
          <div className="min-w-0 divide-y divide-[#BDE9FB]/30">
            {goals.map((goal) => (
              <GoalAllocationInputRow
                key={goal.id}
                goal={goal}
                draft={allocationDrafts[goal.id] ?? 0}
                poolTotal={poolTotal}
                inputValue={getAllocationInputValue(
                  goal.id,
                  allocationDrafts[goal.id] ?? 0,
                )}
                onInputChange={handleAllocationInputChange}
                onInputBlur={handleAllocationInputBlur}
                onInputFocus={handleAllocationInputFocus}
              />
            ))}
          </div>
        ) : (
          <p className="font-sans text-sm text-[#1E3A5F]/70">{savingsCopy.noGoalsYet}</p>
        )}
      </div>

      <button
        type="button"
        onClick={handleAssignSubmit}
        disabled={!canAssign}
        className={cn("mt-4 h-touch w-full px-4 py-2.5", orangeCtaClass)}
      >
        {savingsCopy.assignToGoals}
      </button>
    </ModalShell>
  );
}
