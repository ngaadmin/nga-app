import { beforeEach, describe, expect, it, vi } from "vitest";

const getUser = vi.fn();
const profileRole = vi.fn();
const adminFrom = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser } }),
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ from: adminFrom }),
}));
vi.mock("@/lib/email/resend-client", () => ({ sendOnboardingEmail: vi.fn() }));

import {
  approveConsentRequestFromParentTab,
  declineConsentRequestFromParentTab,
} from "@/lib/onboarding/approve-consent-request";
import { signParentTabGatePass } from "@/lib/parent/parent-tab-gate-pass";

function profilesQuery() {
  return {
    select: () => ({
      eq: () => ({ maybeSingle: async () => ({ data: profileRole() }) }),
    }),
  };
}

describe("Parent tab approve/decline gate (server)", () => {
  beforeEach(() => {
    getUser.mockReset();
    profileRole.mockReset();
    adminFrom.mockReset();
    adminFrom.mockImplementation((table: string) => {
      if (table !== "profiles") throw new Error(`unexpected table ${table}`);
      return profilesQuery();
    });
  });

  it("refuses without a gate pass, before touching any request", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "parent-1" } } });
    profileRole.mockReturnValue({ account_role: "parent_master" });
    for (const action of [
      approveConsentRequestFromParentTab,
      declineConsentRequestFromParentTab,
    ]) {
      const result = await action("req-1", "");
      expect(result).toEqual({
        success: false,
        error: "Enter your parent PIN to continue.",
      });
    }
    expect(adminFrom.mock.calls.every(([table]) => table === "profiles")).toBe(
      true,
    );
  });

  it("refuses another parent's pass", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "parent-1" } } });
    profileRole.mockReturnValue({ account_role: "parent_master" });
    const result = await approveConsentRequestFromParentTab(
      "req-1",
      signParentTabGatePass("parent-2"),
    );
    expect(result.success).toBe(false);
  });

  it("refuses a learner even with a pass for their own id", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "child-1" } } });
    profileRole.mockReturnValue({ account_role: "child" });
    const result = await declineConsentRequestFromParentTab(
      "req-1",
      signParentTabGatePass("child-1"),
    );
    expect(result.success).toBe(false);
  });

  it("refuses when signed out", async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    const result = await approveConsentRequestFromParentTab(
      "req-1",
      signParentTabGatePass("parent-1"),
    );
    expect(result.success).toBe(false);
  });
});
