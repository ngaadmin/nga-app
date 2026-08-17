import type { DashboardNavLinkItem } from "@/lib/dashboard/navigation";
import { filterDashboardNavForFeatureFlags } from "@/lib/dashboard/navigation";

/**
 * Primary chrome nav. Advanced Money is a premium Vault destination,
 * not a free main tab — see `ADVANCED_MONEY_TOOLS_HREF`.
 */
export function withDashboardNavExtensions(
  items: readonly DashboardNavLinkItem[],
): DashboardNavLinkItem[] {
  return filterDashboardNavForFeatureFlags(items);
}
