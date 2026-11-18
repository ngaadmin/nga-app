import { withDashboardNavExtensions } from "@/lib/dashboard/dashboard-nav-extensions";
import {
  DASHBOARD_NAV_ITEMS,
  type DashboardNavLinkItem,
} from "@/lib/dashboard/navigation";
import type { UserSession } from "@/lib/onboarding/guest-session";
import { launchpadLearnerMayEnterProfile } from "@/lib/launchpad/learner-access";
import {
  parentBottomBarItems,
  withParentTabNavItem,
} from "@/lib/parent/parent-tab-nav";

export type DashboardNavAudience = "child" | "parent" | "teacher" | "guest";

/** Launchpad is a learner route. Parents, teachers, and guests do not see the tab. */
export function dashboardNavAudience(session: UserSession | null): DashboardNavAudience {
  if (!session || session.accessMode !== "registered") return "guest";
  if (session.accountRole === "parent_master") return "parent";
  if (session.accountRole === "teacher" || session.isTeacher) return "teacher";
  if (session.accountRole === "child") return "child";
  return "guest";
}

/**
 * The one list both the phone bottom bar and the desktop sidebar render, so
 * they can't drift apart. An active child sees Launchpad. A pending or
 * declined child, a parent, a teacher, or a guest does not. A parent sees
 * Academy, Vault, Community, Subscription. Settings and the Parent Hub open
 * from the avatar menu.
 */
export function dashboardNavItemsFor(options: {
  advancedMoneyUnlocked?: boolean;
  parentTabEligible: boolean;
  isParentProfile: boolean;
  audience?: DashboardNavAudience;
  /** profiles.account_status, or the session lifecycle value (ACTIVE, …). */
  accountStatus?: string | null;
}): DashboardNavLinkItem[] {
  const base = withParentTabNavItem(
    withDashboardNavExtensions(DASHBOARD_NAV_ITEMS, {
      advancedMoneyUnlocked: options.advancedMoneyUnlocked,
    }),
    options.parentTabEligible,
  );
  const items = parentBottomBarItems(base, options.isParentProfile);
  const audience = options.audience ?? (options.isParentProfile ? "parent" : "child");
  const showLaunchpad =
    audience === "child" &&
    launchpadLearnerMayEnterProfile({
      accountRole: "child",
      accountStatus: options.accountStatus,
    });
  if (showLaunchpad) return items;
  return items.filter((item) => item.id !== "launchpad");
}
