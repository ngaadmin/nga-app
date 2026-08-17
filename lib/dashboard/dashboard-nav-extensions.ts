import { ADVANCED_MONEY_TOOLS_NAV_ITEM } from "@/lib/dashboard/advanced-money-tools/nav";
import type { DashboardNavLinkItem } from "@/lib/dashboard/navigation";
import { filterDashboardNavForFeatureFlags } from "@/lib/dashboard/navigation";

/**
 * Primary chrome nav. Advanced Money is injected only after a testing
 * premium unlock — it stays a separate destination, not a Vault section.
 */
export function withDashboardNavExtensions(
  items: readonly DashboardNavLinkItem[],
  options: { advancedMoneyUnlocked?: boolean } = {},
): DashboardNavLinkItem[] {
  const filtered = filterDashboardNavForFeatureFlags(items);
  return withAdvancedMoneyToolsNavItem(
    filtered,
    options.advancedMoneyUnlocked === true,
  );
}

export function withAdvancedMoneyToolsNavItem(
  items: readonly DashboardNavLinkItem[],
  unlocked: boolean,
): DashboardNavLinkItem[] {
  if (!unlocked) return [...items];
  if (items.some((item) => item.id === ADVANCED_MONEY_TOOLS_NAV_ITEM.id)) {
    return [...items];
  }

  const next = [...items];
  const settingsIndex = next.findIndex((item) => item.id === "settings");
  next.splice(
    settingsIndex === -1 ? next.length : settingsIndex,
    0,
    ADVANCED_MONEY_TOOLS_NAV_ITEM,
  );
  return next;
}
