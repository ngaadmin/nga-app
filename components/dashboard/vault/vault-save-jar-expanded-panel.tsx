"use client";

import { useEffect, useState, type FormEvent } from "react";
import { PremiumUpgradeModal } from "@/components/dashboard/premium-upgrade-modal";
import {
  BucketEmojiIcon,
  bucketTheme,
} from "@/components/dashboard/vault/vault-visuals";
import { VaultSavingsGoalDetailPanel } from "@/components/dashboard/vault/vault-savings-goal-detail-panel";
import { copyMatrix } from "@/constants/copyMatrix";
import { useCurrency } from "@/lib/dashboard/currency-context";
import { roundAudAmount } from "@/lib/dashboard/destination-jars";
import type { SavingsGoal, SavingsGoalId } from "@/lib/dashboard/savings-goals";
import type { VaultBucket } from "@/lib/dashboard/vault-buckets";
import { vaultBucketDisplayName } from "@/lib/dashboard/vault/bucket-display-name";
import { vaultCopy } from "@/lib/dashboard/vault/copy";
import type { VaultTransferLocationId } from "@/lib/dashboard/vault-transfer";
import { vaultHomeCompactCtaAutoClass } from "@/lib/dashboard/vault/vault-action-form-styles";
import {
  clampVaultAllocationEntry,
  parsePositiveVaultAmount,
  sanitizeVaultAmountInput,
} from "@/lib/dashboard/vault-amount-input";

export type VaultSaveJarExpandedPanelProps = {
  bucket: VaultBucket;
  buckets: VaultBucket[];
  goals: SavingsGoal[];
  totalSavings: number;
  onVaultTransfer: (
    from: VaultTransferLocationId,
    to: VaultTransferLocationId,
    amount: number,
  ) => void;
  onAssignGoals: (allocations: Record<string, number>) => void;
  onUpdateGoalDetails: (
    goalId: SavingsGoalId,
    updates: { name?: string; emoji?: string; targetAmount?: number },
  ) => void;
  onSpendFromGoal: (
    goalId: SavingsGoalId,
    amount: number,
    categoryLabel: string,
  ) => void;
  onClose: () => void;
};

