import {
  hasAccountSeenVaultAddMoneyIntro,
  markAccountVaultAddMoneyIntroSeen,
} from "@/lib/dashboard/page-intro-seen";

/** Legacy session key — wiped on logout. */
export const VAULT_ADD_MONEY_INTRO_SEEN_KEY = "nga_vault_add_money_intro_seen_v1";

export function hasSeenVaultAddMoneyIntro(): boolean {
  if (typeof window === "undefined") return true;
  return hasAccountSeenVaultAddMoneyIntro();
}

export function markVaultAddMoneyIntroSeen(): void {
  markAccountVaultAddMoneyIntroSeen();
}
