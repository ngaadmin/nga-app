import type { DashboardNavLinkItem } from "@/lib/dashboard/navigation";
import { ParentHubTabIconA, SubscriptionTabIconA } from "@/lib/dashboard/tab-icons-a";
import { PARENT_TAB_HREF } from "@/lib/parent/parent-tab-eligibility";

/** Same path as DASHBOARD_SETTINGS_SUBSCRIPTION_PATH (kept local: client bundle). */
const DASHBOARD_SETTINGS_SUBSCRIPTION_PATH = "/dashboard/settings/subscription";

/**
 * Sixth bottom tab, labeled "Parent", that opens the Parent Hub. Only added
 * when the server says the parent is eligible.
 */
export const PARENT_TAB_NAV_ITEM: DashboardNavLinkItem = {
  id: "parent",
  label: "Parent",
  href: PARENT_TAB_HREF,
  Icon: ParentHubTabIconA,
  matchesPath: (pathname) =>
    pathname === PARENT_TAB_HREF || pathname.startsWith(`${PARENT_TAB_HREF}/`),
};

/** Parent goes last, after Settings, as in the r5 design. */
export function withParentTabNavItem(
  items: readonly DashboardNavLinkItem[],
  eligible: boolean,
): DashboardNavLinkItem[] {
  if (!eligible || items.some((item) => item.id === PARENT_TAB_NAV_ITEM.id)) {
    return [...items];
  }
  return [...items, PARENT_TAB_NAV_ITEM];
}

/** Subscription tab on the parent bar: the existing Subscription screen. */
export const SUBSCRIPTION_TAB_NAV_ITEM: DashboardNavLinkItem = {
  id: "subscription",
  label: "Subscription",
  href: DASHBOARD_SETTINGS_SUBSCRIPTION_PATH,
  Icon: SubscriptionTabIconA,
  matchesPath: (pathname) =>
    pathname === DASHBOARD_SETTINGS_SUBSCRIPTION_PATH ||
    pathname.startsWith(`${DASHBOARD_SETTINGS_SUBSCRIPTION_PATH}/`),
};

/**
 * Parent profile only: the bottom bar reads Academy, Launchpad, Vault,
 * Community, Subscription. Settings and the Parent Hub are off the bar; both
 * open from the avatar menu (the Hub behind the Parent PIN every time), and
 * their routes still work. Child and guest bars come back unchanged.
 */
export function parentBottomBarItems(
  items: readonly DashboardNavLinkItem[],
  isParentProfile: boolean,
): DashboardNavLinkItem[] {
  if (!isParentProfile) return [...items];
  return [
    ...items.filter(
      (item) =>
        item.id !== "settings" &&
        item.id !== PARENT_TAB_NAV_ITEM.id &&
        item.id !== SUBSCRIPTION_TAB_NAV_ITEM.id,
    ),
    SUBSCRIPTION_TAB_NAV_ITEM,
  ];
}
