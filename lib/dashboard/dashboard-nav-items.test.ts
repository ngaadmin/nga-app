import { describe, expect, it } from "vitest";
import { dashboardNavItemsFor } from "@/lib/dashboard/dashboard-nav-items";
import {
  isNavItemActive,
  type DashboardNavLinkItem,
} from "@/lib/dashboard/navigation";

const ids = (items: DashboardNavLinkItem[]) => items.map((item) => item.id);
const active = (items: DashboardNavLinkItem[], pathname: string) =>
  items
    .filter((item) =>
      item.matchesPath ? item.matchesPath(pathname) : isNavItemActive(pathname, item.href),
    )
    .map((item) => item.id);

describe("dashboardNavItemsFor (phone bar and desktop sidebar)", () => {
  const parent = dashboardNavItemsFor({ parentTabEligible: true, isParentProfile: true, audience: "parent" });
  const child = dashboardNavItemsFor({
    parentTabEligible: false,
    isParentProfile: false,
    audience: "child",
    accountStatus: "ACTIVE",
  });

  it("gives the parent Academy, Vault, Community, Subscription", () => {
    expect(ids(parent)).toEqual(["academy", "vault", "community", "subscription"]);
    expect(parent.at(-1)?.label).toBe("Subscription");
    expect(ids(parent)).not.toContain("launchpad");
  });

  it("drops Parent and Settings for the parent even before eligibility loads", () => {
    const loading = dashboardNavItemsFor({ parentTabEligible: false, isParentProfile: true, audience: "parent" });
    expect(ids(loading)).toEqual(ids(parent));
  });

  it("keeps Launchpad for a child and hides it from a teacher", () => {
    expect(ids(child)).toEqual(["academy", "launchpad", "vault", "community", "settings"]);
    expect(child.find((item) => item.id === "launchpad")?.locked).toBeFalsy();
    const teacher = dashboardNavItemsFor({ parentTabEligible: false, isParentProfile: false, audience: "teacher" });
    expect(ids(teacher)).not.toContain("launchpad");
    const eligibleNonParent = dashboardNavItemsFor({
      parentTabEligible: true,
      isParentProfile: false,
      audience: "child",
      accountStatus: "active",
    });
    expect(ids(eligibleNonParent)).toContain("settings");
    expect(ids(eligibleNonParent)).toContain("launchpad");
  });

  it("hides Launchpad from a pending or declined child", () => {
    const pending = dashboardNavItemsFor({
      parentTabEligible: false,
      isParentProfile: false,
      audience: "child",
      accountStatus: "PENDING_CONSENT",
    });
    const declined = dashboardNavItemsFor({
      parentTabEligible: false,
      isParentProfile: false,
      audience: "child",
      accountStatus: "declined",
    });
    expect(ids(pending)).not.toContain("launchpad");
    expect(ids(declined)).not.toContain("launchpad");
    expect(ids(pending)).toContain("academy");
  });

  it("shows guests a locked Launchpad tab that does not navigate to the route", () => {
    const guest = dashboardNavItemsFor({
      parentTabEligible: false,
      isParentProfile: false,
      audience: "guest",
    });
    const launchpad = guest.find((item) => item.id === "launchpad");
    expect(ids(guest)).toEqual(["academy", "launchpad", "vault", "community", "settings"]);
    expect(launchpad?.locked).toBe(true);
    expect(launchpad?.href).toBe("/dashboard/launchpad");
  });

  it("hides Launchpad until the session is ready, so signed-in users do not see a guest lock flash", () => {
    const loading = dashboardNavItemsFor({
      parentTabEligible: false,
      isParentProfile: false,
      audience: "guest",
      sessionReady: false,
    });
    expect(ids(loading)).not.toContain("launchpad");
  });

  it("highlights nothing for the parent on Hub and Settings pages", () => {
    for (const path of [
      "/dashboard/parent",
      "/dashboard/settings",
      "/dashboard/settings/data-privacy",
      "/dashboard/settings/my-account",
    ]) {
      expect(active(parent, path)).toEqual([]);
    }
  });

  it("highlights only Subscription on the Subscription screen", () => {
    expect(active(parent, "/dashboard/settings/subscription")).toEqual(["subscription"]);
    expect(active(parent, "/dashboard/academy")).toEqual(["academy"]);
  });
});
