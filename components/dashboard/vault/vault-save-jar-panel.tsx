"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import { ModalShell } from "@/components/ui/modal-shell";
import { GoalProgressBar } from "@/components/dashboard/vault/vault-visuals";
import { copyMatrix } from "@/constants/copyMatrix";
import { useCurrency } from "@/lib/dashboard/currency-context";
import { roundAudAmount, roundToHalfStep } from "@/lib/dashboard/destination-jars";
import {
  parsePositiveVaultAmount,
  VAULT_AMOUNT_STEP,
} from "@/lib/dashboard/vault-amount-input";
import {
  isSavingsGoalAllocationLocked,
  savingsGoalPercentAchieved,
  savingsGoalProgress,
  type SavingsGoal,
  type SavingsGoalId,
} from "@/lib/dashboard/savings-goals";
import { sumAllocations, type VaultBucket } from "@/lib/dashboard/vault-buckets";
import { cn } from "@/lib/utils/cn";

const orangeCtaClass =
  "rounded-nga-lg border-b-4 border-[#C88202] bg-[#FFA503] font-heading text-xs font-bold uppercase tracking-wide text-[#031F82] disabled:opacity-40";
const actionBtnClass =
  "flex-1 rounded-lg border border-[#BDE9FB] bg-white px-2 py-2 font-heading text-xs font-bold leading-tight text-[#031F82] disabled:opacity-40";
const actionBtnActiveClass = "border-[#0CC1E0] bg-[#F0FBFF]";
const spendBtnActiveClass = "border-[#FDA4AF] bg-[#FDA4AF]/20";
const confirmBtnClass =
  "rounded-lg border border-[#0CC1E0] bg-white px-3 py-1.5 font-heading text-sm font-bold text-[#031F82] disabled:opacity-40";
const spendConfirmBtnClass =
  "rounded-lg border border-[#FDA4AF] bg-[#FDA4AF]/25 px-3 py-1.5 font-heading text-sm font-bold text-[#031F82] disabled:opacity-40";
const ghostBtnClass =
  "rounded-lg border border-[#BDE9FB] bg-white px-3 py-1.5 font-heading text-sm font-bold text-[#031F82]";

type GoalActionMode = "change-target" | "spend";

function PremiumGoalsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const copy = copyMatrix.dashboard.vault.savings;
  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      labelledBy="premium-goals-title"
      backdropClassName="bg-[#031F82]/45"
      panelClassName="max-w-sm rounded-nga-xl bg-white p-5"
    >
      <h2 id="premium-goals-title" className="font-heading text-lg font-extrabold text-[#031F82]">
        {copy.premiumGoalsTitle}
      </h2>
      <p className="mt-2 text-sm text-[#1E3A5F]">{copy.premiumGoalsBody}</p>
      <button type="button" className={cn("mt-4 h-touch w-full", orangeCtaClass)}>
        {copyMatrix.dashboard.vault.budget.premiumUnlock}
      </button>
      <button type="button" onClick={onClose} className="mt-2 w-full py-2 text-sm font-bold text-[#0CC1E0]">
        {copyMatrix.dashboard.vault.budget.premiumLater}
      </button>
    </ModalShell>
  );
}

