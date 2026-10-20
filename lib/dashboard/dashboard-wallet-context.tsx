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
import { applyLessonCoinAward } from "@/lib/academy/lessons/lesson-coin-commit";
import {
  appendWalletLedgerEvent,
  createWalletEventId,
  currentWalletPersonKey,
  defaultDashboardWalletState,
  persistedWalletFromLiveState,
  readDashboardWalletState,
  saveDashboardWalletState,
  type WalletLedgerEvent,
} from "@/lib/dashboard/dashboard-wallet-storage";
import { ACCOUNT_PROGRESS_RESTORED_EVENT } from "@/lib/dashboard/account-progress-dirty";
import { USER_SESSION_UPDATED_EVENT } from "@/lib/onboarding/user-session-events";
import { audPerXpBlockFromSliderIndex } from "@/lib/dashboard/point-conversion";
import {
  beginCashInAttempt,
  endCashInAttempt,
  readLifetimeXp,
  readSpendableXp,
  spendSpendableXp,
  withExchangeRate,
  type SpendSpendableXpError,
} from "@/lib/dashboard/xp-cash";

type ClaimPointsResult =
  | { success: true; audAmount: number; audCents: number; pointsClaimed: number }
  | { success: false; error: SpendSpendableXpError };

type DashboardWalletContextValue = {
  /** @deprecated Prefer `spendableXp`. Live balance that cash-in reduces. */
  totalPoints: number;
  /** XP not yet cashed in. Header coins and the Vault cash-in use this. */
  spendableXp: number;
  /** @deprecated Prefer `lifetimeXp`. */
  lifetimePointsEarned: number;
  /** Lifetime XP for the leaderboard and class totals. Cash-in does not reduce it. */
  lifetimeXp: number;
  audSliderIndex: number;
  audPer100Xp: number;
  /** Parent has saved an XP-to-money exchange rate. */
  xpExchangeRateSet: boolean;
  exchangeRateCentsPer100Xp: number | null;
  setAudSliderIndex: (index: number) => void;
  setExchangeRateCents: (cents: number) => void;
  claimPointsForVault: (points: number) => ClaimPointsResult;
  /** Lets the cash-in screen release the double-tap lock after the save finishes. */
  releaseClaimLock: () => void;
  awardLessonXp: (points: number, eventId?: string) => void;
  /**
   * Save every coin row for one lesson finish, then update the counter.
   * State changes only after the wallet write succeeds.
   */
  saveLessonCoinAward: (events: { id: string; points: number }[]) =>
    | { ok: true; balance: number; awarded: number }
    | { ok: false };
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
  const [exchangeRateCentsPer100Xp, setExchangeRateCentsPer100Xp] = useState<
    number | null
  >(defaults.exchangeRateCentsPer100Xp ?? null);
  const [walletHydrated, setWalletHydrated] = useState(false);
  const skipWalletPersistRef = useRef(true);
  const walletPersonRef = useRef<string | null>(null);
  const hydratedRef = useRef(false);
  const balanceRef = useRef({ totalPoints: 0, lifetimePointsEarned: 0 });
  balanceRef.current = { totalPoints, lifetimePointsEarned };
  const claimGateRef = useRef<{ inFlight: boolean }>(endCashInAttempt());

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
      setExchangeRateCentsPer100Xp(persisted.exchangeRateCentsPer100Xp ?? null);
    } else if (willClear) {
      const fresh = defaultDashboardWalletState();
      setTotalPoints(fresh.totalPoints);
      setLifetimePointsEarned(fresh.lifetimePointsEarned);
      setAudSliderIndexState(fresh.audSliderIndex);
      setXpExchangeRateSet(fresh.xpExchangeRateSet);
      setExchangeRateCentsPer100Xp(null);
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
      existing.xpExchangeRateSet !== xpExchangeRateSet ||
      (existing.exchangeRateCentsPer100Xp ?? null) !== exchangeRateCentsPer100Xp;

    saveDashboardWalletState(
      persistedWalletFromLiveState(
        {
          totalPoints,
          lifetimePointsEarned,
          audSliderIndex,
          xpExchangeRateSet,
          exchangeRateCentsPer100Xp,
        },
        existing,
        { settingsChanged },
      ),
    );
  }, [
    audSliderIndex,
    exchangeRateCentsPer100Xp,
    lifetimePointsEarned,
    totalPoints,
    walletHydrated,
    xpExchangeRateSet,
  ]);

  const setAudSliderIndex = useCallback((index: number) => {
    const cents = Math.round(audPerXpBlockFromSliderIndex(index) * 100);
    const at = new Date().toISOString();
    setAudSliderIndexState(index);
    setXpExchangeRateSet(true);
    setExchangeRateCentsPer100Xp(cents);
    const persisted = readDashboardWalletState() ?? defaultDashboardWalletState();
    saveDashboardWalletState(withExchangeRate({ ...persisted, audSliderIndex: index }, cents, at));
  }, []);

  const setExchangeRateCents = useCallback((cents: number) => {
    const safe = Math.floor(cents);
    if (!Number.isInteger(safe) || safe <= 0) return;
    const at = new Date().toISOString();
    const persisted = readDashboardWalletState() ?? defaultDashboardWalletState();
    const next = withExchangeRate(persisted, safe, at);
    setAudSliderIndexState(next.audSliderIndex);
    setXpExchangeRateSet(true);
    setExchangeRateCentsPer100Xp(safe);
    saveDashboardWalletState(next);
  }, []);

  const audPer100Xp = useMemo(() => {
    if (xpExchangeRateSet && exchangeRateCentsPer100Xp != null) {
      return exchangeRateCentsPer100Xp / 100;
    }
    return audPerXpBlockFromSliderIndex(audSliderIndex);
  }, [audSliderIndex, exchangeRateCentsPer100Xp, xpExchangeRateSet]);

  const releaseClaimLock = useCallback(() => {
    claimGateRef.current = endCashInAttempt();
  }, []);

  const claimPointsForVault = useCallback(
    (points: number): ClaimPointsResult => {
      const begun = beginCashInAttempt(claimGateRef.current);
      if (!begun.ok) return { success: false, error: "busy" };
      claimGateRef.current = begun.state;

      const persisted = readDashboardWalletState() ?? defaultDashboardWalletState();
      const rated = {
        ...persisted,
        audSliderIndex,
        xpExchangeRateSet,
        exchangeRateCentsPer100Xp,
      };
      const result = spendSpendableXp(rated, points, {
        id: createWalletEventId(),
        at: new Date().toISOString(),
      });
      if (!result.ok) {
        claimGateRef.current = endCashInAttempt();
        return { success: false, error: result.error };
      }

      setTotalPoints(readSpendableXp(result.wallet));
      setLifetimePointsEarned(readLifetimeXp(result.wallet));
      saveDashboardWalletState(result.wallet);
      return {
        success: true,
        audAmount: result.audCents / 100,
        audCents: result.audCents,
        pointsClaimed: result.pointsClaimed,
      };
    },
    [audSliderIndex, exchangeRateCentsPer100Xp, xpExchangeRateSet],
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

  const saveLessonCoinAward = useCallback(
    (events: { id: string; points: number }[]) => {
      try {
        const persisted =
          readDashboardWalletState() ?? defaultDashboardWalletState();
        const { wallet, awarded } = applyLessonCoinAward(
          {
            ...persisted,
            audSliderIndex,
            xpExchangeRateSet,
            exchangeRateCentsPer100Xp,
          },
          events,
          new Date().toISOString(),
        );
        saveDashboardWalletState(wallet);
        setTotalPoints(wallet.totalPoints);
        setLifetimePointsEarned(wallet.lifetimePointsEarned);
        return { ok: true as const, balance: wallet.totalPoints, awarded };
      } catch {
        return { ok: false as const };
      }
    },
    [audSliderIndex, exchangeRateCentsPer100Xp, xpExchangeRateSet],
  );

  const spendableXp = readSpendableXp({ totalPoints });
  const lifetimeXp = readLifetimeXp({ lifetimePointsEarned });

  const value = useMemo(
    () => ({
      totalPoints: spendableXp,
      spendableXp,
      lifetimePointsEarned: lifetimeXp,
      lifetimeXp,
      audSliderIndex,
      audPer100Xp,
      xpExchangeRateSet,
      exchangeRateCentsPer100Xp: xpExchangeRateSet
        ? exchangeRateCentsPer100Xp
        : null,
      setAudSliderIndex,
      setExchangeRateCents,
      claimPointsForVault,
      releaseClaimLock,
      awardLessonXp,
      saveLessonCoinAward,
      reloadWalletFromStorage,
    }),
    [
      audPer100Xp,
      audSliderIndex,
      awardLessonXp,
      saveLessonCoinAward,
      claimPointsForVault,
      exchangeRateCentsPer100Xp,
      lifetimeXp,
      releaseClaimLock,
      reloadWalletFromStorage,
      setAudSliderIndex,
      setExchangeRateCents,
      spendableXp,
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
