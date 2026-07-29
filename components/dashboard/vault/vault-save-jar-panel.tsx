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
import { VaultExpandableSectionHeader } from "@/components/dashboard/vault/vault-expandable-section-header";
import { copyMatrix } from "@/constants/copyMatrix";
import { useCurrency } from "@/lib/dashboard/currency-context";
import { useAutoExpandOnIncrease } from "@/lib/dashboard/use-auto-expand-on-increase";
import { roundAudAmount, roundToHalfStep } from "@/lib/dashboard/destination-jars";
import {
  parsePositiveVaultAmount,
  capAllocationDrafts,
  clampVaultAllocationEntry,
  isVaultAllocationComplete,
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
  "rounded-nga-lg border-b-4 border-[#C88202] bg-[#FFA503] font-heading text-xs font-bold uppercase tracking-wide text-[#031F82] disabled:opacity-40 transition-all hover:brightness-[1.02] active:translate-y-[2px] active:border-b-2 disabled:cursor-not-allowed";
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

function GoalAllocationInputRow({
  goal,
  draft,
  poolTotal,
  sliderMax,
  inputValue,
  onInputChange,
  onInputBlur,
  onInputFocus,
  onSliderChange,
}: {
  goal: SavingsGoal;
  draft: number;
  poolTotal: number;
  sliderMax: number;
  inputValue: string;
  onInputChange: (goalId: string, rawValue: string) => void;
  onInputBlur: (goalId: string) => void;
  onInputFocus: (goalId: string) => void;
  onSliderChange: (goalId: string, value: number) => void;
}) {
  const { formatMoney, currencySymbol } = useCurrency();

  return (
    <div className="py-2.5">
      <p className="mb-1.5 truncate font-heading text-xs font-bold text-[#031F82]">
        {goal.emoji} {goal.name}
      </p>
      <div className="flex min-w-0 items-center gap-2">
        <div className="flex h-14 w-10 shrink-0 items-center justify-center self-center rounded-lg border border-[#BDE9FB]/60 bg-[#FAFDFF] text-lg leading-none">
          {goal.emoji}
        </div>
        <label className="flex w-[5.75rem] shrink-0 items-center gap-1 rounded-lg border border-[#BDE9FB] bg-white px-2 py-1.5">
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
        <div className="min-w-0 flex-1">
          <VaultAllocationSlider
            value={draft}
            max={sliderMax}
            poolTotal={poolTotal}
            onChange={(nextValue) => onSliderChange(goal.id, nextValue)}
            accentColor="#22C55E"
            trackClassName="bg-[#22C55E]/20"
            ariaLabel={`Assign to ${goal.name}: ${formatMoney(draft)} of ${formatMoney(poolTotal)}`}
            disabled={poolTotal <= 0 || sliderMax <= 0}
            className="-my-2 [&>div]:min-h-7 [&>div]:px-1 [&>div]:py-0"
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

export type VaultSavingsGoalsSectionProps = {
  unassignedSavings: number;
  buckets: VaultBucket[];
  isPremium: boolean;
  goals: SavingsGoal[];
  onAddGoal: (name: string, targetAmount: number) => void;
  onUpdateGoalTarget: (goalId: SavingsGoalId, targetAmount: number) => void;
  onAssignGoals: (allocations: Record<string, number>) => void;
  onSpendFromGoal: (goalId: SavingsGoalId, amount: number, note?: string) => void;
  onVaultTransfer: (
    from: VaultTransferLocationId,
    to: VaultTransferLocationId,
    amount: number,
  ) => void;
};

export function VaultSavingsGoalsSection({
  unassignedSavings,
  buckets,
  isPremium,
  goals,
  onAddGoal,
  onUpdateGoalTarget,
  onAssignGoals,
  onSpendFromGoal,
  onVaultTransfer,
}: VaultSavingsGoalsSectionProps) {
  const savingsCopy = copyMatrix.dashboard.vault.savings;
  const { formatMoney, currencySymbol } = useCurrency();

  const goalIds = useMemo(() => goals.map((goal) => goal.id), [goals]);
  const poolTotal = roundAudAmount(Math.max(0, unassignedSavings));

  const [premiumGoalsOpen, setPremiumGoalsOpen] = useState(false);
  const [manageGoalsOpen, setManageGoalsOpen] = useState(false);
  const [newGoalName, setNewGoalName] = useState("");
  const [newGoalTarget, setNewGoalTarget] = useState("");
  const [goalAllocationDrafts, setGoalAllocationDrafts] = useState<Record<string, number>>({});
  const [goalAllocationInputs, setGoalAllocationInputs] = useState<Record<string, string>>({});
  const [focusedGoalAllocationId, setFocusedGoalAllocationId] = useState<string | null>(null);
  const [savingsSectionOpen, setSavingsSectionOpen] = useState(false);
  const [activeGoalAction, setActiveGoalAction] = useState<{
    goalId: SavingsGoalId;
    mode: GoalActionMode;
  } | null>(null);

  const allocatedTotal = sumAllocations(goalAllocationDrafts);
  const remainingTotal = roundAudAmount(Math.max(0, poolTotal - allocatedTotal));
  const isFullyAllocated = isVaultAllocationComplete(allocatedTotal, poolTotal);
  const hasAllocationDraft = allocatedTotal > 0;
  const canSplitGoals = goals.length > 0;

  useAutoExpandOnIncrease(poolTotal, setSavingsSectionOpen);

  useEffect(() => {
    if (poolTotal <= 0) {
      setGoalAllocationDrafts({});
      setGoalAllocationInputs({});
      setFocusedGoalAllocationId(null);
      return;
    }

    setGoalAllocationDrafts((current) => {
      if (sumAllocationDraftValues(current) <= poolTotal) return current;
      return capAllocationDrafts(current, poolTotal, goalIds);
    });
  }, [goalIds, poolTotal]);

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
        const clamped = clampVaultAllocationEntry(poolTotal, others, nextValue);
        return { ...current, [goalId]: clamped };
      });
    },
    [goalIds, poolTotal],
  );

  const getGoalAllocationInputValue = useCallback(
    (goalId: string, draft: number) => {
      if (focusedGoalAllocationId === goalId) {
        return goalAllocationInputs[goalId] ?? (draft > 0 ? String(draft) : "");
      }
      return draft > 0 ? String(draft) : "";
    },
    [focusedGoalAllocationId, goalAllocationInputs],
  );

  const handleGoalAllocationInputChange = useCallback(
    (goalId: string, rawValue: string) => {
      if (rawValue !== "" && !/^\d*\.?\d*$/.test(rawValue)) return;

      setGoalAllocationInputs((current) => ({ ...current, [goalId]: rawValue }));

      if (rawValue === "" || rawValue === ".") {
        handleGoalSliderChange(goalId, 0);
        return;
      }

      const parsed = Number.parseFloat(rawValue);
      if (Number.isFinite(parsed) && parsed >= 0) {
        handleGoalSliderChange(goalId, parsed);
      }
    },
    [handleGoalSliderChange],
  );

  const handleGoalAllocationInputFocus = useCallback(
    (goalId: string) => {
      setFocusedGoalAllocationId(goalId);
      setGoalAllocationInputs((current) => {
        const draft = goalAllocationDrafts[goalId] ?? 0;
        if (current[goalId] !== undefined) return current;
        return {
          ...current,
          [goalId]: draft > 0 ? String(draft) : "",
        };
      });
    },
    [goalAllocationDrafts],
  );

  const handleGoalAllocationInputBlur = useCallback(
    (goalId: string) => {
      setFocusedGoalAllocationId((current) => (current === goalId ? null : current));
      const draft = goalAllocationDrafts[goalId] ?? 0;
      setGoalAllocationInputs((current) => ({
        ...current,
        [goalId]: draft > 0 ? String(draft) : "",
      }));
    },
    [goalAllocationDrafts],
  );

  function handleAssignGoals() {
    if (!hasAllocationDraft) return;
    onAssignGoals(
      capAllocationDrafts(goalAllocationDrafts, poolTotal, goalIds),
    );
    setGoalAllocationDrafts({});
    setGoalAllocationInputs({});
    setFocusedGoalAllocationId(null);
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

  const goalAllocationBadge = isFullyAllocated ? (
    <span className="rounded-full bg-[#22C55E]/15 px-2.5 py-0.5 font-heading text-xs font-bold text-[#15803D]">
      {savingsCopy.fullyAllocatedLabel}
    </span>
  ) : (
    <div className="text-right">
      <p className="font-heading text-xs font-bold uppercase tracking-wide text-[#FFA503]">
        {savingsCopy.savingsToAllocateLabel}
      </p>
      <p className="mt-0.5 font-heading text-2xl font-extrabold leading-none tabular-nums text-[#031F82]">
        {formatMoney(remainingTotal)}
      </p>
    </div>
  );

  return (
    <>
      <section
        id="vault-savings-goals-section"
        aria-label={savingsCopy.sectionTitle}
        className="scroll-mt-4 space-y-4 border-t border-[#BDE9FB]/40 pt-5"
      >
        <VaultExpandableSectionHeader
          title={savingsCopy.sectionTitle}
          isOpen={savingsSectionOpen}
          onToggle={() => setSavingsSectionOpen((open) => !open)}
          onClose={() => setSavingsSectionOpen(false)}
          badge={goalAllocationBadge}
        />

        <div
          className={cn(
            "grid transition-all duration-300 ease-in-out",
            savingsSectionOpen
              ? "grid-rows-[1fr] opacity-100"
              : "grid-rows-[0fr] opacity-0",
          )}
          aria-hidden={!savingsSectionOpen}
        >
          <div className="space-y-4 overflow-hidden">
            {canSplitGoals ? (
              <>
                <div className="min-w-0 divide-y divide-[#BDE9FB]/30">
                  {goals.map((goal) => (
                    <GoalAllocationInputRow
                      key={goal.id}
                      goal={goal}
                      draft={goalAllocationDrafts[goal.id] ?? 0}
                      poolTotal={poolTotal}
                      sliderMax={vaultSliderMaxForEntry(
                        poolTotal,
                        goalAllocationDrafts,
                        goal.id,
                      )}
                      inputValue={getGoalAllocationInputValue(
                        goal.id,
                        goalAllocationDrafts[goal.id] ?? 0,
                      )}
                      onInputChange={handleGoalAllocationInputChange}
                      onInputBlur={handleGoalAllocationInputBlur}
                      onInputFocus={handleGoalAllocationInputFocus}
                      onSliderChange={handleGoalSliderChange}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={handleAssignGoals}
                  disabled={!hasAllocationDraft}
                  className={cn("h-touch w-full px-4 py-2.5", orangeCtaClass)}
                >
                  {savingsCopy.assignToGoals}
                </button>
              </>
            ) : (
              <p className="font-sans text-xs leading-snug text-[#1E3A5F]/70">
                {savingsCopy.noGoalsYet}
              </p>
            )}

            {goals.length > 0 ? (
              <ul className="space-y-2 border-t border-[#BDE9FB]/40 pt-4">
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
                    <p className="min-w-0 truncate font-heading text-xs font-bold text-[#031F82]">
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
            ) : null}

            {manageGoalsOpen && isPremium ? (
              <form onSubmit={handleCreateGoal} className="space-y-2 border-t border-[#BDE9FB]/50 pt-2">
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
              className="font-heading text-xs font-bold text-[#0CC1E0] hover:underline"
            >
              {savingsCopy.manageSavingsGoals}
            </button>
          </div>
        </div>
      </section>

      <PremiumGoalsModal isOpen={premiumGoalsOpen} onClose={() => setPremiumGoalsOpen(false)} />
    </>
  );
}

export type SaveJarPanelProps = {
  bucket: VaultBucket;
  onClose: () => void;
};

export function SaveJarExpandedPanel({ bucket, onClose }: SaveJarPanelProps) {
  const savingsCopy = copyMatrix.dashboard.vault.savings;
  const { formatMoney } = useCurrency();

  return (
    <div className="mt-2 rounded-xl border border-[#BDE9FB] bg-white p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="font-heading text-base font-extrabold text-[#031F82]">
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
      <p className="mt-2 font-sans text-xs leading-snug text-[#1E3A5F]/70">
        {formatMoney(bucket.balance)} unassigned in my Save Jar. Use the{" "}
        {savingsCopy.sectionTitle} section above to allocate funds and manage goals.
      </p>
    </div>
  );
}
