import { describe, expect, it } from "vitest";
import {
  ADULT_PASSWORD_MIN_LENGTH,
  ADULT_PASSWORD_TOO_SHORT_ERROR,
  LEARNER_PASSWORD_MIN_LENGTH,
  isAdultAccountRole,
  newPasswordLengthError,
  passwordMinLengthForRole,
} from "@/lib/auth/password-policy";

describe("password policy (security review finding 8)", () => {
  it("needs 10 characters for parents and teachers, 6 for learners", () => {
    expect(ADULT_PASSWORD_MIN_LENGTH).toBe(10);
    expect(LEARNER_PASSWORD_MIN_LENGTH).toBe(6);
    expect(passwordMinLengthForRole("parent_master")).toBe(10);
    expect(passwordMinLengthForRole("teacher")).toBe(10);
    expect(passwordMinLengthForRole("child")).toBe(6);
    expect(passwordMinLengthForRole(null)).toBe(6);
  });

  it("flags adult roles only", () => {
    expect(isAdultAccountRole("parent_master")).toBe(true);
    expect(isAdultAccountRole("teacher")).toBe(true);
    expect(isAdultAccountRole("child")).toBe(false);
    expect(isAdultAccountRole(undefined)).toBe(false);
  });

  it("returns the too-short copy below the minimum and null at it", () => {
    expect(newPasswordLengthError("123456789", 10)).toBe(ADULT_PASSWORD_TOO_SHORT_ERROR);
    expect(newPasswordLengthError("1234567890", 10)).toBeNull();
    expect(ADULT_PASSWORD_TOO_SHORT_ERROR).toBe(
      "Use at least 10 characters for your password.",
    );
  });
});
