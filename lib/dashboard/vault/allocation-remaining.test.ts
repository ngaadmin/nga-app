import { describe, expect, it } from "vitest";
import {
  isAllocationOverPool,
  sumEffectiveAllocationInputs,
  vaultAllocationEntryCap,
  vaultAllocationRemainingDisplay,
} from "@/lib/dashboard/vault/allocation-remaining";

describe("allocation remaining", () => {
  it("subtracts effective inputs from the pool for display", () => {
    expect(
      vaultAllocationRemainingDisplay(
        100,
        sumEffectiveAllocationInputs(
          ["save-jar", "spend-jar"],
          { "save-jar": 30, "spend-jar": 20 },
          {},
          null,
        ),
      ),
    ).toBe(50);
  });

  it("uses raw focused input while typing", () => {
    expect(
      sumEffectiveAllocationInputs(
        ["save-jar", "spend-jar"],
        { "save-jar": 30, "spend-jar": 20 },
        { "save-jar": "45" },
        "save-jar",
      ),
    ).toBe(65);
  });

  it("floors remaining display at zero when inputs exceed the pool", () => {
    expect(vaultAllocationRemainingDisplay(100, 110)).toBe(0);
  });

  it("detects over-allocation against the pool", () => {
    expect(isAllocationOverPool(100, 110)).toBe(true);
    expect(isAllocationOverPool(100, 100)).toBe(false);
  });

  it("computes per-row entry cap from other drafts", () => {
    expect(
      vaultAllocationEntryCap(
        100,
        { "save-jar": 60, "spend-jar": 0, "give-jar": 0 },
        ["save-jar", "spend-jar", "give-jar"],
        "spend-jar",
      ),
    ).toBe(40);
  });
});
