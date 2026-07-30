import { TrendingUpIcon } from "@/lib/dashboard/icons";
import type { DashboardNavLinkItem } from "@/lib/dashboard/navigation";
import { advancedMoneyToolsCopy } from "@/lib/dashboard/advanced-money-tools/copy";

export const ADVANCED_MONEY_TOOLS_NAV_ITEM: DashboardNavLinkItem = {
  id: "advanced-money-tools",
  label: advancedMoneyToolsCopy.navLabel,
  href: "/dashboard/advanced-money-tools",
  Icon: TrendingUpIcon,
  matchesPath: (pathname) =>
    pathname === "/dashboard/advanced-money-tools" ||
    pathname.startsWith("/dashboard/advanced-money-tools/"),
};

export const ADVANCED_MONEY_TOOLS_HREF = ADVANCED_MONEY_TOOLS_NAV_ITEM.href;

/** Inserts Advanced Money Tools after the Vault V2 beta entry when present, otherwise after The Vault. */
export function withAdvancedMoneyToolsNavItem(
  items: readonly DashboardNavLinkItem[],
): DashboardNavLinkItem[] {
  const next: DashboardNavLinkItem[] = [];

  for (const item of items) {
    next.push(item);

    if (item.id === "vault-v2-beta" || item.id === "vault") {
      const alreadyAdded = next.some((entry) => entry.id === "advanced-money-tools");
      if (!alreadyAdded && item.id === "vault-v2-beta") {
        next.push(ADVANCED_MONEY_TOOLS_NAV_ITEM);
      } else if (!alreadyAdded && item.id === "vault") {
        const hasVaultV2Beta = items.some((entry) => entry.id === "vault-v2-beta");
        if (!hasVaultV2Beta) {
          next.push(ADVANCED_MONEY_TOOLS_NAV_ITEM);
        }
      }
    }
  }

  return next;
}
