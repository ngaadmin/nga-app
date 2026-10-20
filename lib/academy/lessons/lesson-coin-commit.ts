import {
  appendWalletLedgerEvent,
  type PersistedDashboardWallet,
} from "@/lib/dashboard/dashboard-wallet-storage";

export type LessonCashInOutcome =
  | { ok: true; balance: number }
  | { ok: false };

type AwardInput = {
  id: string;
  points: number;
};

/**
 * When this lesson's coins are in the ledger but missing from the spendable
 * total, put them back. A recorded spend is left alone so a Vault cash-in
 * is not undone. Repair does not add a second payout.
 */
export function repairUnspentEarnBalance(
  wallet: PersistedDashboardWallet,
): PersistedDashboardWallet {
  const ledger = wallet.ledger ?? [];
  if (ledger.length === 0) return wallet;
  if (ledger.some((event) => event.kind === "spend")) return wallet;

  const earned = ledger.reduce(
    (sum, event) => sum + (event.kind === "earn" ? event.points : 0),
    0,
  );
  const lifetimePointsEarned = Math.max(wallet.lifetimePointsEarned, earned);
  const totalPoints = Math.max(
    wallet.totalPoints,
    Math.min(lifetimePointsEarned, earned),
  );
  if (
    lifetimePointsEarned === wallet.lifetimePointsEarned &&
    totalPoints === wallet.totalPoints
  ) {
    return wallet;
  }
  return {
    ...wallet,
    lifetimePointsEarned,
    totalPoints,
  };
}

/**
 * Append this lesson's earn rows. An id that is already stored does not pay
 * again. Returns only the points inserted this call, so a repair is not
 * counted as a second award.
 */
export function applyLessonCoinAward(
  wallet: PersistedDashboardWallet,
  events: readonly AwardInput[],
  at: string,
): { wallet: PersistedDashboardWallet; awarded: number } {
  let next = wallet;
  let awarded = 0;
  for (const event of events) {
    const points = Math.floor(event.points);
    if (!Number.isFinite(points) || points <= 0 || !event.id.trim()) continue;
    const appended = appendWalletLedgerEvent(next, {
      id: event.id.trim(),
      kind: "earn",
      points,
      at,
    });
    if (!appended) continue;
    next = appended;
    awarded += points;
  }
  return { wallet: repairUnspentEarnBalance(next), awarded };
}

/**
 * Guest coins stay on this device. Signed-in learners and class seats need
 * the account save as well, unless a parent still has to approve the account.
 */
export function lessonCashInNeedsRetry(input: {
  accessMode: "guest" | "registered" | null | undefined;
  pendingConsent: boolean;
  localOk: boolean;
  cloudOk: boolean;
}): boolean {
  if (!input.localOk) return true;
  if (input.accessMode === "registered" && !input.pendingConsent && !input.cloudOk) {
    return true;
  }
  return false;
}
