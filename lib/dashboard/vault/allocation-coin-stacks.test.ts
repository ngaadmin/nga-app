import { describe, expect, it } from "vitest";
import {
  allocationSheetCoinRow,
  computeAllocationCoinStacks,
} from "@/lib/dashboard/vault/allocation-coin-stacks";

describe("computeAllocationCoinStacks", () => {
  it("returns empty stacks when nothing is allocated", () => {
    expect(computeAllocationCoinStacks(0, 100)).toEqual([]);
  });

  it("builds a single stack for amounts under 10%", () => {
    expect(computeAllocationCoinStacks(5, 100)).toEqual([5]);
  });

  it("splits 15% into stacks of 10 and 5 coins", () => {
    expect(computeAllocationCoinStacks(15, 100)).toEqual([10, 5]);
  });

  it("caps at 100 coins for full allocation", () => {
    expect(computeAllocationCoinStacks(100, 100)).toEqual([
      10, 10, 10, 10, 10, 10, 10, 10, 10, 10,
    ]);
  });
});

describe("allocationSheetCoinRow", () => {
  it("uses at most 10 coins for a full pool", () => {
    expect(allocationSheetCoinRow(100, 100)).toEqual({
      fullCoins: 10,
      remainderPercent: 0,
    });
  });

  it("shows a faded remainder coin for 1–9%", () => {
    expect(allocationSheetCoinRow(5, 100)).toEqual({
      fullCoins: 0,
      remainderPercent: 5,
    });
  });

  it("keeps whole 10% coins plus a remainder", () => {
    expect(allocationSheetCoinRow(37, 100)).toEqual({
      fullCoins: 3,
      remainderPercent: 7,
    });
  });
});
