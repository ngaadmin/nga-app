import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const state = vi.hoisted(() => ({
  userId: "user-1" as string | null,
  role: "child" as string | null,
  updateUser: vi.fn(async () => ({ error: null })),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: {
      getUser: async () => ({ data: { user: state.userId ? { id: state.userId } : null } }),
      updateUser: state.updateUser,
    },
  }),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: state.role ? { account_role: state.role } : null,
            error: null,
          }),
        }),
      }),
    }),
  }),
}));

vi.mock("@/lib/onboarding/sign-in-supabase", () => ({
  loadLearnerAccountById: vi.fn(),
  signInSupabaseAccount: vi.fn(),
}));

import { updateSignedInPassword } from "@/lib/onboarding/learner-account";

describe("updateSignedInPassword length rules (finding 8)", () => {
  beforeEach(() => {
    state.userId = "user-1";
    state.role = "child";
    state.updateUser.mockClear();
  });

  it("lets a learner change to a 6-character password", async () => {
    expect(await updateSignedInPassword("abcdef")).toEqual({ ok: true });
    expect(state.updateUser).toHaveBeenCalledOnce();
  });

  it("needs 10 characters when a parent or teacher changes their password", async () => {
    for (const role of ["parent_master", "teacher"]) {
      state.role = role;
      const result = await updateSignedInPassword("abcdefghi");
      expect(result).toEqual({
        ok: false,
        error: "Use at least 10 characters for your password.",
      });
    }
    expect(state.updateUser).not.toHaveBeenCalled();
    state.role = "parent_master";
    expect(await updateSignedInPassword("abcdefghij")).toEqual({ ok: true });
  });

  it("refuses when nobody is signed in", async () => {
    state.userId = null;
    expect((await updateSignedInPassword("abcdefghij")).ok).toBe(false);
    expect(state.updateUser).not.toHaveBeenCalled();
  });
});
