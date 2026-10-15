import { DEFAULT_AUD_SLIDER_INDEX } from "@/lib/dashboard/point-conversion";
import { markAccountProgressDirty } from "@/lib/dashboard/account-progress-dirty";
import {
  readPersisted,
  removePersisted,
  writePersisted,
} from "@/lib/dev/client-persist";
import { readUserSession } from "@/lib/onboarding/guest-session";

export const DASHBOARD_WALLET_STORAGE_KEY = "nga_dashboard_wallet_v2";

/** Bump when persisted wallet shape or defaults change. */
export const WALLET_SCHEMA_VERSION = 9;

/** One XP award or cash-in. Merge unions these by id across devices. */
export type WalletLedgerEvent = {
  id: string;
  kind: "earn" | "spend";
  points: number;
  at: string;
};

export type PersistedDashboardWallet = {
  schemaVersion?: number;
  /** Auth uid, registered username key, or guest key that owns this balance. */
  ownerUserId?: string | null;
  /** Spendable balance. Goes up with lessons and down on cash-in. */
  totalPoints: number;
  /** Monotonic XP total for leaderboards. Never decreases. */
  lifetimePointsEarned: number;
  audSliderIndex: number;
  /** True after a parent saves an XP exchange rate. */
  xpExchangeRateSet: boolean;
  /** Awards and cash-ins since this device started recording a ledger. */
  ledger?: WalletLedgerEvent[];
  /** When this device last changed the balance or the exchange rate. */
  updatedAt?: string | null;
};

function isWalletRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function parseWalletLedger(value: unknown): WalletLedgerEvent[] {
  if (!Array.isArray(value)) return [];
  const events: WalletLedgerEvent[] = [];
  for (const raw of value) {
    if (!isWalletRecord(raw)) continue;
    if (raw.kind !== "earn" && raw.kind !== "spend") continue;
    if (typeof raw.id !== "string" || !raw.id.trim()) continue;
    if (typeof raw.points !== "number" || !Number.isFinite(raw.points)) continue;
    const points = Math.floor(raw.points);
    if (points <= 0) continue;
    events.push({
      id: raw.id.trim(),
      kind: raw.kind,
      points,
      at: typeof raw.at === "string" ? raw.at : "",
    });
  }
  return events;
}

export function createWalletEventId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `xp-${Date.now().toString(36)}-${Math.random().toString(16).slice(2)}`;
}

/**
 * Append one award or cash-in. Returns null when that event id is already
 * recorded so the same lesson cannot pay out twice.
 */
export function appendWalletLedgerEvent(
  wallet: PersistedDashboardWallet,
  event: WalletLedgerEvent,
): PersistedDashboardWallet | null {
  const ledger = wallet.ledger ?? [];
  if (ledger.some((entry) => entry.id === event.id)) return null;
  const lifetimePointsEarned =
    wallet.lifetimePointsEarned + (event.kind === "earn" ? event.points : 0);
  const spent =
    Math.max(0, wallet.lifetimePointsEarned - wallet.totalPoints) +
    (event.kind === "spend" ? event.points : 0);
  return {
    ...wallet,
    totalPoints: Math.max(0, lifetimePointsEarned - spent),
    lifetimePointsEarned,
    ledger: [...ledger, event],
    updatedAt: event.at || new Date().toISOString(),
  };
}

