import {
  defaultJarBalances,
  type JarBalanceMap,
} from "@/lib/dashboard/destination-jars";
import type { CustomVaultBucketPersisted } from "@/lib/dashboard/vault-buckets";
import type { SavingsGoal } from "@/lib/dashboard/savings-goals";
import { DEFAULT_AUD_SLIDER_INDEX } from "@/lib/dashboard/point-conversion";
import {
  readPersisted,
  removePersisted,
  writePersisted,
} from "@/lib/dev/client-persist";

export const DASHBOARD_WALLET_STORAGE_KEY = "nga_dashboard_wallet_v2";

/** Bump when persisted wallet shape or defaults change. */
export const WALLET_SCHEMA_VERSION = 4;

export type PersistedDashboardWallet = {
  schemaVersion?: number;
  totalPoints: number;
  lifetimePointsEarned: number;
  audSliderIndex: number;
  moneyToAllocate: number;
  jarBalances: JarBalanceMap;
  customBuckets?: CustomVaultBucketPersisted[];
  savingsGoals?: SavingsGoal[];
};

/** Fresh profiles start with zero balances and zero XP until earned in-app. */
export function freshDashboardWalletState(): PersistedDashboardWallet {
  return {
    schemaVersion: WALLET_SCHEMA_VERSION,
    totalPoints: 0,
    lifetimePointsEarned: 0,
    audSliderIndex: DEFAULT_AUD_SLIDER_INDEX,
    moneyToAllocate: 0,
    jarBalances: defaultJarBalances(),
    customBuckets: [],
    savingsGoals: [],
  };
}

export function defaultDashboardWalletState(): PersistedDashboardWallet {
  return freshDashboardWalletState();
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

    const storedSchemaVersion =
      typeof parsed.schemaVersion === "number" && Number.isFinite(parsed.schemaVersion)
        ? parsed.schemaVersion
        : 1;

    const totalPoints = Math.max(0, Math.floor(parsed.totalPoints));
    const lifetimePointsEarned =
      typeof parsed.lifetimePointsEarned === "number" &&
      Number.isFinite(parsed.lifetimePointsEarned)
        ? Math.max(0, Math.floor(parsed.lifetimePointsEarned))
        : totalPoints;

    const moneyToAllocate =
      storedSchemaVersion >= WALLET_SCHEMA_VERSION
        ? Math.max(0, parsed.moneyToAllocate)
        : 0;

    return {
      schemaVersion: WALLET_SCHEMA_VERSION,
      totalPoints,
      lifetimePointsEarned,
      audSliderIndex: parsed.audSliderIndex,
      moneyToAllocate,
      jarBalances,
      customBuckets: Array.isArray(parsed.customBuckets)
        ? parsed.customBuckets.filter(
            (entry): entry is CustomVaultBucketPersisted =>
              Boolean(entry) &&
              typeof entry === "object" &&
              typeof (entry as CustomVaultBucketPersisted).id === "string" &&
              (entry as CustomVaultBucketPersisted).id.startsWith("custom-"),
          )
        : [],
      savingsGoals: Array.isArray(parsed.savingsGoals)
        ? parsed.savingsGoals.filter(
            (entry): entry is SavingsGoal =>
              Boolean(entry) &&
              typeof entry === "object" &&
              typeof (entry as SavingsGoal).id === "string" &&
              (entry as SavingsGoal).id.startsWith("goal-") &&
              typeof (entry as SavingsGoal).name === "string" &&
              typeof (entry as SavingsGoal).targetAmount === "number" &&
              typeof (entry as SavingsGoal).balance === "number",
          )
        : [],
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
}

export function clearDashboardWalletState(): void {
  if (typeof window === "undefined") return;
  removePersisted(DASHBOARD_WALLET_STORAGE_KEY);
}
