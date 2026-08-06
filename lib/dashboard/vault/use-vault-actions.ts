"use client";

import { useCallback, useMemo } from "react";
import { copyMatrix } from "@/constants/copyMatrix";
import { useCurrency } from "@/lib/dashboard/currency-context";
import {
  roundAudAmount,
  SAVINGS_JAR_ID,
  type DestinationJar,
} from "@/lib/dashboard/destination-jars";
import {
  DEFAULT_SPENDING_CATEGORY_IDS,
  defaultCustomSpendingCategory,
  resolveSpendingCategories,
  type DefaultSpendingCategoryId,
  type SpendingCategoryId,
} from "@/lib/dashboard/spending-categories";
import {
  canAddCustomSavingsGoal,
  canDeleteSavingsGoal,
  computeTotalSavings,
  defaultSavingsGoal,
  findGoalsJustHitTarget,
  isCustomSavingsGoal,
  resolveVaultSavingsGoals,
  type SavingsGoal,
  type SavingsGoalId,
} from "@/lib/dashboard/savings-goals";
import { useMasteryCohort } from "@/lib/dashboard/use-user-session";
import {
  getVaultIncomeSourceLabel,
  type VaultIncomeSourceId,
} from "@/lib/dashboard/vault-income-sources";
import {
  computeVaultTransferState,
  resolveVaultTransferLocationLabel,
  type VaultTransferLocationId,
} from "@/lib/dashboard/vault-transfer";
import {
  canAddVaultBucket,
  defaultCustomBucket,
  isCustomBucketId,
  isSavingsGoalMoveTarget,
  sumAllocations,
  type CustomVaultBucketPersisted,
  type VaultBucketId,
} from "@/lib/dashboard/vault-buckets";
import { useVaultProfile } from "@/lib/dashboard/vault/vault-profile-context";

/** Premium billing is not wired yet — Vault defaults to freemium limits. */
const VAULT_IS_PREMIUM = false;

function defaultSpendingCategoryLabels(): Record<DefaultSpendingCategoryId, string> {
  const labels = copyMatrix.dashboard.vault.budget.defaultCategories;
  return {
    "food-snacks": labels.foodSnacks,
    "fun-entertainment": labels.funEntertainment,
    "personal-items": labels.personalItems,
    gifts: labels.gifts,
    other: labels.other,
  };
}

function isDefaultSpendingCategoryId(id: SpendingCategoryId): id is DefaultSpendingCategoryId {
  return (DEFAULT_SPENDING_CATEGORY_IDS as readonly string[]).includes(id);
}

function adjustBucketBalance(
  bucketId: VaultBucketId,
  delta: number,
  setJars: (
    updater: DestinationJar[] | ((current: DestinationJar[]) => DestinationJar[]),
  ) => void,
  setCustomBuckets: (
    updater:
      | CustomVaultBucketPersisted[]
      | ((current: CustomVaultBucketPersisted[]) => CustomVaultBucketPersisted[]),
  ) => void,
) {
  if (isCustomBucketId(bucketId)) {
    setCustomBuckets((current) =>
      current.map((bucket) =>
        bucket.id === bucketId
          ? { ...bucket, balance: roundAudAmount(bucket.balance + delta) }
          : bucket,
      ),
    );
    return;
  }

  setJars((current) =>
    current.map((jar) =>
      jar.id === bucketId
        ? { ...jar, balance: roundAudAmount(jar.balance + delta) }
        : jar,
    ),
  );
}

