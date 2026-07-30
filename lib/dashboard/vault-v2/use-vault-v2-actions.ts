"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { copyMatrix } from "@/constants/copyMatrix";
import { useCurrency } from "@/lib/dashboard/currency-context";
import { useDashboardWallet } from "@/lib/dashboard/dashboard-wallet-context";
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
  computeTotalSavings,
  findGoalsJustHitTarget,
  resolveVaultSavingsGoals,
  type SavingsGoal,
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
  isCustomBucketId,
  isSavingsGoalMoveTarget,
  sumAllocations,
  type CustomVaultBucketPersisted,
  type VaultBucketId,
} from "@/lib/dashboard/vault-buckets";
import {
  type LedgerCategory,
  type LedgerEntry,
  type LedgerFlow,
} from "@/lib/dashboard/vault-ledger";

/** Premium billing is not wired yet — Vault V2 defaults to freemium limits. */
const VAULT_V2_IS_PREMIUM = false;

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

function createLedgerId(): string {
  return `ledger-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
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

export function useVaultV2Actions() {
  const vaultCopy = copyMatrix.dashboard.vault;
  const budgetCopy = vaultCopy.budget;
  const ledgerCopy = vaultCopy.ledger;
  const { formatMoney } = useCurrency();
  const masteryCohort = useMasteryCohort();
  const {
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
  } = useDashboardWallet();

  const ledgerCounter = useRef(0);
  const [ledger, setLedger] = useState<LedgerEntry[]>([
    {
      id: "ledger-welcome",
      message: ledgerCopy.welcomeMessage,
      category: "info",
      timestamp: Date.now(),
    },
  ]);

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
    () => resolveVaultSavingsGoals(savingsGoals, masteryCohort, VAULT_V2_IS_PREMIUM),
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

  const appendLedger = useCallback(
    (
      message: string,
      options: {
        category: LedgerCategory;
        highlight?: boolean;
        amount?: number;
        flow?: LedgerFlow;
      },
    ) => {
      ledgerCounter.current += 1;
      setLedger((current) => [
        {
          id: `ledger-${ledgerCounter.current}-${createLedgerId()}`,
          message,
          category: options.category,
          highlight: options.highlight,
          timestamp: Date.now(),
          amount: options.amount,
          flow: options.flow,
        },
        ...current,
      ]);
    },
    [],
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

  return {
    isPremium: VAULT_V2_IS_PREMIUM,
    ledger,
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
  };
}

export type VaultV2Actions = ReturnType<typeof useVaultV2Actions>;
