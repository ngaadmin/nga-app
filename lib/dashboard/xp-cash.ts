import {
  appendWalletLedgerEvent,
  type PersistedDashboardWallet,
} from "@/lib/dashboard/dashboard-wallet-storage";
import {
  audPerXpBlockFromSliderIndex,
  convertPointsToCents,
  sliderIndexFromAudPerXpBlock,
} from "@/lib/dashboard/point-conversion";

export { convertPointsToCents } from "@/lib/dashboard/point-conversion";
import {
  centsToDollars,
  dollarsToCents,
} from "@/lib/dashboard/vault-amount-input";

/** One cent per 100 XP. Parents can save $0.50, $2, $3, or any other cent amount. */
export const MIN_EXCHANGE_RATE_CENTS = 1;
/** $999.99 per 100 XP. Stops a typo from writing a huge rate. */
export const MAX_EXCHANGE_RATE_CENTS = 99_999;

export type CashInAmountError = "empty" | "not-whole" | "not-positive" | "over-balance";

export type CashInLockReason =
  | "checking"
  | "guest"
  | "class-seat"
  | "rate-missing"
  | "ready";

export type SpendSpendableXpError =
  | "invalid"
  | "over-balance"
  | "no-rate"
  | "duplicate"
  | "zero-payout"
  | "busy";

/** XP still available to cash in. This is the header and Vault number. */
export function readSpendableXp(wallet: { totalPoints: number } | null | undefined): number {
  const points = wallet?.totalPoints ?? 0;
  if (!Number.isFinite(points) || points <= 0) return 0;
  return Math.floor(points);
}

/** Lifetime XP. Leaderboards and class totals use this. Cash-in never reduces it. */
export function readLifetimeXp(
  wallet: { lifetimePointsEarned: number } | null | undefined,
): number {
  const points = wallet?.lifetimePointsEarned ?? 0;
  if (!Number.isFinite(points) || points <= 0) return 0;
  return Math.floor(points);
}

/**
 * Cents per 100 XP when a parent has saved a rate.
 * Prefers the stored cent amount. Older wallets fall back to the slider.
 */
export function resolveExchangeRateCents(
  wallet:
    | {
        xpExchangeRateSet?: boolean;
        exchangeRateCentsPer100Xp?: number | null;
        audSliderIndex?: number;
      }
    | null
    | undefined,
): number | null {
  if (!wallet?.xpExchangeRateSet) return null;
  const stored = wallet.exchangeRateCentsPer100Xp;
  if (
    typeof stored === "number" &&
    Number.isInteger(stored) &&
    stored >= MIN_EXCHANGE_RATE_CENTS &&
    stored <= MAX_EXCHANGE_RATE_CENTS
  ) {
    return stored;
  }
  if (typeof wallet.audSliderIndex === "number" && Number.isFinite(wallet.audSliderIndex)) {
    const cents = Math.round(audPerXpBlockFromSliderIndex(wallet.audSliderIndex) * 100);
    if (cents >= MIN_EXCHANGE_RATE_CENTS && cents <= MAX_EXCHANGE_RATE_CENTS) return cents;
  }
  return null;
}

/** "2", "2.00", "$3", "0.50" → integer cents. Anything else is rejected. */
export function parseExchangeRateToCents(raw: string): number | null {
  const trimmed = raw.trim().replace(/^\$/, "").replace(/,/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return null;
  const [whole, frac = ""] = trimmed.split(".");
  const cents = Number(whole) * 100 + Number((frac + "00").slice(0, 2));
  if (
    !Number.isSafeInteger(cents) ||
    cents < MIN_EXCHANGE_RATE_CENTS ||
    cents > MAX_EXCHANGE_RATE_CENTS
  ) {
    return null;
  }
  return cents;
}

export function formatExchangeRateInput(cents: number): string {
  const whole = Math.floor(cents / 100);
  const fraction = String(cents % 100).padStart(2, "0");
  return `${whole}.${fraction}`;
}

export function formatXpCashPreview(points: number, moneyLabel: string): string {
  return `${points.toLocaleString()} XP = ${moneyLabel}`;
}

export function validateCashInPoints(
  raw: string,
  spendableXp: number,
): { ok: true; points: number } | { ok: false; error: CashInAmountError } {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: false, error: "empty" };
  if (!/^\d+$/.test(trimmed)) return { ok: false, error: "not-whole" };
  const points = Number(trimmed);
  if (!Number.isSafeInteger(points) || points <= 0) {
    return { ok: false, error: "not-positive" };
  }
  const balance = Math.max(0, Math.floor(spendableXp));
  if (points > balance) return { ok: false, error: "over-balance" };
  return { ok: true, points };
}

