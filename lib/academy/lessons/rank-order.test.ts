import { describe, expect, it } from "vitest";
import { rankOrderMatches } from "@/lib/academy/lessons/rank-order";

describe("rankOrderMatches", () => {
  it("is true only when the full order matches", () => {
    expect(rankOrderMatches(["keep", "cheaper", "borrow"], ["keep", "cheaper", "borrow"])).toBe(
      true,
    );
    expect(rankOrderMatches(["borrow", "cheaper", "keep"], ["keep", "cheaper", "borrow"])).toBe(
      false,
    );
    expect(rankOrderMatches(["keep", "cheaper"], ["keep", "cheaper", "borrow"])).toBe(false);
    expect(rankOrderMatches([], [])).toBe(false);
  });
});