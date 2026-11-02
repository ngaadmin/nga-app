import { describe, expect, it } from "vitest";
import { PIN_DIFFERENCE_LINE, childDataPhrase, pinDifferenceLine } from "@/lib/parent/pin-copy";

describe("Parent PIN copy", () => {
  it("says children's with 2+ children and child's otherwise", () => {
    expect(childDataPhrase(2)).toBe("your children's data");
    expect(childDataPhrase(1)).toBe("your child's data");
    expect(childDataPhrase(null)).toBe("your child's data");
    expect(pinDifferenceLine(3)).toContain("your children's data and your account");
    expect(PIN_DIFFERENCE_LINE).toContain("your child's data and your account");
  });
});
