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
  GoalProgressBar,
  bucketTheme,
} from "@/components/dashboard/vault/vault-visuals";
import type { MoveTarget } from "@/components/dashboard/vault/vault-budget-hub";
import { copyMatrix } from "@/constants/copyMatrix";
import { useCurrency } from "@/lib/dashboard/currency-context";
import { roundAudAmount, roundToHalfStep, SAVINGS_JAR_ID } from "@/lib/dashboard/destination-jars";
import {
  canRenameSavingsGoal,
  savingsGoalProgress,
  type SavingsGoal,
  type SavingsGoalId,
} from "@/lib/dashboard/savings-goals";
import { sumAllocations, type VaultBucket, type VaultBucketId } from "@/lib/dashboard/vault-buckets";
import { cn } from "@/lib/utils/cn";

const orangeCtaClass =
  "rounded-nga-lg border-b-4 border-[#C88202] bg-[#FFA503] font-heading text-xs font-bold uppercase tracking-wide text-[#031F82] disabled:opacity-40";
const tealBtnClass =
  "rounded-lg border border-[#0CC1E0] bg-white px-3 py-2 font-heading text-sm font-bold text-[#031F82] disabled:opacity-40";
const spendBtnClass =
  "rounded-lg border border-[#FDA4AF] bg-[#FDA4AF]/25 px-3 py-2 font-heading text-sm font-bold text-[#031F82] disabled:opacity-40";
const ghostBtnClass =
  "rounded-lg border border-[#BDE9FB] bg-white px-3 py-1.5 font-heading text-sm font-bold text-[#031F82] disabled:opacity-40";
const linkClass =
  "font-heading text-sm font-bold text-[#0CC1E0] hover:underline";
const ALLOCATION_STEP = 0.5;

type GoalActionMode = "increase" | "spend" | "move";

function parsePositiveAmount(rawValue: string): number | null {
  const trimmed = rawValue.trim();
  if (!trimmed) return null;
  const parsed = Number.parseFloat(trimmed);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return roundToHalfStep(parsed);
}

function PremiumGoalsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const copy = copyMatrix.dashboard.vault.savings;
  return (
    <ModalShell isOpen={isOpen} onClose={onClose} labelledBy="premium-goals-title" backdropClassName="bg-[#031F82]/45" panelClassName="max-w-sm rounded-nga-xl bg-white p-5">
      <h2 id="premium-goals-title" className="font-heading text-lg font-extrabold text-[#031F82]">{copy.premiumGoalsTitle}</h2>
      <p className="mt-2 text-sm text-[#1E3A5F]">{copy.premiumGoalsBody}</p>
      <button type="button" className={cn("mt-4 h-touch w-full", orangeCtaClass)}>{copyMatrix.dashboard.vault.budget.premiumUnlock}</button>
      <button type="button" onClick={onClose} className="mt-2 w-full py-2 text-sm font-bold text-[#0CC1E0]">{copyMatrix.dashboard.vault.budget.premiumLater}</button>
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
  const { formatMoney } = useCurrency();
  const progress = savingsGoalProgress(goal);
  const headroom = Math.max(0, goal.targetAmount - goal.balance);

  return (
    <div className="py-2">
      <div className="flex items-center gap-2">
        <span className="text-base leading-none">{goal.emoji}</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate font-heading text-base font-bold text-[#15803D]">{goal.name}</span>
            <span className="shrink-0 font-heading text-sm font-extrabold text-[#031F82]">{formatMoney(draft)}</span>
          </div>
          <div className="mt-1.5">
            <GoalProgressBar progress={progress} color="#22C55E" trackColor="#DCFCE7" />
          </div>
          <p className="mt-1 font-sans text-sm text-[#1E3A5F]/80">
            {formatMoney(goal.balance)} / {formatMoney(goal.targetAmount)}
          </p>
          <input
            type="range"
            min={0}
            max={poolTotal}
            step={ALLOCATION_STEP}
            value={draft}
            disabled={headroom <= 0}
            onChange={(e) => onSliderChange(goal.id, Number.parseFloat(e.target.value))}
            className="mt-2 h-2 w-full cursor-pointer appearance-none rounded-full bg-[#22C55E]/20 accent-[#22C55E] disabled:opacity-40"
            aria-label={`Assign to ${goal.name}`}
          />
        </div>
      </div>
    </div>
  );
}

function GoalActionPanel({
  goal,
  mode,
  saveJarBalance,
  buckets,
  onIncrease,
  onSpend,
  onMove,
  onClose,
}: {
  goal: SavingsGoal;
  mode: GoalActionMode;
  saveJarBalance: number;
  buckets: VaultBucket[];
  onIncrease: (amount: number) => void;
  onSpend: (amount: number) => void;
  onMove: (amount: number, destination: VaultBucketId) => void;
  onClose: () => void;
}) {
  const savingsCopy = copyMatrix.dashboard.vault.savings;
  const [amountInput, setAmountInput] = useState("");
  const [destination, setDestination] = useState<VaultBucketId>(SAVINGS_JAR_ID);

  const maxIncrease = Math.max(0, Math.min(saveJarBalance, goal.targetAmount - goal.balance));
  const maxSpend = goal.balance;
  const moveDestinations = buckets.filter((b) => b.id !== SAVINGS_JAR_ID);

  function run() {
    const amount = parsePositiveAmount(amountInput);
    if (amount === null) return;

    if (mode === "increase") {
      if (amount > maxIncrease) return;
      onIncrease(amount);
    } else if (mode === "spend") {
      if (amount > maxSpend) return;
      onSpend(amount);
    } else {
      if (amount > maxSpend) return;
      onMove(amount, destination);
    }

    setAmountInput("");
    onClose();
  }

  const maxAmount = mode === "increase" ? maxIncrease : maxSpend;

  if (maxAmount <= 0 && mode === "increase") {
    return (
      <p className="mt-1.5 font-sans text-[10px] text-[#1E3A5F]/70">
        {saveJarBalance <= 0 ? "No unassigned savings in Save Jar." : "This goal is at its target."}
      </p>
    );
  }

  if (maxAmount <= 0 && mode !== "increase") {
    return null;
  }

  return (
    <div className="mt-2 rounded-lg border border-[#BDE9FB]/70 bg-white px-2.5 py-2">
      <div className="flex gap-2">
        <input
          type="number"
          min={0}
          step={ALLOCATION_STEP}
          value={amountInput}
          onChange={(e) => setAmountInput(e.target.value)}
          placeholder={savingsCopy.spendAmountLabel}
          className="min-w-0 flex-1 rounded-lg border border-[#BDE9FB] px-2 py-1.5 text-sm outline-none focus:border-[#0CC1E0]"
        />
        {mode === "move" ? (
          <select
            value={destination}
            onChange={(e) => setDestination(e.target.value as VaultBucketId)}
            className="max-w-[45%] rounded-lg border border-[#BDE9FB] bg-white px-2 py-1.5 text-xs outline-none"
          >
            <option value={SAVINGS_JAR_ID}>Save Jar</option>
            {moveDestinations.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        ) : null}
      </div>
      <div className="mt-1.5 flex gap-1.5">
        <button type="button" onClick={run} disabled={maxAmount <= 0} className={mode === "spend" ? spendBtnClass : tealBtnClass}>
          Confirm
        </button>
        <button type="button" onClick={onClose} className={ghostBtnClass}>{savingsCopy.spendCancel}</button>
      </div>
    </div>
  );
}

export type SaveJarPanelProps = {
  bucket: VaultBucket;
  buckets: VaultBucket[];
  isPremium: boolean;
  goals: SavingsGoal[];
  onMove: (amount: number, destination: MoveTarget) => void;
  onMarkSpent: (amount: number) => void;
  onAddGoal: (name: string, targetAmount: number) => void;
  onRenameGoal: (goalId: SavingsGoalId, name: string) => void;
  onAllocateToGoal: (goalId: SavingsGoalId, amount: number) => void;
  onAssignGoals: (allocations: Record<string, number>) => void;
  onSpendFromGoal: (goalId: SavingsGoalId, amount: number) => void;
  onMoveFromGoal: (goalId: SavingsGoalId, amount: number, destination: VaultBucketId) => void;
  onClose: () => void;
};

export function SaveJarExpandedPanel({
  bucket,
  buckets,
  isPremium,
  goals,
  onMove,
  onMarkSpent,
  onAddGoal,
  onRenameGoal,
  onAllocateToGoal,
  onAssignGoals,
  onSpendFromGoal,
  onMoveFromGoal,
  onClose,
}: SaveJarPanelProps) {
  const budgetCopy = copyMatrix.dashboard.vault.budget;
  const savingsCopy = copyMatrix.dashboard.vault.savings;
  const { formatMoney, currencySymbol } = useCurrency();
  const theme = bucketTheme(bucket);

  const goalIds = useMemo(() => goals.map((g) => g.id), [goals]);
  const poolTotal = roundAudAmount(Math.max(0, bucket.balance));

  const [amountInput, setAmountInput] = useState("");
  const [destination, setDestination] = useState<MoveTarget>("pool");
  const [premiumGoalsOpen, setPremiumGoalsOpen] = useState(false);
  const [createGoalOpen, setCreateGoalOpen] = useState(false);
  const [newGoalName, setNewGoalName] = useState("");
  const [newGoalTarget, setNewGoalTarget] = useState("");
  const [goalAllocationDrafts, setGoalAllocationDrafts] = useState<Record<string, number>>({});
  const [activeGoalAction, setActiveGoalAction] = useState<{ goalId: SavingsGoalId; mode: GoalActionMode } | null>(null);
  const [renameGoalId, setRenameGoalId] = useState<SavingsGoalId | null>(null);
  const [renameGoalValue, setRenameGoalValue] = useState("");

  const allocatedTotal = sumAllocations(goalAllocationDrafts);
  const remainingTotal = roundAudAmount(Math.max(0, poolTotal - allocatedTotal));
  const isFullyAssigned = poolTotal > 0 && Math.abs(remainingTotal) < 0.01;
  const showGoalSliders = goals.length > 0 && poolTotal > 0;

  useEffect(() => {
    if (poolTotal <= 0) setGoalAllocationDrafts({});
  }, [poolTotal]);

  useEffect(() => {
    setGoalAllocationDrafts((current) => {
      const next = { ...current };
      for (const id of goalIds) if (next[id] === undefined) next[id] = 0;
      for (const id of Object.keys(next)) if (!goalIds.includes(id as SavingsGoalId)) delete next[id];
      return next;
    });
  }, [goalIds]);

  const handleGoalSliderChange = useCallback(
    (goalId: string, nextValue: number) => {
      const goal = goals.find((g) => g.id === goalId);
      if (!goal) return;

      setGoalAllocationDrafts((current) => {
        const others = goalIds
          .filter((id) => id !== goalId)
          .reduce((sum, id) => sum + (current[id] ?? 0), 0);
        const headroom = Math.max(0, goal.targetAmount - goal.balance);
        const clamped = roundToHalfStep(
          Math.min(Math.max(0, nextValue), Math.max(0, Math.min(poolTotal - others, headroom))),
        );
        return { ...current, [goalId]: clamped };
      });
    },
    [goalIds, goals, poolTotal],
  );

  const destinations = [
    { id: "pool" as const, label: budgetCopy.movePoolOption },
    ...buckets.filter((e) => e.id !== bucket.id).map((e) => ({ id: e.id as MoveTarget, label: e.name })),
  ];

  function runMove() {
    const amount = parsePositiveAmount(amountInput);
    if (amount === null || amount > bucket.balance) return;
    onMove(amount, destination);
    setAmountInput("");
  }

  function runSpent() {
    const amount = parsePositiveAmount(amountInput);
    if (amount === null || amount > bucket.balance) return;
    onMarkSpent(amount);
    setAmountInput("");
  }

  function handleCreateGoal(event: FormEvent) {
    event.preventDefault();
    const parsed = Number.parseFloat(newGoalTarget);
    if (!newGoalName.trim() || !Number.isFinite(parsed) || parsed <= 0) return;
    onAddGoal(newGoalName.trim(), roundToHalfStep(parsed));
    setNewGoalName("");
    setNewGoalTarget("");
    setCreateGoalOpen(false);
  }

  function handleAssignGoals() {
    if (!isFullyAssigned) return;
    onAssignGoals(goalAllocationDrafts);
    setGoalAllocationDrafts({});
  }

  function startRenameGoal(goal: SavingsGoal) {
    if (!canRenameSavingsGoal(goal, isPremium)) {
      setPremiumGoalsOpen(true);
      return;
    }
    setRenameGoalId(goal.id);
    setRenameGoalValue(goal.name);
  }

  function saveRenameGoal() {
    if (!renameGoalId || !renameGoalValue.trim()) return;
    onRenameGoal(renameGoalId, renameGoalValue.trim());
    setRenameGoalId(null);
    setRenameGoalValue("");
  }

  return (
    <>
      <div className="mt-3 rounded-xl border-2 bg-white p-4" style={{ borderColor: theme.accent }}>
        <div className="flex items-center justify-between gap-2">
          <p className={cn("font-heading text-base font-extrabold", theme.label)}>
            {bucket.emoji} {bucket.name}
          </p>
          <button type="button" onClick={onClose} className="font-heading text-sm font-bold text-[#1E3A5F]/60">Close</button>
        </div>
        <p className={cn("font-heading text-2xl font-extrabold", theme.label)}>{formatMoney(bucket.balance)}</p>
        <p className="mt-1 font-sans text-sm text-[#1E3A5F]/75">{savingsCopy.saveJarHint}</p>

        <div className="mt-4 flex min-w-0 gap-2">
          <input
            type="number"
            min={0}
            step={ALLOCATION_STEP}
            value={amountInput}
            onChange={(e) => setAmountInput(e.target.value)}
            placeholder={savingsCopy.spendAmountLabel}
            className="min-w-0 flex-1 rounded-xl border border-[#BDE9FB] px-3 py-2.5 text-base outline-none focus:border-[#0CC1E0]"
          />
          <select
            value={destination}
            onChange={(e) => setDestination(e.target.value as MoveTarget)}
            className="max-w-[45%] rounded-xl border border-[#BDE9FB] bg-white px-2 py-2.5 text-sm outline-none"
          >
            {destinations.map((d) => (
              <option key={d.id} value={d.id}>{d.label}</option>
            ))}
          </select>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" disabled={bucket.balance <= 0} onClick={runMove} className={tealBtnClass}>
            {budgetCopy.moveConfirm}
          </button>
          <button type="button" disabled={bucket.balance <= 0} onClick={runSpent} className={spendBtnClass}>
            {savingsCopy.markSpentFromSave}
          </button>
        </div>

        <div className="mt-6 border-t border-[#BDE9FB]/40 pt-4">
          <div className="flex items-center justify-between gap-2">
            <p className={cn("font-heading text-base font-extrabold", theme.label)}>Savings Goals</p>
            {isPremium ? (
              <button type="button" onClick={() => setCreateGoalOpen((o) => !o)} className={linkClass}>
                + {savingsCopy.addGoal}
              </button>
            ) : null}
          </div>

          {createGoalOpen && isPremium ? (
            <form onSubmit={handleCreateGoal} className="mt-3 space-y-3">
              <input value={newGoalName} onChange={(e) => setNewGoalName(e.target.value)} placeholder={savingsCopy.goalNameLabel} className="w-full rounded-xl border border-[#BDE9FB] px-3 py-2.5 text-base outline-none" />
              <div className="flex min-w-0 gap-2">
                <span className="py-2.5 font-bold text-[#031F82]">{currencySymbol}</span>
                <input type="number" min={0} step={ALLOCATION_STEP} value={newGoalTarget} onChange={(e) => setNewGoalTarget(e.target.value)} placeholder={savingsCopy.goalTargetLabel} className="min-w-0 flex-1 rounded-xl border border-[#BDE9FB] px-3 py-2.5 text-base outline-none" />
                <button type="submit" className={cn("shrink-0 px-4 py-2.5", orangeCtaClass)}>{savingsCopy.createGoal}</button>
              </div>
            </form>
          ) : null}

          {showGoalSliders ? (
            <div className="mt-4 space-y-3">
              <div className="flex items-end justify-between gap-2">
                <p className="font-heading text-sm font-extrabold text-[#031F82]">{savingsCopy.goalAllocationHeading}</p>
                {isFullyAssigned ? (
                  <span className="rounded-full bg-[#22C55E]/15 px-2.5 py-0.5 font-heading text-xs font-bold text-[#15803D]">
                    {savingsCopy.goalFullyAssignedLabel}
                  </span>
                ) : (
                  <span className="font-heading text-sm font-bold text-[#FFA503]">
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
                    poolTotal={poolTotal}
                    onSliderChange={handleGoalSliderChange}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={handleAssignGoals}
                disabled={!isFullyAssigned}
                className={cn("h-touch w-full px-4 py-2.5", orangeCtaClass)}
              >
                {savingsCopy.assignToGoals}
              </button>
            </div>
          ) : null}

          {goals.length === 0 ? (
            <p className="mt-3 font-sans text-sm text-[#1E3A5F]/70">No goals yet.</p>
          ) : (
            <ul className="mt-4 space-y-4">
              {goals.map((goal) => {
                const progress = savingsGoalProgress(goal);
                const activeAction = activeGoalAction?.goalId === goal.id ? activeGoalAction.mode : null;
                const isRenaming = renameGoalId === goal.id;

                return (
                  <li key={goal.id} className="space-y-3">
                    <div className="flex items-start gap-3">
                      <span className="text-xl leading-none">{goal.emoji}</span>
                      <div className="min-w-0 flex-1">
                        {isRenaming ? (
                          <input
                            value={renameGoalValue}
                            onChange={(e) => setRenameGoalValue(e.target.value)}
                            onBlur={saveRenameGoal}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") saveRenameGoal();
                              if (e.key === "Escape") setRenameGoalId(null);
                            }}
                            className="w-full rounded-lg border border-[#BDE9FB] px-2 py-1 text-base font-bold outline-none"
                            autoFocus
                          />
                        ) : (
                          <button
                            type="button"
                            onClick={() => startRenameGoal(goal)}
                            className="truncate text-left font-heading text-base font-bold text-[#031F82]"
                          >
                            {goal.name}
                          </button>
                        )}
                        <p className="mt-0.5 font-sans text-sm text-[#1E3A5F]">
                          {formatMoney(goal.balance)} / {formatMoney(goal.targetAmount)}
                        </p>
                        <div className="mt-2">
                          <GoalProgressBar progress={progress} color="#DCB766" trackColor="#FEF3C7" />
                        </div>
                      </div>
                      <span className="font-heading text-sm font-bold text-[#DCB766]">{Math.round(progress)}%</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveGoalAction(activeAction === "increase" ? null : { goalId: goal.id, mode: "increase" })}
                        className={cn(ghostBtnClass, activeAction === "increase" && "border-[#22C55E] text-[#15803D]")}
                      >
                        {savingsCopy.increaseGoal}
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveGoalAction(activeAction === "spend" ? null : { goalId: goal.id, mode: "spend" })}
                        className={cn(ghostBtnClass, activeAction === "spend" && "border-[#FDA4AF]")}
                      >
                        {savingsCopy.spendFromGoal}
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveGoalAction(activeAction === "move" ? null : { goalId: goal.id, mode: "move" })}
                        className={cn(ghostBtnClass, activeAction === "move" && "border-[#0CC1E0]")}
                      >
                        {savingsCopy.moveFromGoal}
                      </button>
                    </div>
                    {activeAction ? (
                      <GoalActionPanel
                        goal={goal}
                        mode={activeAction}
                        saveJarBalance={bucket.balance}
                        buckets={buckets}
                        onIncrease={(amount) => onAllocateToGoal(goal.id, amount)}
                        onSpend={(amount) => onSpendFromGoal(goal.id, amount)}
                        onMove={(amount, dest) => onMoveFromGoal(goal.id, amount, dest)}
                        onClose={() => setActiveGoalAction(null)}
                      />
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}

          {!isPremium ? (
            <button
              type="button"
              onClick={() => setPremiumGoalsOpen(true)}
              className="mt-4 w-full rounded-xl border border-dashed border-[#DCB766]/60 px-3 py-3 text-left"
            >
              <p className="font-heading text-sm font-bold text-[#DCB766]">{savingsCopy.premiumGoalsPrompt}</p>
            </button>
          ) : null}
        </div>
      </div>

      <PremiumGoalsModal isOpen={premiumGoalsOpen} onClose={() => setPremiumGoalsOpen(false)} />
    </>
  );
}
