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
  currentWalletPersonKey,
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
  /** Pull the saved balance into the header after a lesson cash-in. */
  reloadWalletFromStorage: () => void;
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
  const walletPersonRef = useRef<string | null>(null);
  const hydratedRef = useRef(false);
  const balanceRef = useRef({ totalPoints: 0, lifetimePointsEarned: 0 });
  balanceRef.current = { totalPoints, lifetimePointsEarned };

  const reloadWalletFromStorage = useCallback(() => {
    const person = currentWalletPersonKey();
    const previousPerson = walletPersonRef.current;
    // A missing session keeps the last learner so the next username is a switch.
    const personChanged =
      person !== null &&
      previousPerson !== null &&
      previousPerson !== person;
    if (person !== null) {
      walletPersonRef.current = person;
    }
    const persisted = readDashboardWalletState();
    const current = balanceRef.current;
    const nextLifetime = persisted
      ? personChanged
        ? persisted.lifetimePointsEarned
        : Math.max(current.lifetimePointsEarned, persisted.lifetimePointsEarned)
      : 0;
    const willClear =
      !persisted &&
      personChanged &&
      person !== null &&
      (current.totalPoints > 0 || current.lifetimePointsEarned > 0);
    if (!hydratedRef.current || willClear) {
      skipWalletPersistRef.current = true;
    }
    if (persisted) {
      setTotalPoints(persisted.totalPoints);
      setLifetimePointsEarned(nextLifetime);
      setAudSliderIndexState(persisted.audSliderIndex);
      setXpExchangeRateSet(persisted.xpExchangeRateSet);
    } else if (willClear) {
      const fresh = defaultDashboardWalletState();
      setTotalPoints(fresh.totalPoints);
      setLifetimePointsEarned(fresh.lifetimePointsEarned);
      setAudSliderIndexState(fresh.audSliderIndex);
      setXpExchangeRateSet(fresh.xpExchangeRateSet);
    }
    hydratedRef.current = true;
    setWalletHydrated(true);
  }, []);

  useEffect(() => {
    reloadWalletFromStorage();
    window.addEventListener(ACCOUNT_PROGRESS_RESTORED_EVENT, reloadWalletFromStorage);
    window.addEventListener(USER_SESSION_UPDATED_EVENT, reloadWalletFromStorage);
    return () => {
      window.removeEventListener(
        ACCOUNT_PROGRESS_RESTORED_EVENT,
        reloadWalletFromStorage,
      );
      window.removeEventListener(USER_SESSION_UPDATED_EVENT, reloadWalletFromStorage);
    };
  }, [reloadWalletFromStorage]);

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
      lifetimePointsEarned: Math.max(
        lifetimePointsEarned,
        existing?.lifetimePointsEarned ?? 0,
      ),
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
      reloadWalletFromStorage,
    }),
    [
      audPer100Xp,
      audSliderIndex,
      awardLessonXp,
      claimPointsForVault,
      lifetimePointsEarned,
      reloadWalletFromStorage,
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
