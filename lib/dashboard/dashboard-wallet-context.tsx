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
import {
  appendWalletLedgerEvent,
  createWalletEventId,
  defaultDashboardWalletState,
  readDashboardWalletState,
  saveDashboardWalletState,
  type WalletLedgerEvent,
} from "@/lib/dashboard/dashboard-wallet-storage";
import { ACCOUNT_PROGRESS_RESTORED_EVENT } from "@/lib/dashboard/account-progress-dirty";
import { USER_SESSION_UPDATED_EVENT } from "@/lib/onboarding/user-session-events";
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
  awardLessonXp: (points: number, eventId?: string) => void;
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
  const skipWalletPersistRef = useRef(true);

  useEffect(() => {
    function hydrateWallet() {
      skipWalletPersistRef.current = true;
      const persisted = readDashboardWalletState();
      if (persisted) {
        setTotalPoints(persisted.totalPoints);
        setLifetimePointsEarned(persisted.lifetimePointsEarned);
        setAudSliderIndexState(persisted.audSliderIndex);
        setXpExchangeRateSet(persisted.xpExchangeRateSet);
      } else {
        const fresh = defaultDashboardWalletState();
        setTotalPoints(fresh.totalPoints);
        setLifetimePointsEarned(fresh.lifetimePointsEarned);
        setAudSliderIndexState(fresh.audSliderIndex);
        setXpExchangeRateSet(fresh.xpExchangeRateSet);
      }
      setWalletHydrated(true);
    }

    hydrateWallet();
    window.addEventListener(ACCOUNT_PROGRESS_RESTORED_EVENT, hydrateWallet);
    window.addEventListener(USER_SESSION_UPDATED_EVENT, hydrateWallet);
    return () => {
      window.removeEventListener(ACCOUNT_PROGRESS_RESTORED_EVENT, hydrateWallet);
      window.removeEventListener(USER_SESSION_UPDATED_EVENT, hydrateWallet);
    };
  }, []);

  useEffect(() => {
    if (!walletHydrated) return;
    if (skipWalletPersistRef.current) {
      skipWalletPersistRef.current = false;
      return;
    }

    const existing = readDashboardWalletState();
    if (totalPoints === 0 && lifetimePointsEarned === 0) {
      if (
        !existing ||
        existing.totalPoints > 0 ||
        existing.lifetimePointsEarned > 0
      ) {
        return;
      }
    }

    const settingsChanged =
      !existing ||
      existing.audSliderIndex !== audSliderIndex ||
      existing.xpExchangeRateSet !== xpExchangeRateSet;

    saveDashboardWalletState({
      ...existing,
      totalPoints,
      lifetimePointsEarned,
      audSliderIndex,
      xpExchangeRateSet,
      updatedAt: settingsChanged
        ? new Date().toISOString()
        : existing?.updatedAt,
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
      const persisted = readDashboardWalletState() ?? defaultDashboardWalletState();
      const event: WalletLedgerEvent = {
        id: createWalletEventId(),
        kind: "spend",
        points: safePoints,
        at: new Date().toISOString(),
      };
      const next = appendWalletLedgerEvent(
        { ...persisted, audSliderIndex, xpExchangeRateSet },
        event,
      );
      if (!next) {
        return { success: false, error: "That cash-in was already saved." };
      }

      setTotalPoints(next.totalPoints);
      saveDashboardWalletState(next);

      return { success: true, audAmount, pointsClaimed: safePoints };
    },
    [audPer100Xp, audSliderIndex, totalPoints, xpExchangeRateSet],
  );

  const awardLessonXp = useCallback((points: number, eventId?: string) => {
    const safePoints = Math.floor(points);
    if (!Number.isFinite(safePoints) || safePoints <= 0) return;

    const persisted = readDashboardWalletState() ?? defaultDashboardWalletState();
    const event: WalletLedgerEvent = {
      id: eventId?.trim() || createWalletEventId(),
      kind: "earn",
      points: safePoints,
      at: new Date().toISOString(),
    };
    const next = appendWalletLedgerEvent(
      { ...persisted, audSliderIndex, xpExchangeRateSet },
      event,
    );
    if (!next) return;

    setTotalPoints(next.totalPoints);
    setLifetimePointsEarned(next.lifetimePointsEarned);
    saveDashboardWalletState(next);
  }, [audSliderIndex, xpExchangeRateSet]);

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
