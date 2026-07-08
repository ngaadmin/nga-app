import {
  defaultJarBalances,
  type JarBalanceMap,
} from "@/lib/dashboard/destination-jars";
import { DEFAULT_AUD_SLIDER_INDEX } from "@/lib/dashboard/point-conversion";
import {
  readPersisted,
  removePersisted,
  writePersisted,
} from "@/lib/dev/client-persist";

export const DASHBOARD_WALLET_STORAGE_KEY = "nga_dashboard_wallet_test_seed_1500";

/** TEMP: Seed XP balance for child conversion / Vault routing QA. Remove before production. */
export const TEMP_TEST_SEED_XP_BALANCE = 1500;

/** Lifetime XP earned - never reduced when points are cashed into the Vault. */
export const TEMP_TEST_SEED_LIFETIME_XP = 2800;

export type PersistedDashboardWallet = {
  totalPoints: number;
  lifetimePointsEarned: number;
  audSliderIndex: number;
  moneyToAllocate: number;
  jarBalances: JarBalanceMap;
};

export function defaultDashboardWalletState(): PersistedDashboardWallet {
  return {
    totalPoints: TEMP_TEST_SEED_XP_BALANCE,
    lifetimePointsEarned: TEMP_TEST_SEED_LIFETIME_XP,
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

  const raw = readPersisted(DASHBOARD_WALLET_STORAGE_KEY);
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

    const totalPoints = Math.max(0, Math.floor(parsed.totalPoints));
    const lifetimePointsEarned =
      typeof parsed.lifetimePointsEarned === "number" &&
      Number.isFinite(parsed.lifetimePointsEarned)
        ? Math.max(0, Math.floor(parsed.lifetimePointsEarned))
        : Math.max(totalPoints, TEMP_TEST_SEED_LIFETIME_XP);

    return {
      totalPoints,
      lifetimePointsEarned,
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

  writePersisted(
    DASHBOARD_WALLET_STORAGE_KEY,
    JSON.stringify(state),
  );
}

export function clearDashboardWalletState(): void {
  if (typeof window === "undefined") return;
  removePersisted(DASHBOARD_WALLET_STORAGE_KEY);
}