export function cashInLockReason(input: {
  sessionReady: boolean;
  classStatusReady: boolean;
  isGuest: boolean;
  classAccountWithoutParent: boolean;
  rateSet: boolean;
}): CashInLockReason {
  if (!input.sessionReady) return "checking";
  if (input.isGuest) return "guest";
  if (!input.classStatusReady) return "checking";
  if (input.classAccountWithoutParent) return "class-seat";
  if (!input.rateSet) return "rate-missing";
  return "ready";
}

/** Second tap while a cash-in is saving does not start another one. */
export function beginCashInAttempt(state: { inFlight: boolean }):
  | { ok: true; state: { inFlight: true } }
  | { ok: false } {
  if (state.inFlight) return { ok: false };
  return { ok: true, state: { inFlight: true } };
}

export function endCashInAttempt(): { inFlight: false } {
  return { inFlight: false };
}

/**
 * Spend spendable XP at the saved rate.
 * Lifetime XP is copied through unchanged.
 */
export function spendSpendableXp(
  wallet: PersistedDashboardWallet,
  points: number,
  event: { id: string; at: string },
):
  | { ok: true; wallet: PersistedDashboardWallet; audCents: number; pointsClaimed: number }
  | { ok: false; error: SpendSpendableXpError } {
  const rate = resolveExchangeRateCents(wallet);
  if (rate == null) return { ok: false, error: "no-rate" };
  const checked = validateCashInPoints(String(Math.floor(points)), readSpendableXp(wallet));
  if (!checked.ok) {
    return {
      ok: false,
      error: checked.error === "over-balance" ? "over-balance" : "invalid",
    };
  }
  const lifetimeBefore = readLifetimeXp(wallet);
  const next = appendWalletLedgerEvent(wallet, {
    id: event.id,
    kind: "spend",
    points: checked.points,
    at: event.at,
  });
  if (!next) return { ok: false, error: "duplicate" };
  if (readLifetimeXp(next) !== lifetimeBefore) {
    return { ok: false, error: "invalid" };
  }
  const audCents = convertPointsToCents(checked.points, rate);
  if (audCents <= 0) return { ok: false, error: "zero-payout" };
  return { ok: true, wallet: next, audCents, pointsClaimed: checked.points };
}

export function withExchangeRate(
  wallet: PersistedDashboardWallet,
  centsPer100Xp: number,
  at: string,
): PersistedDashboardWallet {
  const cents = Math.floor(centsPer100Xp);
  return {
    ...wallet,
    xpExchangeRateSet: true,
    exchangeRateCentsPer100Xp: cents,
    exchangeRateUpdatedAt: at,
    audSliderIndex: sliderIndexFromAudPerXpBlock(cents / 100),
    updatedAt: at,
  };
}

function explicitRateTime(wallet: PersistedDashboardWallet): number | null {
  const raw = wallet.exchangeRateUpdatedAt;
  if (!raw) return null;
  const ms = Date.parse(raw);
  return Number.isFinite(ms) ? ms : null;
}

function rateSnapshot(wallet: PersistedDashboardWallet): Pick<
  PersistedDashboardWallet,
  | "xpExchangeRateSet"
  | "exchangeRateCentsPer100Xp"
  | "exchangeRateUpdatedAt"
  | "audSliderIndex"
