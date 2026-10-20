"use client";

import { defaultAcademyMilestones, saveAcademyMilestones } from "@/lib/dashboard/academy-progress-storage";
import { dispatchAccountProgressRestored } from "@/lib/dashboard/account-progress-dirty";
import { resetDashboardWalletForCurrentAccount } from "@/lib/dashboard/dashboard-wallet-storage";
import { PRACTICE_RECORDED_EVENT } from "@/lib/dashboard/streak-practice";
import { clearAllVaultStorage } from "@/lib/dashboard/vault/vault-profile-storage";
import { clearGuestProgressFromStores } from "@/lib/privacy/clear-guest-progress";

/** Clears guest lessons, coins, lifetime XP, medals and Vault on this device. */
export function clearGuestDeviceProgress(): void {
  if (typeof window === "undefined") return;
  clearGuestProgressFromStores(window.sessionStorage, window.localStorage);
  clearAllVaultStorage();
  saveAcademyMilestones(defaultAcademyMilestones());
  resetDashboardWalletForCurrentAccount();
  dispatchAccountProgressRestored();
  window.dispatchEvent(new CustomEvent(PRACTICE_RECORDED_EVENT));
}
