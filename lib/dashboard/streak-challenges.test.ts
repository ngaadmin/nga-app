import { describe, expect, it } from "vitest";
import { buildStreakChallengesView } from "@/lib/dashboard/streak-challenges";

describe("buildStreakChallengesView", () => {
  it("lists this month and the next two from the monthly challenge list", () => {
    const view = buildStreakChallengesView(new Date(2026, 9, 31));
    expect(view.monthly.upcoming.map((c) => c.id)).toEqual(["oct", "nov", "dec"]);
    expect(view.monthly.upcoming[0]?.isCurrentMonth).toBe(true);
    expect(view.monthly.upcoming[1]?.isCurrentMonth).toBe(false);
  });

  it("wraps into the new year", () => {
    const view = buildStreakChallengesView(new Date(2026, 11, 15));
    expect(view.monthly.upcoming.map((c) => c.id)).toEqual(["dec", "jan", "feb"]);
  });

  it("never claims an achieved challenge or invents weekly ones", () => {
    const view = buildStreakChallengesView(new Date(2026, 1, 1));
    expect(view.monthly.achieved).toEqual([]);
    expect(view.weekly.upcoming).toEqual([]);
    expect(view.weekly.achieved).toEqual([]);
  });
});
