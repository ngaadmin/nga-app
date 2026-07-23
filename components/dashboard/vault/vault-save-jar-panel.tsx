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
import {
  VaultTransferControls,
  VaultTransferToggle,
  vaultActionLinkActiveClass,
  vaultActionLinkClass,
  vaultActionPanelClass,
  vaultConfirmLinkClass,
  vaultFieldInputClass,
  vaultGhostBtnClass,
} from "@/components/dashboard/vault/vault-transfer-controls";
import { VaultAllocationSlider } from "@/components/dashboard/vault/vault-allocation-slider";
import { copyMatrix } from "@/constants/copyMatrix";
import { useCurrency } from "@/lib/dashboard/currency-context";
import { roundAudAmount, roundToHalfStep } from "@/lib/dashboard/destination-jars";
import {
  parsePositiveVaultAmount,
  capAllocationDrafts,
  clampVaultAllocationEntry,
  sumAllocationDraftValues,
  vaultSliderMaxForEntry,
  VAULT_AMOUNT_STEP,
} from "@/lib/dashboard/vault-amount-input";
import {
  savingsGoalPercentAchieved,
  savingsGoalProgress,
  type SavingsGoal,
  type SavingsGoalId,
} from "@/lib/dashboard/savings-goals";
import { sumAllocations, type VaultBucket } from "@/lib/dashboard/vault-buckets";
import {
  buildVaultTransferLocations,
  type VaultTransferLocationId,
} from "@/lib/dashboard/vault-transfer";
import { cn } from "@/lib/utils/cn";

const orangeCtaClass =
  "rounded-nga-lg border-b-4 border-[#C88202] bg-[#FFA503] font-heading text-xs font-bold uppercase tracking-wide text-[#031F82] disabled:opacity-40";
const confirmBtnClass =
  "rounded-lg border border-[#0CC1E0] bg-white px-3 py-1.5 font-heading text-sm font-bold text-[#031F82] disabled:opacity-40";

