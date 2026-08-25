import {
  defaultJarBalances,
  roundAudAmount,
  sumJarBalances,
  type JarBalanceMap,
} from "@/lib/dashboard/destination-jars";
import type { CustomVaultBucketPersisted } from "@/lib/dashboard/vault-buckets";
import type { LedgerEntry } from "@/lib/dashboard/vault-ledger";
import {
  retireEmergencyMoneyStarterGoal,
  type SavingsGoal,
} from "@/lib/dashboard/savings-goals";
import type {
  CustomSpendingCategory,
  SpendingCategoryOverrides,
} from "@/lib/dashboard/spending-categories";
import {
  DASHBOARD_WALLET_STORAGE_KEY,
} from "@/lib/dashboard/dashboard-wallet-storage";
import {
  readPersisted,
} from "@/lib/dev/client-persist";
import { markAccountProgressDirty } from "@/lib/dashboard/account-progress-dirty";
import {
  readVaultProfileRaw,
  readVaultSessionRaw,
  removeVaultProfileRaw,
  removeVaultSessionRaw,
  writeVaultProfileRaw,
  writeVaultSessionRaw,
} from "@/lib/dashboard/vault/profile-persist";
import type { UserSession } from "@/lib/onboarding/guest-session";

export const VAULT_SESSION_STORAGE_KEY = "nga_vault_session_v1";
export const VAULT_PROFILE_STORAGE_KEY = "nga_vault_profile_v1";

/** Legacy keys — migrated on read. */
const LEGACY_VAULT_SESSION_STORAGE_KEY = "nga_vault_v2_session_v1";
const LEGACY_VAULT_PROFILE_STORAGE_KEY = "nga_vault_v2_profile_v1";

export const VAULT_PROFILE_SCHEMA_VERSION = 1;

export type PersistedVaultProfile = {
  schemaVersion: number;
  moneyToAllocate: number;
  jarBalances: JarBalanceMap;
  customBuckets: CustomVaultBucketPersisted[];
  savingsGoals: SavingsGoal[];
  spendingCategoryOverrides: SpendingCategoryOverrides;
  customSpendingCategories: CustomSpendingCategory[];
  ledger: LedgerEntry[];
};

export function freshVaultProfileState(): PersistedVaultProfile {
  return {
    schemaVersion: VAULT_PROFILE_SCHEMA_VERSION,
    moneyToAllocate: 0,
    jarBalances: defaultJarBalances(),
    customBuckets: [],
    savingsGoals: [],
    spendingCategoryOverrides: {},
    customSpendingCategories: [],
    ledger: [],
  };
}

function isLegacyFoundationJarBalanceMap(value: unknown): value is Pick<
  JarBalanceMap,
  "save-jar" | "spend-jar" | "give-jar"
