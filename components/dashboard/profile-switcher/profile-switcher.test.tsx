// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { cleanup, render } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ProfileSwitcherMenu } from "@/components/dashboard/profile-switcher/profile-switcher";
import type { HouseholdProfiles } from "@/lib/profile-switcher/household-profiles";

afterEach(cleanup);

function renderMenu(props: {
  household: HouseholdProfiles | null;
  isParent?: boolean;
  loading?: boolean;
}) {
  const anchor = document.createElement("button");
  document.body.appendChild(anchor);
  const anchorRef = createRef<HTMLElement>() as { current: HTMLElement | null };
  anchorRef.current = anchor;
  return render(
    <ProfileSwitcherMenu
      open
      anchorRef={anchorRef}
      household={props.household}
      loading={props.loading}
      currentAvatarId={null}
      onClose={vi.fn()}
      onViewProfile={vi.fn()}
      onOpenSettings={vi.fn()}
      onOpenParentHub={props.isParent ? vi.fn() : undefined}
      isParent={props.isParent}
    />,
  );
}

const childHousehold: HouseholdProfiles = {
  currentUserId: "c1",
  profiles: [
    { userId: "c1", name: "Amy", role: "child", cohort: "explorer", isCurrent: true },
    { userId: "p1", name: "Sam", role: "parent", cohort: null, isCurrent: false },
  ],
};

describe("ProfileSwitcherMenu: no parent-to-child switching", () => {
  it("a parent gets View my profile, Settings and Parent Hub, with no child rows", () => {
    renderMenu({
      isParent: true,
      household: {
        currentUserId: "p1",
        profiles: [
          { userId: "p1", name: "Sam", role: "parent", cohort: null, isCurrent: true },
          // Even if a stale client ever held a child row, it is not shown.
          { userId: "c1", name: "Amy", role: "child", cohort: "explorer", isCurrent: false },
        ],
        linkedChildCount: 2,
      },
    });
    const menu = document.querySelector("[data-profile-switcher-menu]");
    expect(menu).toBeTruthy();
    expect(menu?.querySelector("[data-profile-switcher-view-profile]")).toBeTruthy();
    expect(menu?.textContent).toContain("Settings");
    expect(menu?.textContent).toContain("Parent Hub");
    expect(menu?.textContent).toContain("Approvals and your children's progress");
    expect(menu?.querySelector("[data-profile-switcher-list]")).toBeNull();
    expect(menu?.querySelector("[data-profile-switcher-row]")).toBeNull();
    expect(menu?.querySelector("[data-profile-switcher-soon-note]")).toBeNull();
    expect(menu?.textContent).not.toMatch(/switch profile/i);
    expect(menu?.textContent).not.toContain("Amy");
  });

  it("a parent never sees a loading profile list either", () => {
    renderMenu({ isParent: true, household: null, loading: true });
    expect(document.querySelector("[data-profile-switcher-loading]")).toBeNull();
    expect(document.body.textContent).not.toMatch(/switch profile/i);
  });

  it("a child's menu is unchanged: their own row and their parent's", () => {
    renderMenu({ household: childHousehold });
    expect(document.querySelectorAll("[data-profile-switcher-row]").length).toBe(2);
    expect(document.body.textContent).toMatch(/switch profile/i);
  });

  it("the top-bar header never shows the switch tip to a parent", () => {
    const source = readFileSync("components/dashboard/dashboard-status-header.tsx", "utf8");
    expect(source).toContain("household && tipVisible && !isParent");
  });
});