type GoalActionMode = "change-target" | "spend" | "move";

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
  sliderMax,
  onSliderChange,
}: {
  goal: SavingsGoal;
  draft: number;
  poolTotal: number;
  sliderMax: number;
  onSliderChange: (goalId: string, value: number) => void;
}) {
  const { formatMoney } = useCurrency();

  return (
    <div className="py-2.5">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-2">
        <span className="truncate font-heading text-xs font-bold text-[#031F82]">
          {goal.emoji} {goal.name}
        </span>
        <span className="shrink-0 font-heading text-xs font-extrabold tabular-nums text-[#15803D]">
          {formatMoney(draft)}
        </span>
        <div className="col-span-2 min-w-0">
          <VaultAllocationSlider
            value={draft}
            max={sliderMax}
            poolTotal={poolTotal}
            onChange={(nextValue) => onSliderChange(goal.id, nextValue)}
            accentColor="#22C55E"
            trackClassName="bg-[#22C55E]/20"
            ariaLabel={`Assign to ${goal.name}`}
            disabled={poolTotal <= 0 || sliderMax <= 0}
            className="-my-2"
          />
        </div>
      </div>
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
  const [amountInput, setAmountInput] = useState(
    goal.targetAmount > 0 ? String(goal.targetAmount) : "",
  );

  function run() {
    const amount = parsePositiveVaultAmount(amountInput);
    if (amount === null) return;
    onUpdateTarget(amount);
    onClose();
  }

  return (
    <div className="space-y-2 rounded-lg bg-[#F0FBFF]/40 px-2 py-2">
      <p className="font-sans text-[10px] text-[#1E3A5F]/70">{savingsCopy.changeGoalTargetHint}</p>
      <div className="flex min-w-0 items-center gap-1.5">
        <span className="font-bold text-[#031F82]">{currencySymbol}</span>
        <input
          type="number"
          min={0}
          step={VAULT_AMOUNT_STEP}
          value={amountInput}
          onChange={(e) => setAmountInput(e.target.value)}
          placeholder={savingsCopy.goalTargetLabel}
          className="min-w-0 flex-1 rounded-lg border border-[#BDE9FB] bg-white px-2 py-1.5 text-sm outline-none focus:border-[#0CC1E0]"
        />
      </div>
      <div className="flex gap-1.5">
        <button type="button" onClick={run} className={confirmBtnClass}>
          {savingsCopy.setGoalConfirm}
        </button>
        <button type="button" onClick={onClose} className={vaultGhostBtnClass}>
          {savingsCopy.spendCancel}
        </button>
      </div>
    </div>
  );
}

function GoalFundsActions({
  goal,
  transferLocations,
  spendOpen,
  moveOpen,
  onToggleSpend,
  onToggleMove,
  onSpend,
  onTransfer,
  onClose,
}: {
  goal: SavingsGoal;
  transferLocations: ReturnType<typeof buildVaultTransferLocations>;
  spendOpen: boolean;
  moveOpen: boolean;
  onToggleSpend: () => void;
  onToggleMove: () => void;
  onSpend: (amount: number, note?: string) => void;
  onTransfer: (
    from: VaultTransferLocationId,
    to: VaultTransferLocationId,
    amount: number,
  ) => void;
  onClose: () => void;
}) {
  const savingsCopy = copyMatrix.dashboard.vault.savings;
  const [spendAmount, setSpendAmount] = useState("");
  const [spendNote, setSpendNote] = useState("");

  useEffect(() => {
    if (!spendOpen) {
      setSpendAmount("");
      setSpendNote("");
    }
  }, [spendOpen]);

  function confirmSpend() {
    const amount = parsePositiveVaultAmount(spendAmount);
    if (amount === null || amount > goal.balance) return;
    const note = spendNote.trim();
    onSpend(amount, note || undefined);
    onClose();
  }

  const canUseFunds = goal.balance > 0;
  const canMoveOut = goal.balance > 0 && transferLocations.length > 0;

  return (
    <div className="space-y-2 border-t border-[#BDE9FB]/40 pt-2">
      <div className="flex items-center justify-between gap-x-4 gap-y-1">
        <button
          type="button"
          onClick={onToggleSpend}
          disabled={!canUseFunds}
          className={cn(vaultActionLinkClass, spendOpen && vaultActionLinkActiveClass)}
        >
          {savingsCopy.spendMoney}
        </button>
        {canMoveOut ? (
          <VaultTransferToggle
            isOpen={moveOpen}
            disabled={!canMoveOut}
            onToggle={onToggleMove}
          />
        ) : null}
      </div>

      {spendOpen && canUseFunds ? (
        <div className={vaultActionPanelClass}>
          <div className="flex min-w-0 gap-2">
            <input
              type="number"
              min={0}
              step={VAULT_AMOUNT_STEP}
              value={spendAmount}
              onChange={(e) => setSpendAmount(e.target.value)}
              placeholder={savingsCopy.spendAmountLabel}
              aria-label={savingsCopy.spendAmountLabel}
              className={cn("w-24 shrink-0", vaultFieldInputClass)}
            />
            <input
              type="text"
              value={spendNote}
              onChange={(e) => setSpendNote(e.target.value)}
              placeholder={savingsCopy.spendOnLabel}
              aria-label={savingsCopy.spendOnLabel}
              className={cn("min-w-0 flex-1", vaultFieldInputClass)}
            />
          </div>
          <div className="flex items-center gap-3">
            <button type="button" onClick={confirmSpend} className={vaultConfirmLinkClass}>
              {savingsCopy.spendGoalConfirm}
            </button>
            <button type="button" onClick={onClose} className={vaultGhostBtnClass}>
              {savingsCopy.spendCancel}
            </button>
          </div>
        </div>
      ) : null}

      <VaultTransferControls
        contextId={goal.id}
        contextBalance={goal.balance}
        locations={transferLocations}
        isOpen={moveOpen}
        onToggle={onToggleMove}
        onTransfer={onTransfer}
        onClose={onClose}
        showToggle={false}
      />

      {!canUseFunds && spendOpen ? (
        <p className="font-sans text-[10px] text-[#1E3A5F]/70">{savingsCopy.goalEmptyHint}</p>
      ) : null}
    </div>
  );
}

export type SaveJarPanelProps = {
  bucket: VaultBucket;
  buckets: VaultBucket[];
  isPremium: boolean;
  goals: SavingsGoal[];
  moneyToAllocate: number;
  poolLabel: string;
  onAddGoal: (name: string, targetAmount: number) => void;
  onUpdateGoalTarget: (goalId: SavingsGoalId, targetAmount: number) => void;
  onAssignGoals: (allocations: Record<string, number>) => void;
  onSpendFromGoal: (goalId: SavingsGoalId, amount: number, note?: string) => void;
  onVaultTransfer: (
    from: VaultTransferLocationId,
    to: VaultTransferLocationId,
    amount: number,
  ) => void;
  onClose: () => void;
};

export function SaveJarExpandedPanel({
  bucket,
  buckets,
  isPremium,
  goals,
  moneyToAllocate,
  poolLabel,
  onAddGoal,
  onUpdateGoalTarget,
  onAssignGoals,
  onSpendFromGoal,
  onVaultTransfer,
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
  const hasAllocationDraft = allocatedTotal > 0;
  const canSplitGoals = unassignedSavings > 0 && goals.length > 0;

  useEffect(() => {
    if (unassignedSavings <= 0) {
      setGoalAllocationDrafts({});
      setAllocationOpen(false);
      return;
    }

    setGoalAllocationDrafts((current) => {
      if (sumAllocationDraftValues(current) <= unassignedSavings) return current;
      return capAllocationDrafts(current, unassignedSavings, goalIds);
    });
  }, [goalIds, unassignedSavings]);

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
      setGoalAllocationDrafts((current) => {
        const others = roundAudAmount(
          goalIds
            .filter((id) => id !== goalId)
            .reduce((sum, id) => sum + (current[id] ?? 0), 0),
        );
        const clamped = clampVaultAllocationEntry(unassignedSavings, others, nextValue);
        return { ...current, [goalId]: clamped };
      });
    },
    [goalIds, unassignedSavings],
  );

  function handleAssignGoals() {
    if (!hasAllocationDraft) return;
    onAssignGoals(
      capAllocationDrafts(goalAllocationDrafts, unassignedSavings, goalIds),
    );
    setGoalAllocationDrafts({});
    setAllocationOpen(false);
  }

  function handleCreateGoal(event: FormEvent) {
    event.preventDefault();
    const parsed = Number.parseFloat(newGoalTarget);
    if (!newGoalName.trim() || !Number.isFinite(parsed) || parsed <= 0) return;
    onAddGoal(newGoalName.trim(), roundToHalfStep(parsed));
    setNewGoalName("");
    setNewGoalTarget("");
    setManageGoalsOpen(false);
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
          <p className="font-heading text-lg font-extrabold text-[#031F82]">
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

        {unassignedSavings > 0 ? (
          <div className="mt-2 border-b border-[#BDE9FB]/50 pb-2">
            <p className="font-heading text-base font-extrabold text-[#031F82]">
              {savingsCopy.savingsToAllocateLabel}
            </p>
            <button
              type="button"
              onClick={() => setAllocationOpen((open) => !open)}
              disabled={!canSplitGoals}
              aria-expanded={allocationOpen}
              aria-label={`${savingsCopy.savingsToAllocateLabel}: ${formatMoney(unassignedSavings)}. ${savingsCopy.clickToAllocateHint}`}
              className={cn(
                "mt-1.5 flex flex-wrap items-center gap-2 text-left",
                canSplitGoals && "cursor-pointer",
              )}
            >
              <span className="rounded-full bg-[#FFA503] px-2.5 py-0.5 font-heading text-xs font-bold text-[#031F82]">
                {formatMoney(unassignedSavings)}
              </span>
              {canSplitGoals && !allocationOpen ? (
                <span className="font-heading text-xs font-bold text-[#0CC1E0] underline-offset-2 hover:underline">
                  {savingsCopy.clickToAllocateHint}
                </span>
              ) : null}
            </button>
          </div>
        ) : null}

        {allocationOpen && canSplitGoals ? (
          <div className="mt-2 space-y-2 border-b border-[#BDE9FB]/50 pb-2">
            <div className="flex items-center justify-between gap-2">
              <p className="font-heading text-xs font-extrabold text-[#031F82]">
                {savingsCopy.goalAllocationHeading}
              </p>
              {hasAllocationDraft && remainingTotal > 0 ? (
                <span className="font-heading text-[10px] font-bold text-[#FFA503]">
                  {savingsCopy.goalRemainingLabel}: {formatMoney(remainingTotal)}
                </span>
              ) : hasAllocationDraft ? (
                <span className="rounded-full bg-[#22C55E]/15 px-2 py-0.5 font-heading text-[10px] font-bold text-[#15803D]">
                  {formatMoney(allocatedTotal)} ready
                </span>
              ) : (
                <span className="font-heading text-[10px] font-bold text-[#1E3A5F]/60">
                  {formatMoney(unassignedSavings)} available
                </span>
              )}
            </div>
            <div className="min-w-0 divide-y divide-[#BDE9FB]/30">
              {goals.map((goal) => (
                <GoalAllocationSliderRow
                  key={goal.id}
                  goal={goal}
                  draft={goalAllocationDrafts[goal.id] ?? 0}
                  poolTotal={unassignedSavings}
                  sliderMax={vaultSliderMaxForEntry(
                    unassignedSavings,
                    goalAllocationDrafts,
                    goal.id,
                  )}
                  onSliderChange={handleGoalSliderChange}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={handleAssignGoals}
              disabled={!hasAllocationDraft}
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
              const transferLocations = buildVaultTransferLocations(
                buckets,
                goals,
                goal.id,
              );

              return (
                <li
                  key={goal.id}
                  className="space-y-2 rounded-lg border border-[#BDE9FB]/60 bg-[#FAFDFF]/80 p-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="min-w-0 truncate font-heading text-sm font-bold text-[#031F82]">
                      {goal.emoji} {goal.name}
                    </p>
                    <button
                      type="button"
                      onClick={() => toggleGoalAction(goal.id, "change-target")}
                      className={cn(vaultActionLinkClass, "shrink-0 text-right")}
                    >
                      {savingsCopy.setOrChangeSavingsTarget}
                    </button>
                  </div>

                  <p className="font-heading text-lg font-extrabold leading-tight text-[#15803D]">
                    {formatMoney(goal.balance)}
                  </p>

                  {activeAction === "change-target" ? (
                    <ChangeGoalTargetPanel
                      goal={goal}
                      onUpdateTarget={(target) => onUpdateGoalTarget(goal.id, target)}
                      onClose={() => setActiveGoalAction(null)}
                    />
                  ) : null}

                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-heading text-sm font-extrabold text-[#031F82]">
                        {savingsCopy.currentProgressHeading}
                      </p>
                      <p
                        className={cn(
                          "mt-0.5 font-heading text-xs font-bold",
                          goal.targetAmount > 0 && percentAchieved >= 100
                            ? "text-[#15803D]"
                            : "text-[#1E3A5F]/70",
                        )}
                      >
                        {goal.targetAmount > 0
                          ? savingsCopy.percentToTargetTemplate.replace(
                              "{percent}",
                              String(percentAchieved),
                            )
                          : "—"}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-heading text-sm font-extrabold text-[#031F82]">
                        {savingsCopy.goalTargetLabel}
                      </p>
                      <p className="mt-0.5 font-heading text-sm font-extrabold text-[#031F82]">
                        {goal.targetAmount > 0
                          ? formatMoney(goal.targetAmount)
                          : savingsCopy.goalTargetUnset}
                      </p>
                    </div>
                  </div>

                  <GoalProgressBar
                    progress={goal.targetAmount > 0 ? progress : 0}
                    color="#22C55E"
                    trackColor="#DCFCE7"
                    variant="goal"
                  />

                  <GoalFundsActions
                    goal={goal}
                    transferLocations={transferLocations}
                    spendOpen={activeAction === "spend"}
                    moveOpen={activeAction === "move"}
                    onToggleSpend={() => toggleGoalAction(goal.id, "spend")}
                    onToggleMove={() => toggleGoalAction(goal.id, "move")}
                    onSpend={(amount, note) => onSpendFromGoal(goal.id, amount, note)}
                    onTransfer={onVaultTransfer}
                    onClose={() => setActiveGoalAction(null)}
                  />
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
