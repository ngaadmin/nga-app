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
