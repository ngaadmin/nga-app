import { describe, expect, it } from "vitest";
import { sha256Hex } from "@/lib/auth/sha256-sync";
import {
  generateTemporaryPassword,
  hashTemporaryPassword,
  verifyTemporaryPassword,
} from "@/lib/auth/temporary-password";

describe("temporary password crypto", () => {
  it("matches the SHA-256 vector for abc", () => {
    expect(sha256Hex("abc")).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
  });

  it("issues and verifies a random temporary password", () => {
    const password = generateTemporaryPassword();
    expect(password).toHaveLength(6);
    const stored = hashTemporaryPassword(password);
    expect(verifyTemporaryPassword(password, stored)).toBe(true);
    expect(verifyTemporaryPassword("nope!!", stored)).toBe(false);
  });
});
