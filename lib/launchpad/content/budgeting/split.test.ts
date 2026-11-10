import { describe, expect, it } from "vitest";
import { budgetPercents, earnedAmount, splitDollars } from "@/lib/launchpad/content/budgeting/split";

const DEFAULT = [5, 15, 40, 40];

describe("budget split dollars", () => {
  it("splits 100 into 5, 15, 40 and 40", () => {
    expect(splitDollars(100, DEFAULT)).toEqual([5, 15, 40, 40]);
  });

  it("gives the half-dollar tie at 250 to Emergencies, the higher percent", () => {
    expect(splitDollars(250, DEFAULT)).toEqual([12, 38, 100, 100]);
  });

  it("treats an empty field as 100 and keeps a typed 0 as zero", () => {
    expect(earnedAmount("")).toBe(100);
    expect(splitDollars(earnedAmount(""), DEFAULT)).toEqual([5, 15, 40, 40]);
    expect(earnedAmount("0")).toBe(0);
    expect(splitDollars(0, DEFAULT)).toEqual([0, 0, 0, 0]);
  });

  it("keeps odd amounts as whole dollars that sum to the total", () => {
    for (const total of [1, 3, 7, 11, 99]) {
      const shares = splitDollars(total, DEFAULT);
      expect(shares.reduce((sum, value) => sum + value, 0)).toBe(total);
      expect(shares.every((value) => Number.isInteger(value))).toBe(true);
    }
    // 1 dollar: the 0.4 tie between the two 40% jars goes to the earlier one.
    expect(splitDollars(1, DEFAULT)).toEqual([0, 0, 1, 0]);
  });

  it("breaks a remainder tie toward the higher percent", () => {
    expect(splitDollars(2, [10, 10])).toEqual([1, 1]);
    expect(splitDollars(1, [10, 30])).toEqual([0, 1]);
  });

  it("takes a non-5 giving percent out of Pay yourself", () => {
    expect(budgetPercents(null)).toEqual(DEFAULT);
    expect(budgetPercents(5)).toEqual(DEFAULT);
    const ten = budgetPercents(10);
    expect(ten).toEqual([10, 15, 35, 40]);
    expect(splitDollars(100, ten)).toEqual([10, 15, 35, 40]);
    expect(splitDollars(250, ten)).toEqual([25, 37, 88, 100]);
    expect(splitDollars(250, ten).reduce((sum, value) => sum + value, 0)).toBe(250);
  });
});
