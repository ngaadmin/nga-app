import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { isPublicAppPath } from "@/lib/auth/public-routes";
import { updateSession } from "@/lib/supabase/middleware";

describe("public app paths", () => {
  it("treats /privacy as public", () => {
    expect(isPublicAppPath("/privacy")).toBe(true);
    expect(isPublicAppPath("/privacy/")).toBe(true);
  });

  it("does not treat other app routes as public", () => {
    expect(isPublicAppPath("/")).toBe(false);
    expect(isPublicAppPath("/onboarding/sign-in")).toBe(false);
    expect(isPublicAppPath("/onboarding/sign-up")).toBe(false);
    expect(isPublicAppPath("/dashboard")).toBe(false);
    expect(isPublicAppPath("/dashboard/privacy")).toBe(false);
  });

  it("does not redirect /privacy", async () => {
    const response = await updateSession(
      new NextRequest("https://app.example/privacy"),
    );

    expect(response.headers.get("location")).toBeNull();
    expect(response.status).toBe(200);
  });
});
