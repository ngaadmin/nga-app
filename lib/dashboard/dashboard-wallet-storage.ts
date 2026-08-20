import { DEFAULT_AUD_SLIDER_INDEX } from "@/lib/dashboard/point-conversion";
import { markAccountProgressDirty } from "@/lib/dashboard/account-progress-dirty";
import {
  readPersisted,
  removePersisted,
  writePersisted,
} from "@/lib/dev/client-persist";

export const DASHBOARD_WALLET_STORAGE_KEY = "nga_dashboard_wallet_v2";

/** Bump when persisted wallet shape or defaults change. */
export const WALLET_SCHEMA_VERSION = 7;

export type PersistedDashboardWallet = {
  schemaVersion?: number;
  totalPoints: number;
  lifetimePointsEarned: number;
  audSliderIndex: number;
  /** True after a parent saves an XP exchange rate. */
  xpExchangeRateSet: boolean;
};

/** Fresh profiles start with zero XP until earned in-app. */
export function freshDashboardWalletState(): PersistedDashboardWallet {
  return {
    schemaVersion: WALLET_SCHEMA_VERSION,
    totalPoints: 0,
    lifetimePointsEarned: 0,
    audSliderIndex: DEFAULT_AUD_SLIDER_INDEX,
    xpExchangeRateSet: false,
  };
}

export function defaultDashboardWalletState(): PersistedDashboardWallet {
  return freshDashboardWalletState();
}

export function readDashboardWalletState(): PersistedDashboardWallet | null {
  if (typeof window === "undefined") return null;

  const raw = readPersisted(DASHBOARD_WALLET_STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<PersistedDashboardWallet> & {
      moneyToAllocate?: number;
      jarBalances?: unknown;
    };
    if (
      typeof parsed.totalPoints !== "number" ||
      !Number.isFinite(parsed.totalPoints) ||
      typeof parsed.audSliderIndex !== "number" ||
      !Number.isFinite(parsed.audSliderIndex)
    ) {
      return null;
    }

    const totalPoints = Math.max(0, Math.floor(parsed.totalPoints));
    const lifetimePointsEarned =
      typeof parsed.lifetimePointsEarned === "number" &&
      Number.isFinite(parsed.lifetimePointsEarned)
        ? Math.max(0, Math.floor(parsed.lifetimePointsEarned))
        : totalPoints;

    return {
      schemaVersion: WALLET_SCHEMA_VERSION,
      totalPoints,
      lifetimePointsEarned,
      audSliderIndex: parsed.audSliderIndex,
      xpExchangeRateSet: parsed.xpExchangeRateSet === true,
    };
  } catch {
    return null;
  }
}

export function saveDashboardWalletState(state: PersistedDashboardWallet): void {
  if (typeof window === "undefined") return;

  writePersisted(
    DASHBOARD_WALLET_STORAGE_KEY,
    JSON.stringify({ ...state, schemaVersion: WALLET_SCHEMA_VERSION }),
  );
  markAccountProgressDirty();
}

export function clearDashboardWalletState(): void {
  if (typeof window === "undefined") return;
  removePersisted(DASHBOARD_WALLET_STORAGE_KEY);
}
