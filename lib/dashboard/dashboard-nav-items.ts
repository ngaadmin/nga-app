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

/** Launchpad shows for learners, parents, and guests. Teachers do not see the tab. */
export function dashboardNavAudience(session: UserSession | null): DashboardNavAudience {
  if (!session || session.accessMode !== "registered") return "guest";
  if (session.accountRole === "parent_master") return "parent";
  if (session.accountRole === "teacher" || session.isTeacher) return "teacher";
  if (session.accountRole === "child") return "child";
  return "guest";
}

/**
 * The one list both the phone bottom bar and the desktop sidebar render, so
 * they can't drift apart. An active child sees Launchpad. A guest sees it too
 * and can look around and play Level 1 (the page asks them to create an
 * account to go further). A pending or declined child, or a teacher, does not
 * see the tab. A parent sees Academy, Launchpad, Vault, Community,
 * Subscription. Settings and the Parent Hub open from the avatar menu.
 */
export function dashboardNavItemsFor(options: {
  advancedMoneyUnlocked?: boolean;
  parentTabEligible: boolean;
  isParentProfile: boolean;
  audience?: DashboardNavAudience;
  /** profiles.account_status, or the session lifecycle value (ACTIVE, …). */
  accountStatus?: string | null;
  /**
   * When false, the session has not been read yet, so the guest tab is not
   * shown (avoids a flash for signed-in users). Omit or true otherwise.
   */
  sessionReady?: boolean;
}): DashboardNavLinkItem[] {
  const base = withParentTabNavItem(
    withDashboardNavExtensions(DASHBOARD_NAV_ITEMS, {
      advancedMoneyUnlocked: options.advancedMoneyUnlocked,
    }),
    options.parentTabEligible,
  );
  const items = parentBottomBarItems(base, options.isParentProfile);
  const audience = options.audience ?? (options.isParentProfile ? "parent" : "child");
  // A parent keeps Launchpad on their bar (the five tabs approved on 2 Nov).
  // A child sees it only once their account is active. Teachers, and children
  // who are pending or declined, do not.
  const showLaunchpad =
    audience === "parent" ||
    (audience === "child" &&
      launchpadLearnerMayEnterProfile({
        accountRole: "child",
        accountStatus: options.accountStatus,
      }));
  if (showLaunchpad) return items;
  if (audience === "guest" && options.sessionReady !== false) return items;
  return items.filter((item) => item.id !== "launchpad");
}