> {
  const cents = resolveExchangeRateCents(wallet);
  return {
    xpExchangeRateSet: cents != null,
    exchangeRateCentsPer100Xp: cents,
    exchangeRateUpdatedAt: wallet.exchangeRateUpdatedAt ?? null,
    audSliderIndex: wallet.audSliderIndex,
  };
}

/**
 * A saved rate beats a wallet that has none, even if that wallet earned XP later.
 * Two saved rates: an explicit rate timestamp wins over a legacy slider whose
 * `updatedAt` moved because of an XP award. Otherwise the newer timestamp wins.
 */
export function pickExchangeRate(
  left: PersistedDashboardWallet,
  right: PersistedDashboardWallet,
): Pick<
  PersistedDashboardWallet,
  | "xpExchangeRateSet"
  | "exchangeRateCentsPer100Xp"
  | "exchangeRateUpdatedAt"
  | "audSliderIndex"
> {
  const leftCents = resolveExchangeRateCents(left);
  const rightCents = resolveExchangeRateCents(right);
  if (leftCents != null && rightCents == null) return rateSnapshot(left);
  if (leftCents == null && rightCents != null) return rateSnapshot(right);
  if (leftCents == null && rightCents == null) {
    const leftAt = left.updatedAt ? Date.parse(left.updatedAt) : Number.NaN;
    const rightAt = right.updatedAt ? Date.parse(right.updatedAt) : Number.NaN;
    if (Number.isFinite(leftAt) && Number.isFinite(rightAt) && leftAt !== rightAt) {
      return rateSnapshot(leftAt > rightAt ? left : right);
    }
    return rateSnapshot(right);
  }

  const leftExplicit = explicitRateTime(left);
  const rightExplicit = explicitRateTime(right);
  if (leftExplicit != null && rightExplicit == null) return rateSnapshot(left);
  if (rightExplicit != null && leftExplicit == null) return rateSnapshot(right);
  if (leftExplicit != null && rightExplicit != null && leftExplicit !== rightExplicit) {
    return rateSnapshot(leftExplicit > rightExplicit ? left : right);
  }

  const leftAt = left.updatedAt ? Date.parse(left.updatedAt) : Number.NaN;
  const rightAt = right.updatedAt ? Date.parse(right.updatedAt) : Number.NaN;
  if (Number.isFinite(leftAt) && Number.isFinite(rightAt) && leftAt !== rightAt) {
    return rateSnapshot(leftAt > rightAt ? left : right);
  }
  return rateSnapshot(right);
}

/** Add integer cents onto a dollar balance without binary float drift. */
export function addCentsToDollars(currentDollars: number, addCents: number): number {
  const add = Math.floor(addCents);
  if (!Number.isFinite(add) || add <= 0) {
    return centsToDollars(dollarsToCents(currentDollars));
  }
  return centsToDollars(dollarsToCents(currentDollars) + add);
}

/**
 * Move the whole cash bucket into jars.
 * The split must use every cent, matching the Vault assign rule.
 */
export function planCashBucketAssignment(input: {
  cashDollars: number;
  allocations: Record<string, number>;
}):
  | { ok: true; remainingDollars: number; allocations: Record<string, number> }
  | { ok: false; reason: "empty" | "mismatch" } {
  const cashCents = dollarsToCents(input.cashDollars);
  if (cashCents <= 0) return { ok: false, reason: "empty" };

  let sum = 0;
  const allocations: Record<string, number> = {};
  for (const [id, amount] of Object.entries(input.allocations)) {
    const cents = dollarsToCents(amount);
    if (cents <= 0) continue;
    sum += cents;
    allocations[id] = centsToDollars(cents);
  }
  if (sum !== cashCents) return { ok: false, reason: "mismatch" };
  return { ok: true, remainingDollars: 0, allocations };
}
