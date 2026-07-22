"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  defaultDashboardWalletState,
  readDashboardWalletState,
  saveDashboardWalletState,
} from "@/lib/dashboard/dashboard-wallet-storage";
import {
  balanceMapFromJars,
  jarsFromBalanceMap,
  roundAudAmount,
  SAVINGS_JAR_ID,
  type DestinationJar,
} from "@/lib/dashboard/destination-jars";
import type { CustomVaultBucketPersisted } from "@/lib/dashboard/vault-buckets";
import { mergeVaultBuckets } from "@/lib/dashboard/vault-buckets";
import type { SavingsGoal } from "@/lib/dashboard/savings-goals";
import {
  audPerXpBlockFromSliderIndex,
  convertPointsToAud,
} from "@/lib/dashboard/point-conversion";

type ClaimPointsResult =
  | { success: true; audAmount: number; pointsClaimed: number }
  | { success: false; error: string };

type DashboardWalletContextValue = {
  totalPoints: number;
  /** Cumulative XP earned - separate from spendable balance after cash-outs. */
  lifetimePointsEarned: number;
  audSliderIndex: number;
  audPer100Xp: number;
  moneyToAllocate: number;
  jars: DestinationJar[];
  customBuckets: CustomVaultBucketPersisted[];
  savingsGoals: SavingsGoal[];
  vaultBuckets: ReturnType<typeof mergeVaultBuckets>;
  setAudSliderIndex: (index: number) => void;
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
  claimPointsForVault: (points: number) => ClaimPointsResult;
  awardLessonXp: (points: number) => void;
};

const DashboardWalletContext = createContext<DashboardWalletContextValue | null>(
  null,
);

type DashboardWalletProviderProps = {
  children: ReactNode;
};

export function DashboardWalletProvider({ children }: DashboardWalletProviderProps) {
  const defaults = defaultDashboardWalletState();

  const [totalPoints, setTotalPoints] = useState<number>(() => defaults.totalPoints);
  const [lifetimePointsEarned, setLifetimePointsEarned] = useState<number>(
    () => defaults.lifetimePointsEarned,
  );
  const [audSliderIndex, setAudSliderIndex] = useState(() => defaults.audSliderIndex);
  const [moneyToAllocate, setMoneyToAllocateState] = useState(
    () => defaults.moneyToAllocate,
  );
  const [jars, setJarsState] = useState<DestinationJar[]>(() =>
    jarsFromBalanceMap(defaults.jarBalances),
  );
  const [customBuckets, setCustomBucketsState] = useState<CustomVaultBucketPersisted[]>(
    () => defaults.customBuckets ?? [],
  );
  const [savingsGoals, setSavingsGoalsState] = useState<SavingsGoal[]>(
    () => defaults.savingsGoals ?? [],
  );
  const [walletHydrated, setWalletHydrated] = useState(false);

  useEffect(() => {
    const persisted = readDashboardWalletState();
    if (persisted) {
      setTotalPoints(persisted.totalPoints);
      setLifetimePointsEarned(persisted.lifetimePointsEarned);
      setAudSliderIndex(persisted.audSliderIndex);
      setMoneyToAllocateState(persisted.moneyToAllocate);
      setJarsState(jarsFromBalanceMap(persisted.jarBalances));
      setCustomBucketsState(persisted.customBuckets ?? []);
      setSavingsGoalsState(persisted.savingsGoals ?? []);
    }
    setWalletHydrated(true);
  }, []);

  useEffect(() => {
    if (!walletHydrated) return;

    saveDashboardWalletState({
      totalPoints,
      lifetimePointsEarned,
      audSliderIndex,
      moneyToAllocate,
      jarBalances: balanceMapFromJars(jars),
      customBuckets,
      savingsGoals,
    });
  }, [
    audSliderIndex,
    customBuckets,
    jars,
    lifetimePointsEarned,
    moneyToAllocate,
    savingsGoals,
    totalPoints,
    walletHydrated,
  ]);

  const audPer100Xp = useMemo(
    () => audPerXpBlockFromSliderIndex(audSliderIndex),
    [audSliderIndex],
  );

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
      setJarsState((current) =>
        typeof updater === "function" ? updater(current) : updater,
      );
    },
    [],
  );

  const claimPointsForVault = useCallback(
    (points: number): ClaimPointsResult => {
      const safePoints = Math.floor(points);
      if (!Number.isFinite(safePoints) || safePoints <= 0) {
        return { success: false, error: "Enter a valid points amount to claim." };
      }

      if (safePoints > totalPoints) {
        return {
          success: false,
          error: "You cannot claim more points than your current balance.",
        };
      }

      const audAmount = convertPointsToAud(safePoints, audPer100Xp);
      setTotalPoints((current) => current - safePoints);
      setJarsState((current) =>
        current.map((jar) =>
          jar.id === SAVINGS_JAR_ID
            ? {
                ...jar,
                balance: roundAudAmount(jar.balance + audAmount),
              }
            : jar,
        ),
      );

      return { success: true, audAmount, pointsClaimed: safePoints };
    },
    [audPer100Xp, totalPoints],
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

  const vaultBuckets = useMemo(
    () => mergeVaultBuckets(jars, customBuckets),
    [customBuckets, jars],
  );

  const awardLessonXp = useCallback((points: number) => {
    const safePoints = Math.floor(points);
    if (!Number.isFinite(safePoints) || safePoints <= 0) return;

    setTotalPoints((current) => current + safePoints);
    setLifetimePointsEarned((current) => current + safePoints);
  }, []);

  const value = useMemo(
    () => ({
      totalPoints,
      lifetimePointsEarned,
      audSliderIndex,
      audPer100Xp,
      moneyToAllocate,
      jars,
      customBuckets,
      savingsGoals,
      vaultBuckets,
      setAudSliderIndex,
      setMoneyToAllocate,
      setJars,
      setCustomBuckets,
      setSavingsGoals,
      claimPointsForVault,
      awardLessonXp,
    }),
    [
      audPer100Xp,
      audSliderIndex,
      awardLessonXp,
      claimPointsForVault,
      customBuckets,
      jars,
      moneyToAllocate,
      savingsGoals,
      setCustomBuckets,
      setJars,
      setMoneyToAllocate,
      setSavingsGoals,
      lifetimePointsEarned,
      totalPoints,
      vaultBuckets,
    ],
  );

  return (
    <DashboardWalletContext.Provider value={value}>
      {children}
    </DashboardWalletContext.Provider>
  );
}

export function useDashboardWallet(): DashboardWalletContextValue {
  const context = useContext(DashboardWalletContext);
  if (!context) {
    throw new Error("useDashboardWallet must be used within DashboardWalletProvider");
  }
  return context;
}
