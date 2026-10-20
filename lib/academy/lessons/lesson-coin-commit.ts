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
 * When earned coins are in the ledger but missing from the spendable total,
 * put the missing amount back. Vault spends stay spent: the floor is
 * ledger earns minus ledger spends, not the gap implied by a wiped total.
 * Repair does not add a second payout.
 */
export function repairUnspentEarnBalance(
  wallet: PersistedDashboardWallet,
): PersistedDashboardWallet {
  const ledger = wallet.ledger ?? [];
  if (ledger.length === 0) return wallet;

  let earned = 0;
  let spent = 0;
  for (const event of ledger) {
    if (event.kind === "earn") earned += event.points;
    else if (event.kind === "spend") spent += event.points;
  }

  const lifetimePointsEarned = Math.max(wallet.lifetimePointsEarned, earned);
  const totalPoints = Math.max(wallet.totalPoints, Math.max(0, earned - spent));
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