/** Accept a stored wallet object and fill in lifetime XP when older rows omitted it. */
export function walletFieldsFromUnknown(
  value: unknown,
): PersistedDashboardWallet | null {
  if (!isWalletRecord(value)) return null;
  if (
    typeof value.totalPoints !== "number" ||
    !Number.isFinite(value.totalPoints) ||
    typeof value.audSliderIndex !== "number" ||
    !Number.isFinite(value.audSliderIndex)
  ) {
    return null;
  }

  const totalPoints = Math.max(0, Math.floor(value.totalPoints));
  const recordedLifetime =
    typeof value.lifetimePointsEarned === "number" &&
    Number.isFinite(value.lifetimePointsEarned)
      ? Math.max(0, Math.floor(value.lifetimePointsEarned))
      : totalPoints;
  const lifetimePointsEarned = Math.max(totalPoints, recordedLifetime);
  const ledger = parseWalletLedger(value.ledger);
  const updatedAt =
    typeof value.updatedAt === "string" && value.updatedAt.trim()
      ? value.updatedAt.trim()
      : null;

  return {
    schemaVersion:
      typeof value.schemaVersion === "number"
        ? value.schemaVersion
        : WALLET_SCHEMA_VERSION,
    ownerUserId:
      typeof value.ownerUserId === "string" && value.ownerUserId.trim()
        ? value.ownerUserId.trim()
        : null,
    totalPoints,
    lifetimePointsEarned,
    audSliderIndex: value.audSliderIndex,
    xpExchangeRateSet: value.xpExchangeRateSet === true,
    ...(ledger.length > 0 ? { ledger } : {}),
    ...(updatedAt ? { updatedAt } : {}),
  };
}

/** Same learner across a `name:` owner and a later Auth id. */
export function currentWalletPersonKey(): string | null {
  const session = readUserSession();
  if (!session) return null;
  const username = session.username.trim().toLowerCase();
  if (!username) return currentWalletOwnerId();
  return session.accessMode === "registered"
    ? `user:${username}`
    : `guest:${username}`;
}

export function currentWalletOwnerId(): string | null {
  const session = readUserSession();
  if (!session) return null;
  if (session.accessMode === "registered") {
    const userId = session.supabaseUserId?.trim();
    if (userId) return userId;
    const username = session.username.trim().toLowerCase();
    return username ? `name:${username}` : null;
  }
  const username = session.username.trim().toLowerCase();
  return username ? `guest:${username}` : "guest";
}

function walletBelongsToCurrentAccount(
  storedOwner: string | null | undefined,
): boolean {
  const session = readUserSession();
  const owner = currentWalletOwnerId();
  if (!owner) return false;
  const isGuestOwner = owner === "guest" || owner.startsWith("guest:");
  if (isGuestOwner) {
    return !storedOwner || storedOwner === owner;
  }
  if (storedOwner === owner) return true;
  // Coins saved before the Auth id arrived use `name:<username>`.
  const username = session?.username.trim().toLowerCase();
  return Boolean(username) && storedOwner === `name:${username}`;
}

/** Fresh profiles start with zero XP until earned in-app. */
export function freshDashboardWalletState(): PersistedDashboardWallet {
  return {
    schemaVersion: WALLET_SCHEMA_VERSION,
    ownerUserId: currentWalletOwnerId(),
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
    const wallet = walletFieldsFromUnknown(JSON.parse(raw));
    if (!wallet || !walletBelongsToCurrentAccount(wallet.ownerUserId)) {
      return null;
    }

    return {
      ...wallet,
      schemaVersion: WALLET_SCHEMA_VERSION,
    };
  } catch {
    return null;
  }
}

export function saveDashboardWalletState(state: PersistedDashboardWallet): void {
  if (typeof window === "undefined") return;

  writePersisted(
    DASHBOARD_WALLET_STORAGE_KEY,
    JSON.stringify({
      ...state,
      schemaVersion: WALLET_SCHEMA_VERSION,
      ownerUserId: state.ownerUserId ?? currentWalletOwnerId(),
    }),
  );
  markAccountProgressDirty();
}

export function clearDashboardWalletState(): void {
  if (typeof window === "undefined") return;
  removePersisted(DASHBOARD_WALLET_STORAGE_KEY);
}

/** Replace the shared live wallet with a zero balance for the current account. */
export function resetDashboardWalletForCurrentAccount(): void {
  if (typeof window === "undefined") return;
  saveDashboardWalletState(freshDashboardWalletState());
}
