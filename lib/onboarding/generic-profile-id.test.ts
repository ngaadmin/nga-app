import { describe, expect, it } from "vitest";
import { genericProfileIdToUsername } from "@/lib/onboarding/generic-profile-id";

describe("genericProfileIdToUsername", () => {
  it("names a new guest Penny plus four digits", () => {
    expect(genericProfileIdToUsername("1842")).toBe("Penny1842");
    expect(genericProfileIdToUsername("7")).toBe("Penny0007");
  });

  it("keeps the overflow id as a valid login without the old name pattern", () => {
    expect(genericProfileIdToUsername("#0042")).toBe("PennyX0042");
    expect(genericProfileIdToUsername("#0042")).not.toMatch(/finn|ster/i);
  });
});
