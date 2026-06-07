import {
  defaultJarBalances,
  type JarBalanceMap,
} from "@/lib/dashboard/destination-jars";
import { DEFAULT_AUD_SLIDER_INDEX } from "@/lib/dashboard/point-conversion";

export const DASHBOARD_WALLET_STORAGE_KEY = "nga_dashboard_wallet_test_seed_1500";

/** TEMP: Seed XP balance for child conversion / Vault routing QA. Remove before production. */
export const TEMP_TEST_SEED_XP_BALANCE = 1500;

export type PersistedDashboardWallet = {
  totalPoints: number;
  audSliderIndex: number;
  moneyToAllocate: number;
  jarBalances: JarBalanceMap;
};

export function defaultDashboardWalletState(): PersistedDashboardWallet {
  return {
    totalPoints: TEMP_TEST_SEED_XP_BALANCE,
    audSliderIndex: DEFAULT_AUD_SLIDER_INDEX,
    moneyToAllocate: 0,
    jarBalances: defaultJarBalances(),
  };
}

function isJarBalanceMap(value: unknown): value is JarBalanceMap {
  if (!value || typeof value !== "object") return false;

  const record = value as Partial<JarBalanceMap>;
  return (
    typeof record["save-jar"] === "number" &&
    Number.isFinite(record["save-jar"]) &&
    typeof record["spend-jar"] === "number" &&
    Number.isFinite(record["spend-jar"]) &&
    typeof record["give-jar"] === "number" &&
    Number.isFinite(record["give-jar"])
  );
}

export function readDashboardWalletState(): PersistedDashboardWallet | null {
  if (typeof window === "undefined") return null;

  const raw = window.sessionStorage.getItem(DASHBOARD_WALLET_STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<PersistedDashboardWallet>;
    if (
      typeof parsed.totalPoints !== "number" ||
      !Number.isFinite(parsed.totalPoints) ||
      typeof parsed.audSliderIndex !== "number" ||
      !Number.isFinite(parsed.audSliderIndex) ||
      typeof parsed.moneyToAllocate !== "number" ||
      !Number.isFinite(parsed.moneyToAllocate)
    ) {
      return null;
    }

    const jarBalances = isJarBalanceMap(parsed.jarBalances)
      ? {
          "save-jar": Math.max(0, parsed.jarBalances["save-jar"]),
          "spend-jar": Math.max(0, parsed.jarBalances["spend-jar"]),
          "give-jar": Math.max(0, parsed.jarBalances["give-jar"]),
        }
      : defaultJarBalances();

    return {
      totalPoints: Math.max(0, Math.floor(parsed.totalPoints)),
      audSliderIndex: parsed.audSliderIndex,
      moneyToAllocate: Math.max(0, parsed.moneyToAllocate),
      jarBalances,
    };
  } catch {
    return null;
  }
}

export function saveDashboardWalletState(state: PersistedDashboardWallet): void {
  if (typeof window === "undefined") return;

  window.sessionStorage.setItem(
    DASHBOARD_WALLET_STORAGE_KEY,
    JSON.stringify(state),
  );
}

export function clearDashboardWalletState(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(DASHBOARD_WALLET_STORAGE_KEY);
}
