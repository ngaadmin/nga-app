import {
  defaultJarBalances,
  type JarBalanceMap,
} from "@/lib/dashboard/destination-jars";
import type { CustomVaultBucketPersisted } from "@/lib/dashboard/vault-buckets";
import type { LedgerEntry } from "@/lib/dashboard/vault-ledger";
import type { SavingsGoal } from "@/lib/dashboard/savings-goals";
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
import {
  readVaultV2ProfileRaw,
  readVaultV2SessionRaw,
  removeVaultV2ProfileRaw,
  removeVaultV2SessionRaw,
  writeVaultV2ProfileRaw,
  writeVaultV2SessionRaw,
} from "@/lib/dashboard/vault-v2/profile-persist";
import type { UserSession } from "@/lib/onboarding/ghost-session";

export const VAULT_V2_SESSION_STORAGE_KEY = "nga_vault_v2_session_v1";
export const VAULT_V2_PROFILE_STORAGE_KEY = "nga_vault_v2_profile_v1";

export const VAULT_V2_PROFILE_SCHEMA_VERSION = 1;

export type PersistedVaultV2Profile = {
  schemaVersion: number;
  moneyToAllocate: number;
  jarBalances: JarBalanceMap;
  customBuckets: CustomVaultBucketPersisted[];
  savingsGoals: SavingsGoal[];
  spendingCategoryOverrides: SpendingCategoryOverrides;
  customSpendingCategories: CustomSpendingCategory[];
  ledger: LedgerEntry[];
};

export function freshVaultV2ProfileState(): PersistedVaultV2Profile {
  return {
    schemaVersion: VAULT_V2_PROFILE_SCHEMA_VERSION,
    moneyToAllocate: 0,
    jarBalances: defaultJarBalances(),
    customBuckets: [],
    savingsGoals: [],
    spendingCategoryOverrides: {},
    customSpendingCategories: [],
    ledger: [],
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

function parseLedgerEntry(value: unknown): LedgerEntry | null {
  if (!value || typeof value !== "object") return null;
  const entry = value as Partial<LedgerEntry>;
  if (typeof entry.id !== "string" || typeof entry.message !== "string") return null;
  if (typeof entry.category !== "string" || typeof entry.timestamp !== "number") return null;
  return entry as LedgerEntry;
}

function normalizeVaultV2Profile(raw: Partial<PersistedVaultV2Profile>): PersistedVaultV2Profile {
  const defaults = freshVaultV2ProfileState();

  const jarBalances = isJarBalanceMap(raw.jarBalances)
    ? {
        "save-jar": Math.max(0, raw.jarBalances["save-jar"]),
        "spend-jar": Math.max(0, raw.jarBalances["spend-jar"]),
        "give-jar": Math.max(0, raw.jarBalances["give-jar"]),
      }
    : defaults.jarBalances;

  return {
    schemaVersion: VAULT_V2_PROFILE_SCHEMA_VERSION,
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
    savingsGoals: Array.isArray(raw.savingsGoals)
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
      : defaults.savingsGoals,
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

function readRawForSession(session: UserSession | null): string | null {
  if (session?.accessMode === "registered") {
    return readVaultV2ProfileRaw(VAULT_V2_PROFILE_STORAGE_KEY);
  }
  return readVaultV2SessionRaw(VAULT_V2_SESSION_STORAGE_KEY);
}

function writeRawForSession(session: UserSession | null, value: string): void {
  if (session?.accessMode === "registered") {
    writeVaultV2ProfileRaw(VAULT_V2_PROFILE_STORAGE_KEY, value);
    return;
  }
  writeVaultV2SessionRaw(VAULT_V2_SESSION_STORAGE_KEY, value);
}

function vaultFieldsFromLegacyWalletRaw(raw: string): PersistedVaultV2Profile | null {
  try {
    const parsed = JSON.parse(raw) as Partial<PersistedVaultV2Profile> & {
      jarBalances?: JarBalanceMap;
    };
    if (!parsed || typeof parsed !== "object") return null;
    if (!isJarBalanceMap(parsed.jarBalances) && typeof parsed.moneyToAllocate !== "number") {
      return null;
    }
    return normalizeVaultV2Profile(parsed);
  } catch {
    return null;
  }
}

function readLegacyWalletRaw(): string | null {
  if (typeof window === "undefined") return null;
  return readPersisted(DASHBOARD_WALLET_STORAGE_KEY);
}

function hasLegacyWalletVaultData(profile: PersistedVaultV2Profile): boolean {
  return (
    profile.moneyToAllocate > 0 ||
    profile.jarBalances["save-jar"] > 0 ||
    profile.jarBalances["spend-jar"] > 0 ||
    profile.jarBalances["give-jar"] > 0 ||
    profile.customBuckets.length > 0 ||
    profile.savingsGoals.length > 0 ||
    Object.keys(profile.spendingCategoryOverrides).length > 0 ||
    profile.customSpendingCategories.length > 0
  );
}

export function readVaultV2ProfileState(
  session: UserSession | null = null,
): PersistedVaultV2Profile {
  if (typeof window === "undefined") {
    return freshVaultV2ProfileState();
  }

  const raw = readRawForSession(session);
  if (raw) {
    try {
      return normalizeVaultV2Profile(JSON.parse(raw) as Partial<PersistedVaultV2Profile>);
    } catch {
      return freshVaultV2ProfileState();
    }
  }

  const legacyWalletRaw = readLegacyWalletRaw();
  if (legacyWalletRaw) {
    const migrated = vaultFieldsFromLegacyWalletRaw(legacyWalletRaw);
    if (migrated && hasLegacyWalletVaultData(migrated)) {
      return migrated;
    }
  }

  return freshVaultV2ProfileState();
}

export function saveVaultV2ProfileState(
  state: PersistedVaultV2Profile,
  session: UserSession | null = null,
): void {
  if (typeof window === "undefined") return;

  writeRawForSession(
    session,
    JSON.stringify({ ...state, schemaVersion: VAULT_V2_PROFILE_SCHEMA_VERSION }),
  );
}

/** Promotes guest session vault data into the registered profile store. */
export function migrateVaultV2SessionToProfile(): PersistedVaultV2Profile | null {
  if (typeof window === "undefined") return null;

  const sessionRaw = readVaultV2SessionRaw(VAULT_V2_SESSION_STORAGE_KEY);
  if (!sessionRaw) return null;

  try {
    const profile = normalizeVaultV2Profile(
      JSON.parse(sessionRaw) as Partial<PersistedVaultV2Profile>,
    );
    writeVaultV2ProfileRaw(
      VAULT_V2_PROFILE_STORAGE_KEY,
      JSON.stringify({ ...profile, schemaVersion: VAULT_V2_PROFILE_SCHEMA_VERSION }),
    );
    removeVaultV2SessionRaw(VAULT_V2_SESSION_STORAGE_KEY);
    return profile;
  } catch {
    return null;
  }
}

export function clearVaultV2SessionState(): void {
  removeVaultV2SessionRaw(VAULT_V2_SESSION_STORAGE_KEY);
}

export function clearVaultV2ProfileState(): void {
  removeVaultV2ProfileRaw(VAULT_V2_PROFILE_STORAGE_KEY);
}

export function clearAllVaultV2Storage(): void {
  clearVaultV2SessionState();
  clearVaultV2ProfileState();
}
