"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { ModalShell } from "@/components/ui/modal-shell";
import { ProgressRing } from "@/components/dashboard/vault/vault-visuals";
import { copyMatrix } from "@/constants/copyMatrix";
import { useCurrency } from "@/lib/dashboard/currency-context";
import { roundToHalfStep } from "@/lib/dashboard/destination-jars";
import {
  savingsGoalProgress,
  type SavingsGoal,
  type SavingsGoalId,
} from "@/lib/dashboard/savings-goals";
import { cn } from "@/lib/utils/cn";

const orangeCtaClass =
  "rounded-nga-lg border-b-4 border-[#C88202] bg-[#FFA503] font-heading text-xs font-bold uppercase tracking-wide text-[#031F82] disabled:opacity-40";
const tealBtnClass =
  "rounded-lg border border-[#0CC1E0] bg-white px-2.5 py-1 font-heading text-[10px] font-bold text-[#031F82] disabled:opacity-40";
const spendBtnClass =
  "rounded-lg border border-[#FDA4AF] bg-[#FDA4AF]/25 px-2.5 py-1 font-heading text-[10px] font-bold text-[#031F82] disabled:opacity-40";
const linkClass =
  "font-heading text-[10px] font-bold text-[#0CC1E0] hover:underline";
const ALLOCATION_STEP = 0.5;

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

function InlineAmountActions({
  label,
  maxAmount,
  showReturn,
  returnLabel,
  onSpend,
  onReturn,
  onClose,
}: {
  label: string;
  maxAmount: number;
  showReturn?: boolean;
  returnLabel?: string;
  onSpend: (amount: number) => void;
  onReturn?: (amount: number) => void;
  onClose: () => void;
}) {
  const copy = copyMatrix.dashboard.vault.savings;
  const [amountInput, setAmountInput] = useState("");

  function run(action: (amount: number) => void) {
    const amount = parsePositiveAmount(amountInput);
    if (amount === null || amount > maxAmount) return;
    action(amount);
    setAmountInput("");
    onClose();
  }

  if (maxAmount <= 0) return null;

  return (
    <div className="mt-2 rounded-lg border border-[#BDE9FB]/60 bg-[#F7FBFF]/80 px-2.5 py-2">
      <p className="font-heading text-[10px] font-bold text-[#031F82]">{label}</p>
      <input
        type="number"
        min={0}
        step={ALLOCATION_STEP}
        value={amountInput}
        onChange={(e) => setAmountInput(e.target.value)}
        placeholder="Amount"
        className="mt-1 w-full rounded-lg border border-[#BDE9FB] bg-white px-2 py-1.5 text-sm outline-none"
      />
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        <button type="button" onClick={() => run(onSpend)} className={spendBtnClass}>{copy.spendConfirm}</button>
        {showReturn && onReturn ? (
          <button type="button" onClick={() => run(onReturn)} className={tealBtnClass}>{returnLabel ?? copy.returnToAllocate}</button>
        ) : null}
      </div>
    </div>
  );
}

export type VaultSavingsSectionProps = {
  isPremium: boolean;
  totalSavings: number;
  saveJarBalance: number;
  futureSavingsPotential: number;
  futureSubtext: string;
  defaultGoal: SavingsGoal;
  goals: SavingsGoal[];
  calculatorOpen: boolean;
  onToggleCalculator: () => void;
  calculatorPanel: ReactNode;
  onAddGoal: (name: string, targetAmount: number) => void;
  onAllocateToGoal: (goalId: SavingsGoalId, amount: number) => void;
  onSpendFromSaveJar: (amount: number) => void;
  onWithdrawSaveJarToPool: (amount: number) => void;
  onSpendFromGoal: (goalId: SavingsGoalId, amount: number) => void;
  onReturnGoalToSaveJar: (goalId: SavingsGoalId, amount: number) => void;
  formatMoney: (amount: number) => string;
};

