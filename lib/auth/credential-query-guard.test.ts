import { describe, expect, it } from "vitest";
import {
  isCredentialQueryParam,
  stripCredentialQueryParams,
} from "@/lib/auth/credential-query-guard";

describe("isCredentialQueryParam", () => {
  it.each([
    "password",
    "Password",
    "newPassword",
    "confirmPassword",
    "confirm-password",
    "current_password",
    "pin",
    "PIN",
    "parentPin",
    "parent_pin",
    "confirmPin",
    "passcode",
    "pass",
    "pwd",
    "credential",
    "secret",
  ])("flags %s", (key) => {
    expect(isCredentialQueryParam(key)).toBe(true);
  });

  it.each([
    "email",
    "parentEmail",
    "identifier",
    "chosen-username",
    "token",
    "code",
    "next",
    "shipping",
    "spin",
    "cohort",
    "",
  ])("leaves %s alone", (key) => {
    expect(isCredentialQueryParam(key)).toBe(false);
  });
});

describe("stripCredentialQueryParams", () => {
  it("returns null when there is nothing to strip", () => {
    const url = new URL("https://app.example/onboarding/sign-in?next=%2Fdashboard");
    expect(stripCredentialQueryParams(url)).toBeNull();
    expect(stripCredentialQueryParams(new URL("https://app.example/x"))).toBeNull();
  });

  it("removes credential params and keeps the rest in order", () => {
    const url = new URL(
      "https://app.example/onboarding/sign-in?identifier=sam&credential=hunter2&next=%2Fdashboard&pin=1234",
    );
    const cleaned = stripCredentialQueryParams(url);
    expect(cleaned).not.toBeNull();
    expect(cleaned!.pathname).toBe("/onboarding/sign-in");
    expect(cleaned!.search).toBe("?identifier=sam&next=%2Fdashboard");
    expect(cleaned!.toString()).not.toContain("hunter2");
    expect(cleaned!.toString()).not.toContain("1234");
  });

  it("removes every occurrence of a repeated key and keeps the hash", () => {
    const url = new URL(
      "https://app.example/onboarding/sign-up?password=a&password=b&confirmPassword=a&parentEmail=p%40x.com#top",
    );
    const cleaned = stripCredentialQueryParams(url);
    expect(cleaned!.search).toBe("?parentEmail=p%40x.com");
    expect(cleaned!.hash).toBe("#top");
  });

  it("drops the whole query when only credentials were present", () => {
    const cleaned = stripCredentialQueryParams(
      new URL("https://app.example/onboarding/reset-password?newPassword=x&confirmPassword=x"),
    );
    expect(cleaned!.search).toBe("");
  });

  it("does not mutate the input URL", () => {
    const url = new URL("https://app.example/a?password=secretvalue");
    stripCredentialQueryParams(url);
    expect(url.search).toBe("?password=secretvalue");
  });
});