export function VaultSaveJarExpandedPanel({
  bucket,
  buckets,
  goals,
  totalSavings,
  onVaultTransfer,
  onAssignGoals,
  onUpdateGoalDetails,
  onSpendFromGoal,
}: VaultSaveJarExpandedPanelProps) {
  const savingsCopy = copyMatrix.dashboard.vault.savings;
  const budgetCopy = copyMatrix.dashboard.vault.budget;
  const { currencySymbol, formatMoney } = useCurrency();
  const [selectedGoalId, setSelectedGoalId] = useState<SavingsGoalId | null>(null);
  const [putInput, setPutInput] = useState("");
  const [premiumGoalsOpen, setPremiumGoalsOpen] = useState(false);

  const displayName = vaultBucketDisplayName(bucket);
  const unassignedBalance = roundAudAmount(Math.max(0, bucket.balance));
  const allocateGoal = goals[0] ?? null;
  const canPutToward = unassignedBalance > 0 && allocateGoal !== null;

  const selectedGoal =
    selectedGoalId === null
      ? null
      : (goals.find((goal) => goal.id === selectedGoalId) ?? null);

  useEffect(() => {
    if (selectedGoalId !== null && selectedGoal === null) {
      setSelectedGoalId(null);
    }
  }, [selectedGoal, selectedGoalId]);

  function handlePutTowardGoal(event: FormEvent) {
    event.preventDefault();
    if (!allocateGoal) return;
    const parsed = parsePositiveVaultAmount(putInput);
    if (parsed === null) return;
    const capped = clampVaultAllocationEntry(unassignedBalance, 0, parsed);
    if (capped <= 0) return;
    onAssignGoals({ [allocateGoal.id]: capped });
    setPutInput("");
  }

  return (
    <>
      {selectedGoal ? (
        <VaultSavingsGoalDetailPanel
          goal={selectedGoal}
          unassignedBalance={unassignedBalance}
          buckets={buckets}
          goals={goals}
          backLabel={displayName}
          onBack={() => setSelectedGoalId(null)}
          onUpdateDetails={(updates) =>
            onUpdateGoalDetails(selectedGoal.id, updates)
          }
          onAssignToThisGoal={(amount) =>
            onAssignGoals({ [selectedGoal.id]: amount })
          }
          onSpendFromGoal={(amount, categoryLabel) =>
            onSpendFromGoal(selectedGoal.id, amount, categoryLabel)
          }
          onVaultTransfer={onVaultTransfer}
        />
      ) : (
      <div className="space-y-3">
        <div className="flex min-w-0 items-center gap-2">
          <BucketEmojiIcon
            size="sm"
            emoji={bucket.emoji}
            theme={bucketTheme(bucket)}
          />
          <p className="min-w-0 truncate font-heading text-lg font-extrabold text-[#031F82]">
            {displayName}
          </p>
        </div>

        <div>
          <p
            className="font-heading text-3xl font-extrabold leading-none tabular-nums text-[#031F82]"
            aria-label={`${displayName} ${formatMoney(totalSavings)}`}
          >
            {formatMoney(totalSavings)}
          </p>
          <p className="mt-1 font-heading text-xs font-bold leading-tight text-[#1E3A5F]/55">
            {vaultCopy.jarTotalCaptionTemplate.replace("{name}", displayName)}
          </p>
        </div>

        {canPutToward ? (
          <form onSubmit={handlePutTowardGoal} className="flex items-center gap-2">
            <p className="min-w-0 flex-1 font-heading text-sm font-extrabold tabular-nums text-[#031F82]">
              {formatMoney(unassignedBalance)} {savingsCopy.toPutTowardGoalsLabel}
            </p>
            <label className="flex h-8 w-[4.75rem] shrink-0 items-center gap-0.5 rounded-lg border border-[#BDE9FB] bg-white px-1.5">
              <span className="shrink-0 font-heading text-sm font-bold text-[#031F82]">
                {currencySymbol}
              </span>
              <input
                type="text"
                inputMode="numeric"
                value={putInput}
                onChange={(event) =>
                  setPutInput(sanitizeVaultAmountInput(event.target.value).value)
                }
                aria-label={`Amount to put toward ${allocateGoal.name}`}
                className="min-w-0 flex-1 bg-transparent text-right font-sans text-sm tabular-nums text-[#031F82] outline-none"
              />
            </label>
            <button type="submit" className={vaultHomeCompactCtaAutoClass}>
              {budgetCopy.allocatePoolCta}
            </button>
          </form>
        ) : null}

        {goals.length > 0 ? (
          <ul className="divide-y divide-[#BDE9FB]/30">
            {goals.map((goal) => (
              <li key={goal.id}>
                <button
                  type="button"
                  onClick={() => setSelectedGoalId(goal.id)}
                  className="flex w-full min-w-0 items-center justify-between gap-3 rounded-lg py-1.5 text-left transition-colors hover:bg-[#F0FBFF] active:bg-[#FAFDFF]"
                  aria-label={`Open ${goal.name}`}
                >
                  <div className="min-w-0">
                    <p className="min-w-0 truncate font-heading text-sm font-bold text-[#031F82]">
                      {goal.emoji} {goal.name}
                    </p>
                    <p className="font-heading text-xs font-bold leading-tight text-[#1E3A5F]/55">
                      {vaultCopy.tapToSpendOrMove}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <div className="text-right">
                      <p className="font-heading text-sm font-extrabold tabular-nums text-[#031F82]">
                        {formatMoney(goal.balance)}
                      </p>
                      {goal.targetAmount > 0 ? (
                        <p className="font-heading text-xs font-bold tabular-nums text-[#1E3A5F]/55">
                          {formatMoney(goal.targetAmount)}
                        </p>
                      ) : null}
                    </div>
                    <span
                      aria-hidden
                      className="font-heading text-2xl font-extrabold leading-none text-[#031F82]"
                    >
                      ›
                    </span>
                  </div>
                </button>
              </li>
            ))}
            <li>
              <button
                type="button"
                onClick={() => setPremiumGoalsOpen(true)}
                className="flex w-full min-w-0 items-center py-1.5 text-left font-heading text-sm font-bold text-[#0CC1E0]/90 hover:text-[#031F82] hover:underline"
              >
                + {savingsCopy.addAGoal}
              </button>
            </li>
          </ul>
        ) : (
          <p className="font-sans text-sm leading-snug text-[#1E3A5F]/70">
            {savingsCopy.noGoalsYet}
          </p>
        )}
      </div>
      )}

      <PremiumUpgradeModal
        isOpen={premiumGoalsOpen}
        onClose={() => setPremiumGoalsOpen(false)}
        titleId="vault-premium-goals-title"
        layer="toast"
      />
    </>
  );
}
