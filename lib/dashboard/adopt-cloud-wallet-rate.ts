"use client";

import { mergeWalletProgress } from "@/lib/dashboard/account-progress";
import { dispatchAccountProgressRestored } from "@/lib/dashboard/account-progress-dirty";
import {
  defaultDashboardWalletState,
  readDashboardWalletState,
  saveDashboardWalletState,
} from "@/lib/dashboard/dashboard-wallet-storage";
import { loadCurrentLearnerProgress } from "@/lib/onboarding/learner-progress";
import { readUserSession } from "@/lib/onboarding/guest-session";
import {
  resolveExchangeRateCents,
  withFreshestExchangeRate,
} from "@/lib/dashboard/xp-cash";

/**
 * Pull a parent-saved rate (and the merged XP wallet) onto this device.
 * Safe to call when cash-in opens. A failure leaves the local wallet as it is.
 */
export async function adoptCloudWalletRate(): Promise<void> {
  const session = readUserSession();
  if (session?.accessMode !== "registered") return;

  try {
    const remote = await loadCurrentLearnerProgress();
    const remoteWallet = remote?.wallet;
    if (!remoteWallet) return;

    const local = readDashboardWalletState() ?? defaultDashboardWalletState();
    const merged = mergeWalletProgress(local, remoteWallet);
    if (!merged) return;

    const unchanged =
      merged.xpExchangeRateSet === local.xpExchangeRateSet &&
      (merged.exchangeRateCentsPer100Xp ?? null) ===
        (local.exchangeRateCentsPer100Xp ?? null) &&
      (merged.cashInOwedResetAt ?? null) === (local.cashInOwedResetAt ?? null) &&
      merged.totalPoints === local.totalPoints &&
      merged.lifetimePointsEarned === local.lifetimePointsEarned &&
      (merged.ledger?.length ?? 0) === (local.ledger?.length ?? 0);
    if (unchanged) return;

    saveDashboardWalletState(merged);
    dispatchAccountProgressRestored();
  } catch {
    // Opening cash-in still uses the rate already stored on this device.
  }
}

export type FreshCashInRate =
  | { ok: true; centsPer100: number | null }
  | { ok: false };

/**
 * Re-read the parent-saved rate at cash-in time.
 * A failure does not fall back to the rate already on this device.
 */
export async function refreshCashInRateFromCloud(): Promise<FreshCashInRate> {
  const session = readUserSession();
  if (session?.accessMode !== "registered") {
    return { ok: true, centsPer100: null };
  }

  try {
    const remote = await loadCurrentLearnerProgress();
    const remoteWallet = remote?.wallet;
    if (!remoteWallet) return { ok: false };

    const local = readDashboardWalletState() ?? defaultDashboardWalletState();
    const next = withFreshestExchangeRate(local, remoteWallet);
    const centsPer100 = resolveExchangeRateCents(next);
    const unchanged =
      next.xpExchangeRateSet === local.xpExchangeRateSet &&
      (next.exchangeRateCentsPer100Xp ?? null) ===
        (local.exchangeRateCentsPer100Xp ?? null) &&
      (next.exchangeRateUpdatedAt ?? null) === (local.exchangeRateUpdatedAt ?? null);
    if (!unchanged) {
      saveDashboardWalletState(next);
      dispatchAccountProgressRestored();
    }
    return { ok: true, centsPer100 };
  } catch {
    return { ok: false };
  }
}
