import { readPersisted, writePersisted } from "@/lib/dev/client-persist";

export const VAULT_ADD_MONEY_INTRO_SEEN_KEY = "nga_vault_add_money_intro_seen_v1";

export function hasSeenVaultAddMoneyIntro(): boolean {
  if (typeof window === "undefined") return true;
  return readPersisted(VAULT_ADD_MONEY_INTRO_SEEN_KEY) === "1";
}

export function markVaultAddMoneyIntroSeen(): void {
  writePersisted(VAULT_ADD_MONEY_INTRO_SEEN_KEY, "1");
}
