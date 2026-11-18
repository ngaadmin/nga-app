import { describe, expect, it } from "vitest";
import { copyMatrix } from "@/constants/copyMatrix";

describe("learner sign-up parent approval button", () => {
  it("reads exactly Send to my parent from the copy matrix", () => {
    expect(copyMatrix.onboarding.parentApprovalRequest.submit).toBe("Send to my parent");
  });
});