function GoalAllocationSliderRow({
  goal,
  draft,
  poolTotal,
  onSliderChange,
}: {
  goal: SavingsGoal;
  draft: number;
  poolTotal: number;
  onSliderChange: (goalId: string, value: number) => void;
}) {
  const savingsCopy = copyMatrix.dashboard.vault.savings;
  const { formatMoney } = useCurrency();
  const locked = isSavingsGoalAllocationLocked(goal);
  const headroom = Math.max(0, goal.targetAmount - goal.balance);

  return (
    <div className="py-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate font-heading text-xs font-bold text-[#031F82]">
          {goal.emoji} {goal.name}
        </span>
        {locked ? (
          <span className="shrink-0 font-heading text-[10px] font-bold text-[#15803D]">
            {savingsCopy.goalComplete}
          </span>
        ) : (
          <span className="shrink-0 font-heading text-xs font-extrabold text-[#15803D]">
            {formatMoney(draft)}
          </span>
        )}
      </div>
      {locked ? (
        <p className="mt-1 font-sans text-[10px] text-[#1E3A5F]/65">{savingsCopy.goalAtTargetHint}</p>
      ) : (
        <input
          type="range"
          min={0}
          max={poolTotal}
          step={VAULT_AMOUNT_STEP}
          value={draft}
          disabled={headroom <= 0}
          onChange={(e) => onSliderChange(goal.id, Number.parseFloat(e.target.value))}
          className="mt-1 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-[#22C55E]/20 accent-[#22C55E] disabled:opacity-40"
          aria-label={`Assign to ${goal.name}`}
        />
      )}
    </div>
  );
}

function ChangeGoalTargetPanel({
  goal,
  onUpdateTarget,
  onClose,
}: {
  goal: SavingsGoal;
  onUpdateTarget: (targetAmount: number) => void;
  onClose: () => void;
}) {
  const savingsCopy = copyMatrix.dashboard.vault.savings;
  const { currencySymbol } = useCurrency();
  const [amountInput, setAmountInput] = useState(String(goal.targetAmount));

  function run() {
    const amount = parsePositiveVaultAmount(amountInput);
    if (amount === null) return;
    onUpdateTarget(amount);
    onClose();
  }

  return (
    <div className="rounded-lg border border-[#BDE9FB]/70 bg-white px-2.5 py-2">
      <p className="font-sans text-[10px] text-[#1E3A5F]/70">{savingsCopy.changeGoalTargetHint}</p>
      <div className="mt-1.5 flex min-w-0 items-center gap-1.5">
        <span className="font-bold text-[#031F82]">{currencySymbol}</span>
        <input
          type="number"
          min={0}
          step={VAULT_AMOUNT_STEP}
          value={amountInput}
          onChange={(e) => setAmountInput(e.target.value)}
          placeholder={savingsCopy.goalTargetLabel}
          className="min-w-0 flex-1 rounded-lg border border-[#BDE9FB] bg-white px-2 py-1.5 text-base outline-none focus:border-[#0CC1E0]"
        />
      </div>
      <div className="mt-1.5 flex gap-1.5">
        <button type="button" onClick={run} className={confirmBtnClass}>
          {savingsCopy.spendConfirm}
        </button>
        <button type="button" onClick={onClose} className={ghostBtnClass}>
          {savingsCopy.spendCancel}
        </button>
      </div>
    </div>
  );
}

function SpendGoalPanel({
  goal,
  onSpend,
  onClose,
}: {
  goal: SavingsGoal;
  onSpend: (amount: number) => void;
  onClose: () => void;
}) {
  const savingsCopy = copyMatrix.dashboard.vault.savings;
  const [amountInput, setAmountInput] = useState("");

  function run() {
    const amount = parsePositiveVaultAmount(amountInput);
    if (amount === null || amount > goal.balance) return;
    onSpend(amount);
    setAmountInput("");
    onClose();
  }

  if (goal.balance <= 0) {
    return (
      <p className="rounded-lg border border-[#BDE9FB]/70 bg-white px-2.5 py-2 font-sans text-[10px] text-[#1E3A5F]/70">
        {savingsCopy.goalEmptyHint}
      </p>
    );
  }

  return (
    <div className="rounded-lg border border-[#BDE9FB]/70 bg-white px-2.5 py-2">
      <div className="flex min-w-0 gap-2">
        <input
          type="number"
          min={0}
          step={VAULT_AMOUNT_STEP}
          value={amountInput}
          onChange={(e) => setAmountInput(e.target.value)}
          placeholder={savingsCopy.spendAmountLabel}
          className="min-w-0 flex-1 rounded-lg border border-[#BDE9FB] bg-white px-2 py-1.5 text-base outline-none focus:border-[#0CC1E0]"
        />
      </div>
      <div className="mt-1.5 flex gap-1.5">
        <button type="button" onClick={run} className={spendConfirmBtnClass}>
          {savingsCopy.spendConfirm}
        </button>
        <button type="button" onClick={onClose} className={ghostBtnClass}>
          {savingsCopy.spendCancel}
        </button>
      </div>
    </div>
  );
}