export function useVaultActions() {
  const vaultCopy = copyMatrix.dashboard.vault;
  const budgetCopy = vaultCopy.budget;
  const { formatWholeMoney: formatMoney } = useCurrency();
  const masteryCohort = useMasteryCohort();
  const {
    appendLedger,
    moneyToAllocate,
    setMoneyToAllocate,
    jars,
    setJars,
    customBuckets,
    setCustomBuckets,
    savingsGoals,
    setSavingsGoals,
    spendingCategoryOverrides,
    setSpendingCategoryOverrides,
    customSpendingCategories,
    setCustomSpendingCategories,
    vaultBuckets,
  } = useVaultProfile();

  const spendingCategories = useMemo(
    () =>
      resolveSpendingCategories(
        defaultSpendingCategoryLabels(),
        spendingCategoryOverrides,
        customSpendingCategories,
      ),
    [customSpendingCategories, spendingCategoryOverrides],
  );

  const vaultGoals = useMemo(
    () => resolveVaultSavingsGoals(savingsGoals, masteryCohort, VAULT_IS_PREMIUM),
    [masteryCohort, savingsGoals],
  );

  const saveJarBalance = useMemo(
    () => jars.find((jar) => jar.id === SAVINGS_JAR_ID)?.balance ?? 0,
    [jars],
  );

  const totalSavings = useMemo(
    () => computeTotalSavings(saveJarBalance, vaultGoals),
    [saveJarBalance, vaultGoals],
  );

  const celebrateGoalsJustHit = useCallback(
    (beforeGoals: readonly SavingsGoal[], afterGoals: readonly SavingsGoal[]) => {
      const hitGoals = findGoalsJustHitTarget(beforeGoals, afterGoals);
      if (hitGoals.length === 0) return;

      for (const goal of hitGoals) {
        appendLedger(
          vaultCopy.savings.goalHitTargetLogTemplate.replace("{goal}", goal.name),
          { category: "milestone", highlight: true },
        );
      }
    },
    [appendLedger, vaultCopy.savings.goalHitTargetLogTemplate],
  );

  const handleDeposit = useCallback(
    (amount: number, source: VaultIncomeSourceId) => {
      setMoneyToAllocate((current) => roundAudAmount(current + amount));
      appendLedger(
        budgetCopy.depositLogTemplate
          .replace("{amount}", formatMoney(amount))
          .replace("{source}", getVaultIncomeSourceLabel(source)),
        { category: "deposit", amount, flow: "in" },
      );
    },
    [appendLedger, budgetCopy.depositLogTemplate, formatMoney, setMoneyToAllocate],
  );

  const handleLockIn = useCallback(
    (allocations: Record<string, number>) => {
      const total = sumAllocations(allocations);
      if (total <= 0 || total > moneyToAllocate + 0.001) return;

      setMoneyToAllocate((current) => roundAudAmount(current - total));

      for (const [bucketId, amount] of Object.entries(allocations)) {
        if (amount <= 0) continue;
        adjustBucketBalance(
          bucketId as VaultBucketId,
          amount,
          setJars,
          setCustomBuckets,
        );
      }

      appendLedger(
        budgetCopy.lockedInTemplate.replace("{amount}", formatMoney(total)),
        { category: "allocation", amount: total },
      );
    },
    [
      appendLedger,
      budgetCopy.lockedInTemplate,
      formatMoney,
      moneyToAllocate,
      setCustomBuckets,
      setJars,
      setMoneyToAllocate,
    ],
  );

  const handleVaultTransfer = useCallback(
    (from: VaultTransferLocationId, to: VaultTransferLocationId, amount: number) => {
      const beforeGoals = savingsGoals;
      const nextState = computeVaultTransferState(from, to, amount, {
        moneyToAllocate,
        jars,
        customBuckets,
        savingsGoals,
        vaultBuckets,
      });
      if (!nextState) return;

      setMoneyToAllocate(nextState.moneyToAllocate);
      setJars(nextState.jars);
      setCustomBuckets(nextState.customBuckets);
      setSavingsGoals(nextState.savingsGoals);

      if (isSavingsGoalMoveTarget(from) || isSavingsGoalMoveTarget(to)) {
        celebrateGoalsJustHit(beforeGoals, nextState.savingsGoals);
      }

      const fromName = resolveVaultTransferLocationLabel(
        from,
        vaultBuckets,
        beforeGoals,
        budgetCopy.poolLabel,
      );
      const toName = resolveVaultTransferLocationLabel(
        to,
        vaultBuckets,
        nextState.savingsGoals,
        budgetCopy.poolLabel,
      );
      appendLedger(
        vaultCopy.savings.vaultTransferLogTemplate
          .replace("{amount}", formatMoney(amount))
          .replace("{from}", fromName)
          .replace("{to}", toName),
        { category: "transfer", amount },
      );
    },
    [
      appendLedger,
      budgetCopy.poolLabel,
      celebrateGoalsJustHit,
      customBuckets,
      formatMoney,
      jars,
      moneyToAllocate,
      savingsGoals,
      setCustomBuckets,
      setJars,
      setMoneyToAllocate,
      setSavingsGoals,
      vaultBuckets,
      vaultCopy.savings.vaultTransferLogTemplate,
    ],
  );

  const handleMarkSpent = useCallback(
    (bucketId: VaultBucketId, amount: number, categoryLabel: string) => {
      if (amount <= 0) return;

      const bucket = vaultBuckets.find((entry) => entry.id === bucketId);
      if (!bucket || amount > bucket.balance) return;

      adjustBucketBalance(bucketId, -amount, setJars, setCustomBuckets);
      appendLedger(
        budgetCopy.spentLogTemplate
          .replace("{amount}", formatMoney(amount))
          .replace("{category}", categoryLabel)
          .replace("{bucket}", bucket.name),
        { category: "spend", amount, flow: "out", highlight: true },
      );
    },
    [
      appendLedger,
      budgetCopy.spentLogTemplate,
      formatMoney,
      setCustomBuckets,
      setJars,
      vaultBuckets,
    ],
  );

  const handleAddCustomSpendingCategory = useCallback(
    (label: string) => {
      const trimmed = label.trim();
      if (!trimmed) return;
      setCustomSpendingCategories((current) => [
        ...current,
        defaultCustomSpendingCategory(trimmed),
      ]);
    },
    [setCustomSpendingCategories],
  );

  const handleRenameSpendingCategory = useCallback(
    (categoryId: SpendingCategoryId, label: string) => {
      const trimmed = label.trim();
      if (!trimmed) return;

      if (isDefaultSpendingCategoryId(categoryId)) {
        setSpendingCategoryOverrides((current) => ({
          ...current,
          [categoryId]: trimmed,
        }));
        return;
      }

      setCustomSpendingCategories((current) =>
        current.map((entry) =>
          entry.id === categoryId ? { ...entry, label: trimmed } : entry,
        ),
      );
    },
    [setCustomSpendingCategories, setSpendingCategoryOverrides],
  );

  const handleAssignGoals = useCallback(
    (allocations: Record<string, number>) => {
      const appliedByGoal = new Map<SavingsGoalId, number>();
      let appliedTotal = 0;

      for (const [goalId, rawAmount] of Object.entries(allocations)) {
        const amount = rawAmount ?? 0;
        if (amount <= 0) continue;
        const applied = roundAudAmount(amount);
        appliedByGoal.set(goalId as SavingsGoalId, applied);
        appliedTotal = roundAudAmount(appliedTotal + applied);
      }

      if (appliedTotal <= 0 || appliedTotal > saveJarBalance + 0.001) return;

      const beforeGoals = savingsGoals;
      const nextGoals = beforeGoals.map((entry) => {
        const applied = appliedByGoal.get(entry.id) ?? 0;
        if (applied <= 0) return entry;
        return { ...entry, balance: roundAudAmount(entry.balance + applied) };
      });

      adjustBucketBalance(SAVINGS_JAR_ID, -appliedTotal, setJars, setCustomBuckets);
      setSavingsGoals(nextGoals);
      celebrateGoalsJustHit(beforeGoals, nextGoals);

      for (const [goalId, applied] of appliedByGoal) {
        const goal = savingsGoals.find((entry) => entry.id === goalId);
        if (!goal) continue;
        appendLedger(
          vaultCopy.savings.allocatedToGoalTemplate
            .replace("{amount}", formatMoney(applied))
            .replace("{goal}", goal.name),
          { category: "savings_goal", amount: applied },
        );
      }
    },
    [
      appendLedger,
      celebrateGoalsJustHit,
      formatMoney,
      saveJarBalance,
      savingsGoals,
      setCustomBuckets,
      setJars,
      setSavingsGoals,
      vaultCopy.savings.allocatedToGoalTemplate,
    ],
  );

  const handleRenameBucket = useCallback(
    (bucketId: VaultBucketId, name: string, emoji?: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;

      if (isCustomBucketId(bucketId)) {
        setCustomBuckets((current) =>
          current.map((bucket) =>
            bucket.id === bucketId
              ? {
                  ...bucket,
                  name: trimmed,
                  ...(emoji !== undefined ? { emoji } : {}),
                }
              : bucket,
          ),
        );
        return;
      }

      setJars((current) =>
        current.map((jar) =>
          jar.id === bucketId
            ? {
                ...jar,
                name: trimmed,
                ...(emoji !== undefined ? { emoji } : {}),
              }
            : jar,
        ),
      );
    },
    [setCustomBuckets, setJars],
  );

  const handleAddCustomBucket = useCallback(
    (name: string, emoji: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      if (!canAddVaultBucket(vaultBuckets.length, VAULT_IS_PREMIUM)) return;

      setCustomBuckets((current) => [
        ...current,
        defaultCustomBucket(trimmed, emoji.trim() || "💰"),
      ]);
    },
    [setCustomBuckets, vaultBuckets.length],
  );

  const handleDeleteCustomBucket = useCallback(
    (bucketId: VaultBucketId, fallbackBucketId?: VaultBucketId) => {
      if (!isCustomBucketId(bucketId)) return;

      const bucket = vaultBuckets.find((entry) => entry.id === bucketId);
      if (!bucket) return;

      if (bucket.balance > 0) {
        if (!fallbackBucketId || fallbackBucketId === bucketId) return;
        const amount = bucket.balance;
        adjustBucketBalance(
          fallbackBucketId,
          amount,
          setJars,
          setCustomBuckets,
        );
        adjustBucketBalance(bucketId, -amount, setJars, setCustomBuckets);
      }

      setCustomBuckets((current) => current.filter((entry) => entry.id !== bucketId));
      appendLedger(`Removed bucket: ${bucket.name}`, { category: "setup" });
    },
    [appendLedger, setCustomBuckets, setJars, vaultBuckets],
  );

  const handleUpdateGoalTarget = useCallback(
    (goalId: SavingsGoalId, targetAmount: number) => {
      setSavingsGoals((current) =>
        current.map((goal) =>
          goal.id === goalId
            ? { ...goal, targetAmount: roundAudAmount(Math.max(0, targetAmount)) }
            : goal,
        ),
      );
      const goal = savingsGoals.find((entry) => entry.id === goalId);
      if (!goal) return;
      appendLedger(
        copyMatrix.dashboard.vault.savings.goalTargetUpdatedTemplate
          .replace("{goal}", goal.name)
          .replace(
            "{amount}",
            targetAmount > 0
              ? formatMoney(targetAmount)
              : copyMatrix.dashboard.vault.savings.goalTargetUnset,
          ),
        { category: "setup" },
      );
    },
    [appendLedger, formatMoney, savingsGoals, setSavingsGoals],
  );

  const handleUpdateGoalDetails = useCallback(
    (
      goalId: SavingsGoalId,
      updates: { name?: string; emoji?: string; targetAmount?: number },
    ) => {
      const trimmedName = updates.name?.trim();
      setSavingsGoals((current) => {
        const existing = current.find((goal) => goal.id === goalId);
        const baseline =
          existing ??
          resolveVaultSavingsGoals(current, masteryCohort, VAULT_IS_PREMIUM).find(
            (goal) => goal.id === goalId,
          );
        if (!baseline) return current;

        const nextGoal: SavingsGoal = {
          ...baseline,
          ...(trimmedName ? { name: trimmedName } : {}),
          ...(updates.emoji !== undefined
            ? { emoji: updates.emoji.trim() || baseline.emoji }
            : {}),
          ...(updates.targetAmount !== undefined
            ? { targetAmount: roundAudAmount(Math.max(0, updates.targetAmount)) }
            : {}),
        };

        if (!existing) return [...current, nextGoal];
        return current.map((goal) => (goal.id === goalId ? nextGoal : goal));
      });
    },
    [masteryCohort, setSavingsGoals],
  );

  const handleAddGoal = useCallback(
    (name: string, targetAmount: number, emoji: string) => {
      if (!canAddCustomSavingsGoal(VAULT_IS_PREMIUM)) return;
      const trimmed = name.trim();
      if (!trimmed) return;
      setSavingsGoals((current) => [
        ...current,
        defaultSavingsGoal(trimmed, targetAmount, emoji.trim() || "🎯"),
      ]);
      appendLedger(`Added savings goal: ${trimmed}`, { category: "setup" });
    },
    [appendLedger, setSavingsGoals],
  );

  const handleDeleteGoal = useCallback(
    (goalId: SavingsGoalId) => {
      if (!canDeleteSavingsGoal(goalId)) return;
      const goal = savingsGoals.find((entry) => entry.id === goalId);
      if (!goal) return;
      setSavingsGoals((current) => current.filter((entry) => entry.id !== goalId));
      appendLedger(`Removed savings goal: ${goal.name}`, { category: "setup" });
    },
    [appendLedger, savingsGoals, setSavingsGoals],
  );

  const handleResetGoalBalance = useCallback(
    (goalId: SavingsGoalId) => {
      setSavingsGoals((current) =>
        current.map((goal) =>
          goal.id === goalId ? { ...goal, balance: 0 } : goal,
        ),
      );
      const goal = savingsGoals.find((entry) => entry.id === goalId);
      if (goal) {
        appendLedger(`Reset ${goal.name} balance to $0`, { category: "setup" });
      }
    },
    [appendLedger, savingsGoals, setSavingsGoals],
  );

  const handleResetBucketBalance = useCallback(
    (bucketId: VaultBucketId) => {
      const bucket = vaultBuckets.find((entry) => entry.id === bucketId);
      if (!bucket || bucket.balance <= 0) return;
      adjustBucketBalance(bucketId, -bucket.balance, setJars, setCustomBuckets);
      appendLedger(`Reset ${bucket.name} balance to $0`, { category: "setup" });
    },
    [appendLedger, setCustomBuckets, setJars, vaultBuckets],
  );

  const handleResetAllBalances = useCallback(() => {
    setMoneyToAllocate(0);
    setJars((current) =>
      current.map((jar) => ({ ...jar, balance: 0 })),
    );
    setCustomBuckets((current) =>
      current.map((bucket) => ({ ...bucket, balance: 0 })),
    );
    setSavingsGoals((current) =>
      current.map((goal) => ({ ...goal, balance: 0 })),
    );
    appendLedger("Reset all vault balances to $0", { category: "setup", highlight: true });
  }, [appendLedger, setCustomBuckets, setJars, setMoneyToAllocate, setSavingsGoals]);

  return {
    isPremium: VAULT_IS_PREMIUM,
    moneyToAllocate,
    vaultBuckets,
    vaultGoals,
    totalSavings,
    spendingCategories,
    handleDeposit,
    handleLockIn,
    handleVaultTransfer,
    handleMarkSpent,
    handleAddCustomSpendingCategory,
    handleRenameSpendingCategory,
    handleAssignGoals,
    handleRenameBucket,
    handleAddCustomBucket,
    handleDeleteCustomBucket,
    handleUpdateGoalTarget,
    handleUpdateGoalDetails,
    handleAddGoal,
    handleDeleteGoal,
    handleResetGoalBalance,
    handleResetBucketBalance,
    handleResetAllBalances,
  };
}

export type VaultActions = ReturnType<typeof useVaultActions>;