> {
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

function isJarBalanceMap(value: unknown): value is JarBalanceMap {
  return isLegacyFoundationJarBalanceMap(value);
}

function normalizeJarBalances(raw: unknown): JarBalanceMap {
  const defaults = defaultJarBalances();
  if (!isLegacyFoundationJarBalanceMap(raw)) return defaults;
  const emergenciesRaw = (raw as Partial<JarBalanceMap>)["emergencies-jar"];
  return {
    "save-jar": Math.max(0, raw["save-jar"]),
    "spend-jar": Math.max(0, raw["spend-jar"]),
    "give-jar": Math.max(0, raw["give-jar"]),
    "emergencies-jar":
      typeof emergenciesRaw === "number" && Number.isFinite(emergenciesRaw)
        ? Math.max(0, emergenciesRaw)
        : 0,
  };
}

function parseLedgerEntry(value: unknown): LedgerEntry | null {
  if (!value || typeof value !== "object") return null;
  const entry = value as Partial<LedgerEntry>;
  if (typeof entry.id !== "string" || typeof entry.message !== "string") return null;
  if (typeof entry.category !== "string" || typeof entry.timestamp !== "number") return null;
  return entry as LedgerEntry;
}

function normalizeVaultProfile(raw: Partial<PersistedVaultProfile>): PersistedVaultProfile {
  const defaults = freshVaultProfileState();
  const jarBalances = normalizeJarBalances(raw.jarBalances);

  const parsedGoals = Array.isArray(raw.savingsGoals)
    ? raw.savingsGoals.filter(
        (entry): entry is SavingsGoal =>
          Boolean(entry) &&
          typeof entry === "object" &&
          typeof (entry as SavingsGoal).id === "string" &&
          (entry as SavingsGoal).id.startsWith("goal-") &&
          typeof (entry as SavingsGoal).name === "string" &&
          typeof (entry as SavingsGoal).targetAmount === "number" &&
          typeof (entry as SavingsGoal).balance === "number",
      )
    : defaults.savingsGoals;
  const retiredEmergency = retireEmergencyMoneyStarterGoal(parsedGoals);
  jarBalances["save-jar"] = roundAudAmount(
    Math.max(0, jarBalances["save-jar"] + retiredEmergency.returnedBalance),
  );

  return {
    schemaVersion: VAULT_PROFILE_SCHEMA_VERSION,
    moneyToAllocate:
      typeof raw.moneyToAllocate === "number" && Number.isFinite(raw.moneyToAllocate)
        ? Math.max(0, raw.moneyToAllocate)
        : defaults.moneyToAllocate,
    jarBalances,
    customBuckets: Array.isArray(raw.customBuckets)
      ? raw.customBuckets.filter(
          (entry): entry is CustomVaultBucketPersisted =>
            Boolean(entry) &&
            typeof entry === "object" &&
            typeof (entry as CustomVaultBucketPersisted).id === "string" &&
            (entry as CustomVaultBucketPersisted).id.startsWith("custom-"),
        )
      : defaults.customBuckets,
    savingsGoals: retiredEmergency.goals,
    spendingCategoryOverrides:
      raw.spendingCategoryOverrides && typeof raw.spendingCategoryOverrides === "object"
        ? (raw.spendingCategoryOverrides as SpendingCategoryOverrides)
        : defaults.spendingCategoryOverrides,
    customSpendingCategories: Array.isArray(raw.customSpendingCategories)
      ? raw.customSpendingCategories.filter(
          (entry): entry is CustomSpendingCategory =>
            Boolean(entry) &&
            typeof entry === "object" &&
            typeof (entry as CustomSpendingCategory).id === "string" &&
            (entry as CustomSpendingCategory).id.startsWith("spend-cat-") &&
            typeof (entry as CustomSpendingCategory).label === "string",
        )
      : defaults.customSpendingCategories,
    ledger: Array.isArray(raw.ledger)
      ? raw.ledger
          .map(parseLedgerEntry)
          .filter((entry): entry is LedgerEntry => entry !== null)
      : defaults.ledger,
  };
}

function migrateLegacyKeyIfNeeded(
  currentKey: string,
  legacyKey: string,
  readFn: (key: string) => string | null,
  writeFn: (key: string, value: string) => void,
  removeFn: (key: string) => void,
): string | null {
  const current = readFn(currentKey);
  if (current !== null) return current;

  const legacy = readFn(legacyKey);
  if (legacy === null) return null;

  writeFn(currentKey, legacy);
  removeFn(legacyKey);
  return legacy;
}

function readRawForSession(session: UserSession | null): string | null {
  if (session?.accessMode === "registered") {
    return migrateLegacyKeyIfNeeded(
      VAULT_PROFILE_STORAGE_KEY,
      LEGACY_VAULT_PROFILE_STORAGE_KEY,
      readVaultProfileRaw,
      writeVaultProfileRaw,
      removeVaultProfileRaw,
    );
  }
  return migrateLegacyKeyIfNeeded(
    VAULT_SESSION_STORAGE_KEY,
    LEGACY_VAULT_SESSION_STORAGE_KEY,
    readVaultSessionRaw,
    writeVaultSessionRaw,
    removeVaultSessionRaw,
  );
}

function writeRawForSession(session: UserSession | null, value: string): void {
  if (session?.accessMode === "registered") {
    writeVaultProfileRaw(VAULT_PROFILE_STORAGE_KEY, value);
    return;
  }
  writeVaultSessionRaw(VAULT_SESSION_STORAGE_KEY, value);
}

function vaultFieldsFromLegacyWalletRaw(raw: string): PersistedVaultProfile | null {
  try {
    const parsed = JSON.parse(raw) as Partial<PersistedVaultProfile> & {
      jarBalances?: JarBalanceMap;
    };
    if (!parsed || typeof parsed !== "object") return null;
    if (!isJarBalanceMap(parsed.jarBalances) && typeof parsed.moneyToAllocate !== "number") {
      return null;
    }
    return normalizeVaultProfile(parsed);
  } catch {
    return null;
  }
}

function readLegacyWalletRaw(): string | null {
  if (typeof window === "undefined") return null;
  return readPersisted(DASHBOARD_WALLET_STORAGE_KEY);
}

function hasLegacyWalletVaultData(profile: PersistedVaultProfile): boolean {
  return (
    profile.moneyToAllocate > 0 ||
    sumJarBalances(profile.jarBalances) > 0 ||
    profile.customBuckets.length > 0 ||
    profile.savingsGoals.length > 0 ||
    Object.keys(profile.spendingCategoryOverrides).length > 0 ||
    profile.customSpendingCategories.length > 0
  );
}

export function readVaultProfileState(
  session: UserSession | null = null,
): PersistedVaultProfile {
  if (typeof window === "undefined") {
    return freshVaultProfileState();
  }

  const raw = readRawForSession(session);
  if (raw) {
    try {
      return normalizeVaultProfile(JSON.parse(raw) as Partial<PersistedVaultProfile>);
    } catch {
      return freshVaultProfileState();
    }
  }

  const legacyWalletRaw = readLegacyWalletRaw();
  if (legacyWalletRaw) {
    const migrated = vaultFieldsFromLegacyWalletRaw(legacyWalletRaw);
    if (migrated && hasLegacyWalletVaultData(migrated)) {
      return migrated;
    }
  }

  return freshVaultProfileState();
}

export function saveVaultProfileState(
  state: PersistedVaultProfile,
  session: UserSession | null = null,
): void {
  if (typeof window === "undefined") return;

  writeRawForSession(
    session,
    JSON.stringify({
      ...normalizeVaultProfile(state),
      schemaVersion: VAULT_PROFILE_SCHEMA_VERSION,
    }),
  );
  markAccountProgressDirty();
}

/** Promotes guest session vault data into the registered profile store. */
export function migrateVaultSessionToProfile(): PersistedVaultProfile | null {
  if (typeof window === "undefined") return null;

  const sessionRaw = migrateLegacyKeyIfNeeded(
    VAULT_SESSION_STORAGE_KEY,
    LEGACY_VAULT_SESSION_STORAGE_KEY,
    readVaultSessionRaw,
    writeVaultSessionRaw,
    removeVaultSessionRaw,
  );
  if (!sessionRaw) return null;

  try {
    const profile = normalizeVaultProfile(
      JSON.parse(sessionRaw) as Partial<PersistedVaultProfile>,
    );
    writeVaultProfileRaw(
      VAULT_PROFILE_STORAGE_KEY,
      JSON.stringify({ ...profile, schemaVersion: VAULT_PROFILE_SCHEMA_VERSION }),
    );
    removeVaultSessionRaw(VAULT_SESSION_STORAGE_KEY);
    removeVaultSessionRaw(LEGACY_VAULT_SESSION_STORAGE_KEY);
    markAccountProgressDirty();
    return profile;
  } catch {
    return null;
  }
}

export function clearVaultSessionState(): void {
  removeVaultSessionRaw(VAULT_SESSION_STORAGE_KEY);
  removeVaultSessionRaw(LEGACY_VAULT_SESSION_STORAGE_KEY);
}

export function clearVaultProfileState(): void {
  removeVaultProfileRaw(VAULT_PROFILE_STORAGE_KEY);
  removeVaultProfileRaw(LEGACY_VAULT_PROFILE_STORAGE_KEY);
}

export function clearAllVaultStorage(): void {
  clearVaultSessionState();
  clearVaultProfileState();
}
