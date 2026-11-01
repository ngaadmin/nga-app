import { describe, expect, it } from "vitest";
import { showsAppFooter } from "@/lib/legal/app-footer-routes";

describe("showsAppFooter", () => {
  it("keeps the footer on the landing page only", () => {
    expect(showsAppFooter("/")).toBe(true);
  });

  it("hides the footer on every other app screen", () => {
    for (const path of [
      "/school",
      "/school/",
      "/school/sign-up",
      "/onboarding/start",
      "/onboarding",
      "/onboarding/sign-in",
      "/onboarding/sign-up",
      "/onboarding/parent-consent",
      "/privacy",
      "/dashboard",
      "/dashboard/academy",
      "/dashboard/academy/lesson/1",
      "/dashboard/launchpad",
      "/dashboard/vault",
      "/dashboard/community",
      "/dashboard/settings",
      "/dashboard/home",
      "/class/abc",
      "",
    ]) {
      expect(showsAppFooter(path), path).toBe(false);
    }
    expect(showsAppFooter(null)).toBe(false);
  });
});
