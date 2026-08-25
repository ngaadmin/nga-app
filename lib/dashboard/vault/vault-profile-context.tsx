"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { copyMatrix } from "@/constants/copyMatrix";
import {
  balanceMapFromJars,
  jarsFromBalanceMap,
  roundAudAmount,
  SAVINGS_JAR_ID,
  type DestinationJar,
} from "@/lib/dashboard/destination-jars";
import type { CustomVaultBucketPersisted } from "@/lib/dashboard/vault-buckets";
import { mergeVaultBuckets } from "@/lib/dashboard/vault-buckets";
import type {
  LedgerCategory,
  LedgerEntry,
  LedgerFlow,
} from "@/lib/dashboard/vault-ledger";
import type { SavingsGoal } from "@/lib/dashboard/savings-goals";
import type {
  CustomSpendingCategory,
  SpendingCategoryOverrides,
} from "@/lib/dashboard/spending-categories";
import {
  freshVaultProfileState,
  migrateVaultSessionToProfile,
  readVaultProfileState,
  saveVaultProfileState,
} from "@/lib/dashboard/vault/vault-profile-storage";
import { readUserSession } from "@/lib/onboarding/guest-session";
import { ACCOUNT_PROGRESS_RESTORED_EVENT } from "@/lib/dashboard/account-progress-dirty";
import { USER_SESSION_UPDATED_EVENT } from "@/lib/onboarding/user-session-events";

type AppendLedgerOptions = {
  category: LedgerCategory;
  highlight?: boolean;
  amount?: number;
  flow?: LedgerFlow;
};

type VaultProfileContextValue = {
  moneyToAllocate: number;
  jars: DestinationJar[];
  customBuckets: CustomVaultBucketPersisted[];
  savingsGoals: SavingsGoal[];
  spendingCategoryOverrides: SpendingCategoryOverrides;
  customSpendingCategories: CustomSpendingCategory[];
  vaultBuckets: ReturnType<typeof mergeVaultBuckets>;
  ledger: LedgerEntry[];
  setMoneyToAllocate: (updater: number | ((current: number) => number)) => void;
  setJars: (updater: DestinationJar[] | ((current: DestinationJar[]) => DestinationJar[])) => void;
  setCustomBuckets: (
    updater:
      | CustomVaultBucketPersisted[]
      | ((current: CustomVaultBucketPersisted[]) => CustomVaultBucketPersisted[]),
  ) => void;
  setSavingsGoals: (
    updater: SavingsGoal[] | ((current: SavingsGoal[]) => SavingsGoal[]),
  ) => void;
  setSpendingCategoryOverrides: (
    updater:
      | SpendingCategoryOverrides
      | ((current: SpendingCategoryOverrides) => SpendingCategoryOverrides),
  ) => void;
  setCustomSpendingCategories: (
    updater:
      | CustomSpendingCategory[]
      | ((current: CustomSpendingCategory[]) => CustomSpendingCategory[]),
  ) => void;
  appendLedger: (message: string, options: AppendLedgerOptions) => void;
  creditSaveJar: (amount: number) => void;
};

const VaultProfileContext = createContext<VaultProfileContextValue | null>(null);