export type SaveJarPanelProps = {
  totalSavings: number;
  bucket: VaultBucket;
  isPremium: boolean;
  goals: SavingsGoal[];
  onAddGoal: (name: string, targetAmount: number) => void;
  onUpdateGoalTarget: (goalId: SavingsGoalId, targetAmount: number) => void;
  onAssignGoals: (allocations: Record<string, number>) => void;
  onSpendFromGoal: (goalId: SavingsGoalId, amount: number) => void;
  onClose: () => void;
};

export function SaveJarExpandedPanel({
  totalSavings,
  bucket,
  isPremium,
  goals,
  onAddGoal,
  onUpdateGoalTarget,
  onAssignGoals,
  onSpendFromGoal,
  onClose,
}: SaveJarPanelProps) {
  const savingsCopy = copyMatrix.dashboard.vault.savings;
  const { formatMoney, currencySymbol } = useCurrency();

  const goalIds = useMemo(() => goals.map((goal) => goal.id), [goals]);
  const unassignedSavings = roundAudAmount(Math.max(0, bucket.balance));

  const [allocationOpen, setAllocationOpen] = useState(false);
  const [premiumGoalsOpen, setPremiumGoalsOpen] = useState(false);
  const [manageGoalsOpen, setManageGoalsOpen] = useState(false);
  const [newGoalName, setNewGoalName] = useState("");
  const [newGoalTarget, setNewGoalTarget] = useState("");
  const [goalAllocationDrafts, setGoalAllocationDrafts] = useState<Record<string, number>>({});
  const [activeGoalAction, setActiveGoalAction] = useState<{
    goalId: SavingsGoalId;
    mode: GoalActionMode;
  } | null>(null);

  const allocatedTotal = sumAllocations(goalAllocationDrafts);
  const remainingTotal = roundAudAmount(Math.max(0, unassignedSavings - allocatedTotal));
  const isFullyAssigned = unassignedSavings > 0 && Math.abs(remainingTotal) < 0.01;

  useEffect(() => {
    if (unassignedSavings <= 0) {
      setGoalAllocationDrafts({});
      setAllocationOpen(false);
    }
  }, [unassignedSavings]);

  useEffect(() => {
    setGoalAllocationDrafts((current) => {
      const next = { ...current };
      for (const id of goalIds) if (next[id] === undefined) next[id] = 0;
      for (const id of Object.keys(next)) if (!goalIds.includes(id as SavingsGoalId)) delete next[id];
      for (const goal of goals) {
        if (isSavingsGoalAllocationLocked(goal)) next[goal.id] = 0;
      }
      return next;
    });
  }, [goalIds, goals]);

  const handleGoalSliderChange = useCallback(
    (goalId: string, nextValue: number) => {
      const goal = goals.find((entry) => entry.id === goalId);
      if (!goal || isSavingsGoalAllocationLocked(goal)) return;

      setGoalAllocationDrafts((current) => {
        const others = goalIds
          .filter((id) => id !== goalId)
          .reduce((sum, id) => sum + (current[id] ?? 0), 0);
        const headroom = Math.max(0, goal.targetAmount - goal.balance);
        const clamped = roundToHalfStep(
          Math.min(Math.max(0, nextValue), Math.max(0, Math.min(unassignedSavings - others, headroom))),
        );
        return { ...current, [goalId]: clamped };
      });
    },
    [goalIds, goals, unassignedSavings],
  );

  function handleCreateGoal(event: FormEvent) {
    event.preventDefault();
    const parsed = Number.parseFloat(newGoalTarget);
    if (!newGoalName.trim() || !Number.isFinite(parsed) || parsed <= 0) return;
    onAddGoal(newGoalName.trim(), roundToHalfStep(parsed));
    setNewGoalName("");
    setNewGoalTarget("");
    setManageGoalsOpen(false);
  }

  function handleAssignGoals() {
    if (!isFullyAssigned) return;
    onAssignGoals(goalAllocationDrafts);
    setGoalAllocationDrafts({});
    setAllocationOpen(false);
  }

  function handleManageGoalsClick() {
    if (!isPremium) {
      setPremiumGoalsOpen(true);
      return;
    }
    setManageGoalsOpen((open) => !open);
  }

  function toggleGoalAction(goalId: SavingsGoalId, mode: GoalActionMode) {
    setActiveGoalAction((current) =>
      current?.goalId === goalId && current.mode === mode ? null : { goalId, mode },
    );
  }

  return (
    <>
      <div className="mt-2 rounded-xl border border-[#BDE9FB] bg-white p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="font-heading text-sm font-extrabold text-[#031F82]">
            {bucket.emoji} {savingsCopy.sectionTitle}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="font-heading text-xs font-bold text-[#1E3A5F]/60 hover:text-[#031F82]"
          >
            Close
          </button>
        </div>

        <div className="mt-2 grid grid-cols-2 gap-2 border-b border-[#BDE9FB]/50 pb-2 text-center">
          <div>
            <p className="font-sans text-[11px] text-[#1E3A5F]/70">{savingsCopy.totalSavingsLabel}</p>
            <p className="font-heading text-lg font-extrabold leading-tight text-[#031F82]">
              {formatMoney(totalSavings)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAllocationOpen((open) => !open)}
            disabled={unassignedSavings <= 0 || goals.length === 0}
            className="disabled:opacity-50"
          >
            <p className="font-sans text-[11px] text-[#1E3A5F]/70">{savingsCopy.savingsToAllocateLabel}</p>
            <p className="font-heading text-lg font-extrabold leading-tight text-[#15803D]">
              {formatMoney(unassignedSavings)}
            </p>
            {unassignedSavings > 0 && goals.length > 0 ? (
              <p className="mt-0.5 font-heading text-[10px] font-bold text-[#0CC1E0]">
                {allocationOpen ? savingsCopy.hideAllocation : savingsCopy.openAllocation}
              </p>
            ) : null}
          </button>
        </div>

        {allocationOpen && unassignedSavings > 0 && goals.length > 0 ? (
          <div className="mt-2 space-y-2 border-b border-[#BDE9FB]/50 pb-2">
            <div className="flex items-center justify-between gap-2">
              <p className="font-heading text-xs font-extrabold text-[#031F82]">
                {savingsCopy.goalAllocationHeading}
              </p>
              {isFullyAssigned ? (
                <span className="rounded-full bg-[#22C55E]/15 px-2 py-0.5 font-heading text-[10px] font-bold text-[#15803D]">
                  {savingsCopy.goalFullyAssignedLabel}
                </span>
              ) : (
                <span className="font-heading text-[10px] font-bold text-[#FFA503]">
                  {savingsCopy.goalRemainingLabel}: {formatMoney(remainingTotal)}
                </span>
              )}
            </div>
            <div className="divide-y divide-[#BDE9FB]/30">
              {goals.map((goal) => (
                <GoalAllocationSliderRow
                  key={goal.id}
                  goal={goal}
                  draft={goalAllocationDrafts[goal.id] ?? 0}
                  poolTotal={unassignedSavings}
                  onSliderChange={handleGoalSliderChange}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={handleAssignGoals}
              disabled={!isFullyAssigned}
              className={cn("h-touch w-full px-3 py-2", orangeCtaClass)}
            >
              {savingsCopy.assignToGoals}
            </button>
          </div>
        ) : null}

        {goals.length === 0 ? (
          <p className="mt-2 font-sans text-sm text-[#1E3A5F]/70">{savingsCopy.noGoalsYet}</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {goals.map((goal) => {
              const progress = savingsGoalProgress(goal);
              const percentAchieved = savingsGoalPercentAchieved(goal);
              const activeAction =
                activeGoalAction?.goalId === goal.id ? activeGoalAction.mode : null;

              return (
                <li
                  key={goal.id}
                  className="space-y-1.5 rounded-lg border border-[#BDE9FB]/70 bg-[#FAFDFF] p-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="min-w-0 truncate font-heading text-sm font-bold text-[#031F82]">
                      {goal.emoji} {goal.name}
                    </p>
                    <span
                      className={cn(
                        "shrink-0 font-heading text-xs font-extrabold",
                        percentAchieved >= 100 ? "text-[#15803D]" : "text-[#031F82]",
                      )}
                    >
                      {percentAchieved}%
                    </span>
                  </div>

                  <div className="flex items-end justify-between gap-2">
                    <p className="font-heading text-lg font-extrabold leading-none text-[#15803D]">
                      {formatMoney(goal.balance)}
                    </p>
                    <p className="font-sans text-[11px] text-[#1E3A5F]/75">
                      {savingsCopy.goalTargetShort}: {formatMoney(goal.targetAmount)}
                    </p>
                  </div>

                  <GoalProgressBar progress={progress} color="#22C55E" trackColor="#DCFCE7" />

                  <div className="flex gap-1.5 pt-0.5">
                    <button
                      type="button"
                      onClick={() => toggleGoalAction(goal.id, "change-target")}
                      className={cn(
                        actionBtnClass,
                        activeAction === "change-target" && actionBtnActiveClass,
                      )}
                    >
                      {savingsCopy.changeGoalAmount}
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleGoalAction(goal.id, "spend")}
                      className={cn(actionBtnClass, activeAction === "spend" && spendBtnActiveClass)}
                    >
                      {savingsCopy.spendThisMoney}
                    </button>
                  </div>

                  {activeAction === "change-target" ? (
                    <ChangeGoalTargetPanel
                      goal={goal}
                      onUpdateTarget={(target) => onUpdateGoalTarget(goal.id, target)}
                      onClose={() => setActiveGoalAction(null)}
                    />
                  ) : null}
                  {activeAction === "spend" ? (
                    <SpendGoalPanel
                      goal={goal}
                      onSpend={(amount) => onSpendFromGoal(goal.id, amount)}
                      onClose={() => setActiveGoalAction(null)}
                    />
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}

        {manageGoalsOpen && isPremium ? (
          <form onSubmit={handleCreateGoal} className="mt-2 space-y-2 border-t border-[#BDE9FB]/50 pt-2">
            <input
              value={newGoalName}
              onChange={(e) => setNewGoalName(e.target.value)}
              placeholder={savingsCopy.goalNameLabel}
              className="w-full rounded-lg border border-[#BDE9FB] px-3 py-2 text-base outline-none focus:border-[#0CC1E0]"
            />
            <div className="flex min-w-0 gap-2">
              <span className="py-2 font-bold text-[#031F82]">{currencySymbol}</span>
              <input
                type="number"
                min={0}
                step={VAULT_AMOUNT_STEP}
                value={newGoalTarget}
                onChange={(e) => setNewGoalTarget(e.target.value)}
                placeholder={savingsCopy.goalTargetLabel}
                className="min-w-0 flex-1 rounded-lg border border-[#BDE9FB] px-3 py-2 text-base outline-none focus:border-[#0CC1E0]"
              />
              <button type="submit" className={cn("shrink-0 px-3 py-2", orangeCtaClass)}>
                {savingsCopy.createGoal}
              </button>
            </div>
          </form>
        ) : null}

        <button
          type="button"
          onClick={handleManageGoalsClick}
          className="mt-3 font-heading text-xs font-bold text-[#0CC1E0] hover:underline"
        >
          {savingsCopy.manageSavingsGoals}
        </button>
      </div>

      <PremiumGoalsModal isOpen={premiumGoalsOpen} onClose={() => setPremiumGoalsOpen(false)} />
    </>
  );
}
