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
import { ACCOUNT_PROGRESS_RESTORED_EVENT } from "@/lib/dashboard/account-progress-dirty";
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
  /** Parent has saved an XP-to-money exchange rate. */
  xpExchangeRateSet: boolean;
  setAudSliderIndex: (index: number) => void;
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
  const [audSliderIndex, setAudSliderIndexState] = useState(
    () => defaults.audSliderIndex,
  );
  const [xpExchangeRateSet, setXpExchangeRateSet] = useState(
    () => defaults.xpExchangeRateSet,
  );
  const [walletHydrated, setWalletHydrated] = useState(false);

  useEffect(() => {
    function hydrateWallet() {
      const persisted = readDashboardWalletState();
      if (persisted) {
        setTotalPoints(persisted.totalPoints);
        setLifetimePointsEarned(persisted.lifetimePointsEarned);
        setAudSliderIndexState(persisted.audSliderIndex);
        setXpExchangeRateSet(persisted.xpExchangeRateSet);
      }
      setWalletHydrated(true);
    }

    hydrateWallet();
    window.addEventListener(ACCOUNT_PROGRESS_RESTORED_EVENT, hydrateWallet);
    return () => {
      window.removeEventListener(ACCOUNT_PROGRESS_RESTORED_EVENT, hydrateWallet);
    };
  }, []);

  useEffect(() => {
    if (!walletHydrated) return;

    const existing = readDashboardWalletState();
    if (
      totalPoints === 0 &&
      lifetimePointsEarned === 0 &&
      existing &&
      (existing.totalPoints > 0 || existing.lifetimePointsEarned > 0)
    ) {
      return;
    }

    saveDashboardWalletState({
      totalPoints,
      lifetimePointsEarned,
      audSliderIndex,
      xpExchangeRateSet,
    });
  }, [
    audSliderIndex,
    lifetimePointsEarned,
    totalPoints,
    walletHydrated,
    xpExchangeRateSet,
  ]);

  const setAudSliderIndex = useCallback((index: number) => {
    setAudSliderIndexState(index);
    setXpExchangeRateSet(true);
  }, []);

  const audPer100Xp = useMemo(
    () => audPerXpBlockFromSliderIndex(audSliderIndex),
    [audSliderIndex],
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

      return { success: true, audAmount, pointsClaimed: safePoints };
    },
    [audPer100Xp, totalPoints],
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
      xpExchangeRateSet,
      setAudSliderIndex,
      claimPointsForVault,
      awardLessonXp,
    }),
    [
      audPer100Xp,
      audSliderIndex,
      awardLessonXp,
      claimPointsForVault,
      lifetimePointsEarned,
      setAudSliderIndex,
      totalPoints,
      xpExchangeRateSet,
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
