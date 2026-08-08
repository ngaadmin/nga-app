import { describe, expect, it } from "vitest";
import {
  hashCredential,
  verifyCredential,
} from "@/lib/auth/credential-hash";

describe("credential-hash", () => {
  it("hashes with nga2_ and verifies", () => {
    const stored = hashCredential("secret-pass");
    expect(stored.startsWith("nga2_")).toBe(true);
    expect(verifyCredential("secret-pass", stored)).toBe(true);
    expect(verifyCredential("wrong-pass", stored)).toBe(false);
  });

  it("still verifies legacy nga1_ digests", () => {
    // Build an nga1_ digest with the same FNV-1a path used for legacy accounts.
    let hash = 2166136261;
    const value = "legacy-pin";
    for (let i = 0; i < value.length; i += 1) {
      hash ^= value.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    const legacy = `nga1_${(hash >>> 0).toString(16)}`;
    expect(verifyCredential("legacy-pin", legacy)).toBe(true);
  });
});
