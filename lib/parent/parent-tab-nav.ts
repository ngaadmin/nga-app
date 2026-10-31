import type { DashboardNavLinkItem } from "@/lib/dashboard/navigation";
import { ParentTabIcon } from "@/lib/dashboard/icons";
import { PARENT_TAB_HREF } from "@/lib/parent/parent-tab-eligibility";

/** Sixth bottom tab. Only added when the server says the parent is eligible. */
export const PARENT_TAB_NAV_ITEM: DashboardNavLinkItem = {
  id: "parent",
  label: "Parent",
  href: PARENT_TAB_HREF,
  Icon: ParentTabIcon,
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
