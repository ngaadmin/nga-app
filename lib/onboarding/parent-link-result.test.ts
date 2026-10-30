import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parentLinkResultHeading } from "@/lib/onboarding/parent-link-result";

describe("parent link result heading", () => {
  it("uses Request declined only after a decline", () => {
    expect(parentLinkResultHeading("declined")).toBe("Request declined");
  });

  it("keeps Parent link unavailable for an invalid or expired link", () => {
    expect(parentLinkResultHeading("unavailable")).toBe("Parent link unavailable");
  });

  it("shows the declined heading only from a successful decline", () => {
    const form = readFileSync("components/onboarding/sign-up-form.tsx", "utf8");
    const decline = form.slice(
      form.indexOf("async function handleExplicitDecline"),
      form.indexOf("async function handleExplicitApprove"),
    );
    expect(decline).toContain("setAccountDeclined(true)");
    expect(decline).toContain(
      "setErrors({ form: copyMatrix.onboarding.parentDecline.declinedBody })",
    );
    expect(form).toContain(
      'parentLinkResultHeading(accountDeclined ? "declined" : "unavailable")',
    );
    const invalid = form.slice(
      form.indexOf('if (lookup.status !== "valid"'),
      form.indexOf("const pending = lookup.pending"),
    );
    expect(invalid).toContain("setAccountDeclined(false)");
    expect(invalid).not.toContain("setAccountDeclined(true)");
  });
});
