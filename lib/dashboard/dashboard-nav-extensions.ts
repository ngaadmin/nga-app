import type { DashboardNavLinkItem } from "@/lib/dashboard/navigation";
import { withAdvancedMoneyToolsNavItem } from "@/lib/dashboard/advanced-money-tools/nav";
import { withVaultV2BetaNavItem } from "@/lib/dashboard/vault-v2/beta-nav";

export function withDashboardNavExtensions(
  items: readonly DashboardNavLinkItem[],
): DashboardNavLinkItem[] {
  return withAdvancedMoneyToolsNavItem(withVaultV2BetaNavItem(items));
}
