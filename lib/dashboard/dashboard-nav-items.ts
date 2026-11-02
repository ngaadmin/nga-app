import { withDashboardNavExtensions } from "@/lib/dashboard/dashboard-nav-extensions";
import {
  DASHBOARD_NAV_ITEMS,
  type DashboardNavLinkItem,
} from "@/lib/dashboard/navigation";
import {
  parentBottomBarItems,
  withParentTabNavItem,
} from "@/lib/parent/parent-tab-nav";

/**
 * The one list both the phone bottom bar and the desktop sidebar render, so
 * they can't drift apart. Parent profile: Academy, Launchpad, Vault,
 * Community, Subscription (Settings and the Parent Hub open from the avatar
 * menu). Child and guest lists are unchanged.
 */
export function dashboardNavItemsFor(options: {
  advancedMoneyUnlocked?: boolean;
  parentTabEligible: boolean;
  isParentProfile: boolean;
}): DashboardNavLinkItem[] {
  const base = withParentTabNavItem(
    withDashboardNavExtensions(DASHBOARD_NAV_ITEMS, {
      advancedMoneyUnlocked: options.advancedMoneyUnlocked,
    }),
    options.parentTabEligible,
  );
  return parentBottomBarItems(base, options.isParentProfile);
}
