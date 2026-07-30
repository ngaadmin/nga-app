import { VaultIcon } from "@/lib/dashboard/icons";
import type { DashboardNavLinkItem } from "@/lib/dashboard/navigation";
import { vaultV2Copy } from "@/lib/dashboard/vault-v2/copy";

/** Temporary beta nav entry — remove with Vault V2 cutover. */
export const VAULT_V2_BETA_NAV_ITEM: DashboardNavLinkItem = {
  id: "vault-v2-beta",
  label: vaultV2Copy.betaNavLabel,
  href: "/dashboard/vault-v2",
  Icon: VaultIcon,
  matchesPath: (pathname) =>
    pathname === "/dashboard/vault-v2" || pathname.startsWith("/dashboard/vault-v2/"),
};

export const VAULT_V2_BETA_HREF = VAULT_V2_BETA_NAV_ITEM.href;

function isLiveVaultNavActive(pathname: string): boolean {
  return pathname === "/dashboard/vault" || pathname.startsWith("/dashboard/vault/");
}

/** Inserts the temporary Vault V2 link immediately after The Vault. */
export function withVaultV2BetaNavItem(
  items: readonly DashboardNavLinkItem[],
): DashboardNavLinkItem[] {
  const next: DashboardNavLinkItem[] = [];

  for (const item of items) {
    if (item.id === "vault") {
      next.push({
        ...item,
        matchesPath: isLiveVaultNavActive,
      });
    } else {
      next.push(item);
    }

    if (item.id === "vault") {
      next.push(VAULT_V2_BETA_NAV_ITEM);
    }
  }

  return next;
}
