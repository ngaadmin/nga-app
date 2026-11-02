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
  const parent = dashboardNavItemsFor({ parentTabEligible: true, isParentProfile: true });
  const child = dashboardNavItemsFor({ parentTabEligible: false, isParentProfile: false });

  it("gives the parent Academy, Launchpad, Vault, Community, Subscription", () => {
    expect(ids(parent)).toEqual(["academy", "launchpad", "vault", "community", "subscription"]);
    expect(parent.at(-1)?.label).toBe("Subscription");
  });

  it("drops Parent and Settings for the parent even before eligibility loads", () => {
    const loading = dashboardNavItemsFor({ parentTabEligible: false, isParentProfile: true });
    expect(ids(loading)).toEqual(ids(parent));
  });

  it("leaves child and guest lists unchanged", () => {
    expect(ids(child)).toEqual(["academy", "launchpad", "vault", "community", "settings"]);
    const eligibleNonParent = dashboardNavItemsFor({
      parentTabEligible: true,
      isParentProfile: false,
    });
    expect(ids(eligibleNonParent)).toContain("settings");
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
