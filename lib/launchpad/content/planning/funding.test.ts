import { describe, expect, it } from "vitest";
import { parseFundingAnswer } from "@/lib/launchpad/content/answers";
import { periodPayment, weeksToRepay } from "@/lib/launchpad/content/planning/funding";

describe("funding payback", () => {
  it("divides a fixed plan into 2 decimal places and rounds weekly payback up", () => {
    expect(periodPayment(80, 8)).toBe(10);
    expect(periodPayment(80, 4)).toBe(20);
    expect(periodPayment(80, 6)).toBe(13.33);
    expect(weeksToRepay(80, 5)).toBe(16);
    expect(weeksToRepay(0, 5)).toBe(0);
    expect(weeksToRepay(80, 0)).toBeNull();
  });

  it("stores the source and plan, and drops a lender", () => {
    const own = parseFundingAnswer({ kind: "funding", version: 1, fundingSource: "own_cash", startupTotal: 80, currency: "USD", funding_lender: "parent" });
    expect(own).toEqual({ kind: "funding", version: 1, fundingSource: "own_cash", startupTotal: 80, currency: "USD" });
    expect(JSON.stringify(own)).not.toMatch(/lender|parent|charity|cause/);
    const borrow = parseFundingAnswer({
      kind: "funding",
      version: 1,
      fundingSource: "borrow",
      startupTotal: 80,
      currency: "USD",
      fundingRepayMode: "weekly_amount",
      fundingWeeklyAmount: 5,
      funding_lender: "a parent",
    });
    expect(borrow?.fundingWeeksToRepay).toBe(16);
    expect(JSON.stringify(borrow)).not.toMatch(/lender|parent/);
  });
});
