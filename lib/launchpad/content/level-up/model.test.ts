import { describe, expect, it } from "vitest";
import { GROW_START_OPTIONS, IMPROVE_START_OPTIONS, addMonths, checkInClipboard, expandJobsFor, formatCheckInDate, mapImproveStart } from "@/lib/launchpad/content/level-up/model";

describe("Level Up check-in date", () => {
  it("adds three calendar months to today", () => {
    const date = addMonths(new Date(2026, 10, 10), 3);
    expect(formatCheckInDate(date)).toBe("February 10, 2027");
    expect(checkInClipboard("February 10, 2027")).toContain("February 10, 2027");
    expect(checkInClipboard("February 10, 2027")).toContain("NextGenAchiever$ check-in");
  });

  it("maps older Improve start dates onto this week, this month, and the next three months", () => {
    expect(IMPROVE_START_OPTIONS.map((option) => option.label)).toEqual(["this week", "this month", "in the next three months"]);
    expect(mapImproveStart("in-a-month")).toBe("this-month");
    expect(mapImproveStart("in-three-months")).toBe("next-three-months");
    expect(mapImproveStart("next-job")).toBe("this-week");
    expect(mapImproveStart("next-quarter")).toBe("this-week");
    expect(mapImproveStart(undefined)).toBe("this-week");
  });

  it("keeps Grow start dates to the four planning choices", () => {
    expect(GROW_START_OPTIONS.map((option) => option.label)).toEqual([
      "by my next job",
      "this week",
      "in a month",
      "by next quarter",
    ]);
  });

  it("gates expand jobs by cohort", () => {
    expect(expandJobsFor("explorer").map((job) => job.label)).toEqual(["Curb painting"]);
    expect(expandJobsFor("pathfinder").map((job) => job.id)).not.toContain("grocery");
    expect(expandJobsFor("maverick")).toHaveLength(5);
  });
});
