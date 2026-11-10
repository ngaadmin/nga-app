import { describe, expect, it } from "vitest";
import { START_OPTIONS, addMonths, checkInClipboard, expandJobsFor, formatCheckInDate } from "@/lib/launchpad/content/level-up/model";

describe("Level Up check-in date", () => {
  it("adds three calendar months to today", () => {
    const date = addMonths(new Date(2026, 10, 10), 3);
    expect(formatCheckInDate(date)).toBe("February 10, 2027");
    expect(checkInClipboard("February 10, 2027")).toContain("February 10, 2027");
    expect(checkInClipboard("February 10, 2027")).toContain("NextGenAchiever$ check-in");
  });

  it("includes in three months on the Improve timeline dropdown", () => {
    expect(START_OPTIONS.map((option) => option.label)).toContain("in three months");
  });

  it("gates expand jobs by cohort", () => {
    expect(expandJobsFor("explorer").map((job) => job.label)).toEqual(["Curb painting"]);
    expect(expandJobsFor("pathfinder").map((job) => job.id)).not.toContain("grocery");
    expect(expandJobsFor("maverick")).toHaveLength(5);
  });
});
