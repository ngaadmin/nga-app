import { describe, expect, it } from "vitest";
import {
  isWordPlusNumberUsername,
  pickClassSeatUsernames,
} from "@/lib/school/class-usernames";

describe("pickClassSeatUsernames", () => {
  it("returns unique word-plus-number logins and skips taken names", () => {
    const taken = ["atlas6", "cricket2"];
    const picked = pickClassSeatUsernames(taken, 8);

    expect(picked).toHaveLength(8);
    expect(new Set(picked).size).toBe(8);
    expect(picked.every(isWordPlusNumberUsername)).toBe(true);
    expect(picked.some((name) => /^star\d+$/i.test(name))).toBe(false);
    expect(picked).not.toContain("atlas6");
    expect(picked).not.toContain("cricket2");
  });
});
