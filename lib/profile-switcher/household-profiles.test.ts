import { describe, expect, it } from "vitest";
import {
  PROFILE_SWITCHING_AVAILABLE,
  buildHouseholdProfiles,
  type HouseholdProfileRow,
} from "@/lib/profile-switcher/household-profiles";
import { mergePageIntroFlags } from "@/lib/dashboard/page-intro-flags";
import { parsePageIntroSeenStore } from "@/lib/dashboard/page-intro-seen";

const parent: HouseholdProfileRow = {
  id: "p1",
  username: "qaparent",
  account_role: "parent_master",
  account_status: "active",
  curriculum_cohort: null,
};
const kid = (
  id: string,
  username: string,
  cohort: string,
  status = "active",
): HouseholdProfileRow => ({
  id,
  username,
  account_role: "child",
  account_status: status,
  curriculum_cohort: cohort,
});

describe("buildHouseholdProfiles", () => {
  it("lists the parent first, then active children by name, current marked", () => {
    const result = buildHouseholdProfiles({
      currentUserId: "p1",
      parent,
      children: [kid("c2", "zed", "pathfinder"), kid("c1", "amy", "explorer")],
    });
    expect(result?.profiles.map((p) => [p.name, p.role, p.isCurrent])).toEqual([
      ["qaparent", "parent", true],
      ["amy", "child", false],
      ["zed", "child", false],
    ]);
    expect(result?.profiles[1]?.cohort).toBe("explorer");
  });

  it("marks the child as current when a child is signed in", () => {
    const result = buildHouseholdProfiles({
      currentUserId: "c1",
      parent,
      children: [kid("c1", "amy", "explorer"), kid("c2", "zed", "maverick")],
    });
    expect(result?.profiles.filter((p) => p.isCurrent).map((p) => p.userId)).toEqual([
      "c1",
    ]);
  });

  it("leaves out children still waiting for approval, unless that is the caller", () => {
    const result = buildHouseholdProfiles({
      currentUserId: "p1",
      parent,
      children: [
        kid("c1", "amy", "explorer"),
        kid("c3", "waiting", "explorer", "pending_parent_consent"),
      ],
    });
    expect(result?.profiles.map((p) => p.userId)).toEqual(["p1", "c1"]);
  });

  it("returns null for a parent with no linked children (no switcher)", () => {
    expect(
      buildHouseholdProfiles({ currentUserId: "p1", parent, children: [] }),
    ).toBeNull();
  });

  it("returns null when the caller is not in the household", () => {
    expect(
      buildHouseholdProfiles({
        currentUserId: "stranger",
        parent,
        children: [kid("c1", "amy", "explorer")],
      }),
    ).toBeNull();
  });

  it("keeps switching off: separate Auth users need a session decision first", () => {
    expect(PROFILE_SWITCHING_AVAILABLE).toBe(false);
  });
});

describe("profile switcher tip seen flag", () => {
  it("is kept by merge and parse, and never flips back", () => {
    expect(mergePageIntroFlags({ profileSwitcherTip: true }, null)).toEqual({
      profileSwitcherTip: true,
    });
    expect(
      mergePageIntroFlags({ medals: true }, { profileSwitcherTip: true }),
    ).toEqual({ medals: true, profileSwitcherTip: true });
    const store = parsePageIntroSeenStore(
      JSON.stringify({ "user:1": { profileSwitcherTip: true } }),
    );
    expect(store["user:1"]?.profileSwitcherTip).toBe(true);
  });
});
