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
  const [audSliderIndex, setAudSliderIndex] = useState(() => defaults.audSliderIndex);
  const [walletHydrated, setWalletHydrated] = useState(false);

  useEffect(() => {
    const persisted = readDashboardWalletState();
    if (persisted) {
      setTotalPoints(persisted.totalPoints);
      setLifetimePointsEarned(persisted.lifetimePointsEarned);
      setAudSliderIndex(persisted.audSliderIndex);
    }
    setWalletHydrated(true);
  }, []);

  useEffect(() => {
    if (!walletHydrated) return;

    saveDashboardWalletState({
      totalPoints,
      lifetimePointsEarned,
      audSliderIndex,
    });
  }, [audSliderIndex, lifetimePointsEarned, totalPoints, walletHydrated]);

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
      totalPoints,
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
