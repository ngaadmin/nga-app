import type { DashboardNavLinkItem } from "@/lib/dashboard/navigation";
import { withAdvancedMoneyToolsNavItem } from "@/lib/dashboard/advanced-money-tools/nav";

export function withDashboardNavExtensions(
  items: readonly DashboardNavLinkItem[],
): DashboardNavLinkItem[] {
  return withAdvancedMoneyToolsNavItem(items);
}
