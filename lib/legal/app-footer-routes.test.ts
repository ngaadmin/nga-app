import { describe, expect, it } from "vitest";
import { showsAppFooter } from "@/lib/legal/app-footer-routes";

describe("showsAppFooter", () => {
  it("keeps the footer on the public homepage and school landing", () => {
    expect(showsAppFooter("/")).toBe(true);
    expect(showsAppFooter("/school")).toBe(true);
    expect(showsAppFooter("/school/")).toBe(true);
  });

  it("hides the footer on every other app screen", () => {
    for (const path of [
      "/onboarding/start",
      "/onboarding",
      "/onboarding/sign-in",
      "/onboarding/sign-up",
      "/school/sign-up",
      "/privacy",
      "/dashboard/academy",
      "/dashboard/launchpad",
      "/dashboard/vault",
      "/dashboard/community",
      "/dashboard/settings",
      "/class/abc",
      "",
    ]) {
      expect(showsAppFooter(path), path).toBe(false);
    }
    expect(showsAppFooter(null)).toBe(false);
  });
});
