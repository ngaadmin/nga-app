import { describe, expect, it } from "vitest";
import { settleHelpLine } from "@/lib/parent/parent-tab-copy";

describe("settleHelpLine", () => {
  it("uses the real count and pluralizes cash-ins", () => {
    expect(settleHelpLine(1)).toBe(
      "From 1 cash-in. You pay this outside the app, then tap Mark as paid.",
    );
    expect(settleHelpLine(3)).toBe(
      "From 3 cash-ins. You pay this outside the app, then tap Mark as paid.",
    );
  });

  it("drops the count when there is none", () => {
    expect(settleHelpLine(0)).toBe(
      "You pay this outside the app, then tap Mark as paid.",
    );
  });
});