function createLedgerId(): string {
  return `ledger-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function buildWelcomeLedgerEntry(): LedgerEntry {
  return {
    id: "ledger-welcome",
    message: copyMatrix.dashboard.vault.ledger.welcomeMessage,
    category: "info",
    timestamp: Date.now(),
  };
}

type VaultProfileProviderProps = {
  children: ReactNode;
};

export function VaultProfileProvider({ children }: VaultProfileProviderProps) {
  const defaults = freshVaultProfileState();
  const welcomeMessage = copyMatrix.dashboard.vault.ledger.welcomeMessage;

  const [moneyToAllocate, setMoneyToAllocateState] = useState(defaults.moneyToAllocate);
  const [jars, setJarsState] = useState<DestinationJar[]>(() =>
    jarsFromBalanceMap(defaults.jarBalances),
  );
  const [customBuckets, setCustomBucketsState] = useState<CustomVaultBucketPersisted[]>(
    defaults.customBuckets,
  );
  const [savingsGoals, setSavingsGoalsState] = useState<SavingsGoal[]>(defaults.savingsGoals);
  const [spendingCategoryOverrides, setSpendingCategoryOverridesState] =
    useState<SpendingCategoryOverrides>(defaults.spendingCategoryOverrides);
  const [customSpendingCategories, setCustomSpendingCategoriesState] = useState<
    CustomSpendingCategory[]
  >(defaults.customSpendingCategories);
  const [ledger, setLedger] = useState<LedgerEntry[]>(() =>
    defaults.ledger.length > 0 ? defaults.ledger : [buildWelcomeLedgerEntry()],
  );
  const [hydrated, setHydrated] = useState(false);
  const sessionRef = useRef(readUserSession());
  const ledgerCounter = useRef(0);

  const hydrateFromStorage = useCallback(() => {
    const session = readUserSession();
    sessionRef.current = session;
    const persisted = readVaultProfileState(session);

    setMoneyToAllocateState(persisted.moneyToAllocate);
    setJarsState(jarsFromBalanceMap(persisted.jarBalances));
    setCustomBucketsState(persisted.customBuckets);
    setSavingsGoalsState(persisted.savingsGoals);
    setSpendingCategoryOverridesState(persisted.spendingCategoryOverrides);
    setCustomSpendingCategoriesState(persisted.customSpendingCategories);
    setLedger(
      persisted.ledger.length > 0
        ? persisted.ledger
        : [{ ...buildWelcomeLedgerEntry(), message: welcomeMessage }],
    );
    setHydrated(true);
  }, [welcomeMessage]);

  useEffect(() => {
    hydrateFromStorage();
  }, [hydrateFromStorage]);

  useEffect(() => {
    function handleSessionUpdated() {
      const previous = sessionRef.current;
      const next = readUserSession();
      sessionRef.current = next;

      if (
        previous?.accessMode === "guest" &&
        next?.accessMode === "registered"
      ) {
        migrateVaultSessionToProfile();
      }

      hydrateFromStorage();
    }

    window.addEventListener(USER_SESSION_UPDATED_EVENT, handleSessionUpdated);
    window.addEventListener(ACCOUNT_PROGRESS_RESTORED_EVENT, hydrateFromStorage);
    return () => {
      window.removeEventListener(USER_SESSION_UPDATED_EVENT, handleSessionUpdated);
      window.removeEventListener(ACCOUNT_PROGRESS_RESTORED_EVENT, hydrateFromStorage);
    };
  }, [hydrateFromStorage]);

  const foundationJars = useMemo(
    () => jarsFromBalanceMap(balanceMapFromJars(jars)),
    [jars],
  );

  useEffect(() => {
    if (!hydrated) return;

    const nextState = {
      schemaVersion: 1 as const,
      moneyToAllocate,
      jarBalances: balanceMapFromJars(foundationJars),
      customBuckets,
      savingsGoals,
      spendingCategoryOverrides,
      customSpendingCategories,
      ledger,
    };
    saveVaultProfileState(nextState, sessionRef.current);
  }, [
    customBuckets,
    customSpendingCategories,
    hydrated,
    foundationJars,
    ledger,
    moneyToAllocate,
    savingsGoals,
    spendingCategoryOverrides,
  ]);

  const setMoneyToAllocate = useCallback(
    (updater: number | ((current: number) => number)) => {
      setMoneyToAllocateState((current) =>
        typeof updater === "function" ? updater(current) : updater,
      );
    },
    [],
  );

  const setJars = useCallback(
    (updater: DestinationJar[] | ((current: DestinationJar[]) => DestinationJar[])) => {
      setJarsState((current) => {
        const padded = jarsFromBalanceMap(balanceMapFromJars(current));
        const next = typeof updater === "function" ? updater(padded) : updater;
        return jarsFromBalanceMap(balanceMapFromJars(next));
      });
    },
    [],
  );

  const setCustomBuckets = useCallback(
    (
      updater:
        | CustomVaultBucketPersisted[]
        | ((current: CustomVaultBucketPersisted[]) => CustomVaultBucketPersisted[]),
    ) => {
      setCustomBucketsState((current) =>
        typeof updater === "function" ? updater(current) : updater,
      );
    },
    [],
  );

  const setSavingsGoals = useCallback(
    (updater: SavingsGoal[] | ((current: SavingsGoal[]) => SavingsGoal[])) => {
      setSavingsGoalsState((current) =>
        typeof updater === "function" ? updater(current) : updater,
      );
    },
    [],
  );

  const setSpendingCategoryOverrides = useCallback(
    (
      updater:
        | SpendingCategoryOverrides
        | ((current: SpendingCategoryOverrides) => SpendingCategoryOverrides),
    ) => {
      setSpendingCategoryOverridesState((current) =>
        typeof updater === "function" ? updater(current) : updater,
      );
    },
    [],
  );

  const setCustomSpendingCategories = useCallback(
    (
      updater:
        | CustomSpendingCategory[]
        | ((current: CustomSpendingCategory[]) => CustomSpendingCategory[]),
    ) => {
      setCustomSpendingCategoriesState((current) =>
        typeof updater === "function" ? updater(current) : updater,
      );
    },
    [],
  );

  const appendLedger = useCallback((message: string, options: AppendLedgerOptions) => {
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
  }, []);

  const creditSaveJar = useCallback(
    (amount: number) => {
      // Vault money is whole dollars only.
      const safeAmount = Math.round(Math.max(0, amount));
      if (safeAmount <= 0) return;

      setJarsState((current) => {
        const padded = jarsFromBalanceMap(balanceMapFromJars(current));
        return padded.map((jar) =>
          jar.id === SAVINGS_JAR_ID
            ? { ...jar, balance: Math.round(jar.balance + safeAmount) }
            : jar,
        );
      });
    },
    [],
  );

  const vaultBuckets = useMemo(
    () => mergeVaultBuckets(foundationJars, customBuckets),
    [customBuckets, foundationJars],
  );

  const value = useMemo(
    () => ({
      moneyToAllocate,
      jars: foundationJars,
      customBuckets,
      savingsGoals,
      spendingCategoryOverrides,
      customSpendingCategories,
      vaultBuckets,
      ledger,
      setMoneyToAllocate,
      setJars,
      setCustomBuckets,
      setSavingsGoals,
      setSpendingCategoryOverrides,
      setCustomSpendingCategories,
      appendLedger,
      creditSaveJar,
    }),
    [
      appendLedger,
      creditSaveJar,
      customBuckets,
      customSpendingCategories,
      foundationJars,
      ledger,
      moneyToAllocate,
      savingsGoals,
      setCustomBuckets,
      setCustomSpendingCategories,
      setJars,
      setMoneyToAllocate,
      setSavingsGoals,
      setSpendingCategoryOverrides,
      spendingCategoryOverrides,
      vaultBuckets,
    ],
  );

  return (
    <VaultProfileContext.Provider value={value}>
      {children}
    </VaultProfileContext.Provider>
  );
}

export function useVaultProfile(): VaultProfileContextValue {
  const context = useContext(VaultProfileContext);
  if (!context) {
    throw new Error("useVaultProfile must be used within VaultProfileProvider");
  }
  return context;
}

/** @deprecated Use useVaultProfile — kept for ledger call sites during cutover. */
export function useVaultLedger(): Pick<VaultProfileContextValue, "ledger" | "appendLedger"> {
  const { ledger, appendLedger } = useVaultProfile();
  return { ledger, appendLedger };
}