export function VaultSavingsSection({
  isPremium,
  totalSavings,
  saveJarBalance,
  futureSavingsPotential,
  futureSubtext,
  defaultGoal,
  goals,
  calculatorOpen,
  onToggleCalculator,
  calculatorPanel,
  onAddGoal,
  onAllocateToGoal,
  onSpendFromSaveJar,
  onWithdrawSaveJarToPool,
  onSpendFromGoal,
  onReturnGoalToSaveJar,
  formatMoney,
}: VaultSavingsSectionProps) {
  const copy = copyMatrix.dashboard.vault.savings;
  const { currencySymbol } = useCurrency();
  const [premiumGoalsOpen, setPremiumGoalsOpen] = useState(false);
  const [createGoalOpen, setCreateGoalOpen] = useState(false);
  const [newGoalName, setNewGoalName] = useState("");
  const [newGoalTarget, setNewGoalTarget] = useState("");
  const [saveJarOpen, setSaveJarOpen] = useState(false);
  const [openGoalId, setOpenGoalId] = useState<SavingsGoalId | null>(null);
  const [allocateDrafts, setAllocateDrafts] = useState<Record<string, string>>({});

  const defaultProgress = savingsGoalProgress(defaultGoal);

  function handleCreateGoal(event: FormEvent) {
    event.preventDefault();
    const parsed = Number.parseFloat(newGoalTarget);
    if (!newGoalName.trim() || !Number.isFinite(parsed) || parsed <= 0) return;
    onAddGoal(newGoalName.trim(), roundToHalfStep(parsed));
    setNewGoalName("");
    setNewGoalTarget("");
    setCreateGoalOpen(false);
  }

  function submitAllocate(goalId: SavingsGoalId, max: number) {
    const amount = parsePositiveAmount(allocateDrafts[goalId] ?? "");
    if (amount === null || amount > max) return;
    onAllocateToGoal(goalId, amount);
    setAllocateDrafts((d) => ({ ...d, [goalId]: "" }));
    setOpenGoalId(null);
  }

  return (
    <>
      <section aria-label="Goals and growth" className="space-y-3 border-t border-[#BDE9FB]/40 pt-4">
        <div className="flex items-stretch gap-3">
          <button
            type="button"
            onClick={() => { setSaveJarOpen((o) => !o); setOpenGoalId(null); }}
            className={cn("flex flex-1 flex-col items-center rounded-xl px-2 py-2", saveJarOpen && "bg-[#DCFCE7]/50")}
          >
            <ProgressRing progress={Math.min(100, totalSavings > 0 ? 40 : 0)} color="#22C55E" trackColor="#DCFCE7" size={44} stroke={4}>
              <span className="text-sm">🐷</span>
            </ProgressRing>
            <p className="mt-1 font-heading text-[9px] font-bold uppercase text-[#15803D]">Total Saved</p>
            <p className="font-heading text-sm font-extrabold text-[#031F82]">{formatMoney(totalSavings)}</p>
          </button>

          <button
            type="button"
            onClick={onToggleCalculator}
            aria-expanded={calculatorOpen}
            className={cn("flex flex-1 flex-col items-center rounded-xl px-2 py-2", calculatorOpen && "bg-[#E0F7FE]/60")}
          >
            <ProgressRing
              progress={futureSavingsPotential > 0 && totalSavings > 0 ? Math.min(100, (totalSavings / futureSavingsPotential) * 100) : 0}
              color="#0CC1E0"
              trackColor="#E0F7FE"
              size={44}
              stroke={4}
            >
              <span className="text-sm">📈</span>
            </ProgressRing>
            <p className="mt-1 font-heading text-[9px] font-bold uppercase text-[#0CC1E0]">Future Potential</p>
            <p className="font-heading text-sm font-extrabold text-[#031F82]">{formatMoney(futureSavingsPotential)}</p>
            <p className="font-sans text-[9px] text-[#1E3A5F]/70">{calculatorOpen ? "Hide forecast" : futureSubtext}</p>
          </button>
        </div>

        {saveJarOpen ? (
          <InlineAmountActions
            label={`Save Jar · ${formatMoney(saveJarBalance)}`}
            maxAmount={saveJarBalance}
            showReturn
            returnLabel={copy.returnToAllocate}
            onSpend={onSpendFromSaveJar}
            onReturn={onWithdrawSaveJarToPool}
            onClose={() => setSaveJarOpen(false)}
          />
        ) : null}

        {calculatorOpen ? calculatorPanel : null}

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <p className="font-heading text-xs font-extrabold text-[#031F82]">Goals</p>
            <button
              type="button"
              onClick={() => (isPremium ? setCreateGoalOpen((o) => !o) : setPremiumGoalsOpen(true))}
              className={linkClass}
            >
              + {copy.addGoal}
            </button>
          </div>

          {createGoalOpen && isPremium ? (
            <form onSubmit={handleCreateGoal} className="space-y-2 rounded-lg border border-[#BDE9FB]/60 bg-[#F7FBFF]/50 p-2.5">
              <input value={newGoalName} onChange={(e) => setNewGoalName(e.target.value)} placeholder={copy.goalNameLabel} className="w-full rounded-lg border border-[#BDE9FB] px-2 py-1.5 text-sm outline-none" />
              <div className="flex gap-2">
                <span className="py-1.5 font-bold text-[#031F82]">{currencySymbol}</span>
                <input type="number" min={0} step={ALLOCATION_STEP} value={newGoalTarget} onChange={(e) => setNewGoalTarget(e.target.value)} placeholder={copy.goalTargetLabel} className="min-w-0 flex-1 rounded-lg border border-[#BDE9FB] px-2 py-1.5 text-sm outline-none" />
                <button type="submit" className={cn("shrink-0 px-3", orangeCtaClass)}>{copy.createGoal}</button>
              </div>
            </form>
          ) : null}

          {!isPremium ? (
            <button
              type="button"
              onClick={() => setOpenGoalId((id) => (id ? null : defaultGoal.id))}
              className="flex w-full items-center gap-2 rounded-lg py-1 text-left"
            >
              <ProgressRing progress={defaultProgress} color="#DCB766" trackColor="#FEF3C7" size={32} stroke={3}>
                <span className="text-xs">{defaultGoal.emoji}</span>
              </ProgressRing>
              <div className="min-w-0 flex-1">
                <p className="font-heading text-xs font-bold text-[#031F82]">{defaultGoal.name}</p>
                <p className="font-sans text-[10px] text-[#1E3A5F]">
                  {formatMoney(defaultGoal.balance)} / {formatMoney(defaultGoal.targetAmount)}
                </p>
              </div>
              <span className="font-heading text-[10px] font-bold text-[#DCB766]">{Math.round(defaultProgress)}%</span>
            </button>
          ) : goals.length === 0 ? (
            <p className="font-sans text-[11px] text-[#1E3A5F]/70">No goals yet.</p>
          ) : (
            goals.map((goal) => {
              const progress = savingsGoalProgress(goal);
              const isOpen = openGoalId === goal.id;
              const maxAlloc = Math.max(0, Math.min(saveJarBalance, goal.targetAmount - goal.balance));
              return (
                <div key={goal.id}>
                  <button
                    type="button"
                    onClick={() => setOpenGoalId(isOpen ? null : goal.id)}
                    className={cn("flex w-full items-center gap-2 rounded-lg py-1 text-left", isOpen && "bg-[#FEF3C7]/40 px-1")}
                  >
                    <ProgressRing progress={progress} color="#DCB766" trackColor="#FEF3C7" size={32} stroke={3}>
                      <span className="text-xs">{goal.emoji}</span>
                    </ProgressRing>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-heading text-xs font-bold text-[#031F82]">{goal.name}</p>
                      <p className="font-sans text-[10px] text-[#1E3A5F]">
                        {formatMoney(goal.balance)} / {formatMoney(goal.targetAmount)}
                      </p>
                    </div>
                    <span className="font-heading text-[10px] font-bold text-[#DCB766]">{Math.round(progress)}%</span>
                  </button>
                  {isOpen ? (
                    <div className="ml-10 space-y-2 pb-2">
                      {maxAlloc > 0 ? (
                        <div className="flex gap-1.5">
                          <input
                            type="number"
                            min={0}
                            step={ALLOCATION_STEP}
                            value={allocateDrafts[goal.id] ?? ""}
                            onChange={(e) => setAllocateDrafts((d) => ({ ...d, [goal.id]: e.target.value }))}
                            placeholder="From Save Jar"
                            className="min-w-0 flex-1 rounded-lg border border-[#BDE9FB] px-2 py-1 text-sm outline-none"
                          />
                          <button type="button" onClick={() => submitAllocate(goal.id, maxAlloc)} className={tealBtnClass}>{copy.allocateFromSave}</button>
                        </div>
                      ) : null}
                      {goal.balance > 0 ? (
                        <InlineAmountActions
                          label={goal.name}
                          maxAmount={goal.balance}
                          showReturn
                          returnLabel={copy.returnToSaveJar}
                          onSpend={(a) => onSpendFromGoal(goal.id, a)}
                          onReturn={(a) => onReturnGoalToSaveJar(goal.id, a)}
                          onClose={() => setOpenGoalId(null)}
                        />
                      ) : null}
                    </div>
                  ) : null}
                </div>
              );
            })
          )}
        </div>

        {!isPremium ? (
          <p className="font-sans text-[10px] text-[#1E3A5F]/60">{copy.defaultGoalHint}</p>
        ) : null}
      </section>

      <PremiumGoalsModal isOpen={premiumGoalsOpen} onClose={() => setPremiumGoalsOpen(false)} />
    </>
  );
}
