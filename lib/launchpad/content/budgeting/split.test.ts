import { describe, expect, it } from "vitest";
import { budgetPercents, earnedAmount, splitDollars, stepSplitPercent } from "@/lib/launchpad/content/budgeting/split";

const DEFAULT = [5, 15, 40, 40];

describe("budget split dollars", () => {
  it("splits 100 into 5, 15, 40 and 40", () => {
    expect(splitDollars(100, DEFAULT)).toEqual([5, 15, 40, 40]);
  });

  it("rounds each jar on its own, including a half dollar", () => {
    expect(splitDollars(250, DEFAULT)).toEqual([13, 38, 100, 100]);
  });

  it("treats an empty field as 100 and keeps a typed 0 as zero", () => {
    expect(earnedAmount("")).toBe(100);
    expect(splitDollars(earnedAmount(""), DEFAULT)).toEqual([5, 15, 40, 40]);
    expect(earnedAmount("0")).toBe(0);
    expect(splitDollars(0, DEFAULT)).toEqual([0, 0, 0, 0]);
  });

  it("rounds $200 at 0/15/40/40 to $0, $30, $80 and $80", () => {
    expect(splitDollars(200, [0, 15, 40, 40])).toEqual([0, 30, 80, 80]);
  });

  it("rounds each jar on its own when the percents do not use the whole dollar", () => {
    expect(splitDollars(1, DEFAULT)).toEqual([0, 0, 0, 0]);
    expect(splitDollars(2, [10, 10])).toEqual([0, 0]);
    expect(splitDollars(1, [10, 30])).toEqual([0, 0]);
    expect(splitDollars(3, DEFAULT).every((value) => Number.isInteger(value))).toBe(true);
  });

  it("steps 5 points from the current percent and stays inside 0 to 100", () => {
    expect(stepSplitPercent(12, 1)).toBe(17);
    expect(stepSplitPercent(12, -1)).toBe(7);
    expect(stepSplitPercent(3, -1)).toBe(0);
    expect(stepSplitPercent(98, 1)).toBe(100);
  });

  it("keeps Pay yourself at 40 when Giving is not 5", () => {
    expect(budgetPercents(null)).toEqual([5, 15, 40, 40]);
    expect(budgetPercents(5)).toEqual(DEFAULT);
    expect(budgetPercents(10)).toEqual([10, 15, 40, 40]);
    expect(budgetPercents(10).reduce((sum, value) => sum + value, 0)).toBe(105);
  });
});
