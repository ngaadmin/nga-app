import { describe, expect, it } from "vitest";
import { coinsCashWorth } from "@/lib/parent/coins-cash-worth";

describe("coinsCashWorth", () => {
  it("values the balance at the cash rate", () => {
    expect(coinsCashWorth(1760, 100)).toBe(17.6);
    expect(coinsCashWorth(1760, 50)).toBe(8.8);
    expect(coinsCashWorth(0, 100)).toBe(0);
  });

  it("rounds down to whole cents", () => {
    expect(coinsCashWorth(99, 1)).toBe(0);
    expect(coinsCashWorth(150, 1)).toBe(0.01);
  });

  it("is null when no rate is set", () => {
    expect(coinsCashWorth(1760, null)).toBeNull();
    expect(coinsCashWorth(1760, undefined)).toBeNull();
    expect(coinsCashWorth(1760, 0)).toBeNull();
  });
});
