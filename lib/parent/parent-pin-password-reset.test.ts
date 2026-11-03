import { beforeEach, describe, expect, it, vi } from "vitest";
import { verifyCredential } from "@/lib/auth/credential-hash";

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ cookies: async () => ({ set: () => {} }) }));
vi.mock("@/lib/parent/parent-tab-gate-pass", () => ({
  signParentTabGatePass: (id: string) => `pass-for-${id}`,
  parentTabGatePassValid: () => true,
}));
vi.mock("@/lib/supabase/keys", () => ({
  getSupabaseUrl: () => "https://example.supabase.co",
  getSupabaseAnonKey: () => "anon",
}));

const state = vi.hoisted(() => ({
  user: { id: "parent-1", email: "parent@example.com" } as { id: string; email: string } | null,
  role: "parent_master",
  password: "right-password",
  updates: [] as Array<{ values: Record<string, unknown>; filters: Record<string, unknown> }>,
  cleared: [] as string[],
  signIns: 0,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser: async () => ({ data: { user: state.user } }) } }),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: () => {
      const filters: Record<string, unknown> = {};
      let values: Record<string, unknown> | null = null;
      const chain: Record<string, unknown> = {
        select: () => chain,
        update: (next: Record<string, unknown>) => {
          values = next;
          return chain;
        },
        eq: (key: string, value: unknown) => {
          filters[key] = value;
          return chain;
        },
        maybeSingle: async () => ({
          data: { account_role: state.role, parent_pin_hash: "old-hash" },
          error: null,
        }),
        then: (onFulfilled: (value: unknown) => unknown) => {
          if (values) state.updates.push({ values, filters: { ...filters } });
          return Promise.resolve({ error: null }).then(onFulfilled);
        },
      };
      return chain;
    },
  }),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    auth: {
      signInWithPassword: async ({ password }: { email: string; password: string }) => {
        state.signIns += 1;
        return password === state.password
          ? { data: { user: { id: state.user?.id }, session: {} }, error: null }
          : { data: { user: null, session: null }, error: { message: "Invalid login credentials" } };
      },
      signOut: async () => ({ error: null }),
    },
  }),
}));

vi.mock("@/lib/parent/parent-pin-lockout", () => ({
  clearParentPinLockout: async (id: string) => {
    state.cleared.push(id);
  },
  readParentPinLock: async () => ({ locked: false, lockedUntil: null, failedTries: 0 }),
  checkParentPinWithLockout: async () => ({ ok: true }),
}));

import { resetParentPinWithPassword } from "@/lib/parent/parent-tab-server";

let n = 0;
beforeEach(() => {
  n += 1;
  state.user = { id: `parent-${n}`, email: "parent@example.com" };
  state.role = "parent_master";
  state.updates = [];
  state.cleared = [];
  state.signIns = 0;
});

describe("resetParentPinWithPassword (forgotten Parent PIN)", () => {
  it("with the right account password, replaces the one Parent PIN and clears the lockout", async () => {
    const result = await resetParentPinWithPassword("right-password", "1357");
    expect(result).toEqual({ ok: true, pass: `pass-for-parent-${n}` });
    expect(state.updates).toHaveLength(1);
    const { values, filters } = state.updates[0]!;
    expect(filters).toEqual({ id: `parent-${n}`, account_role: "parent_master" });
    expect(verifyCredential("1357", String(values.parent_pin_hash))).toBe(true);
    expect(values).toMatchObject({ parent_pin_reset_hash: null, parent_pin_reset_expires_at: null });
    expect(state.cleared).toEqual([`parent-${n}`]);
  });

  it("with a wrong password, changes nothing", async () => {
    const result = await resetParentPinWithPassword("wrong", "1357");
    expect(result).toEqual({ ok: false, error: "That password didn't match. Try again." });
    expect(state.updates).toHaveLength(0);
    expect(state.cleared).toHaveLength(0);
  });

  it("refuses a child profile without checking any password", async () => {
    state.role = "child";
    const result = await resetParentPinWithPassword("right-password", "1357");
    expect(result).toEqual({ ok: false, error: "Only the parent account can use the Parent PIN." });
    expect(state.signIns).toBe(0);
    expect(state.updates).toHaveLength(0);
  });

  it("refuses when nobody is signed in", async () => {
    state.user = null;
    const result = await resetParentPinWithPassword("right-password", "1357");
    expect(result.ok).toBe(false);
    expect(state.updates).toHaveLength(0);
  });

  it("needs a 4-digit PIN", async () => {
    const result = await resetParentPinWithPassword("right-password", "12a4");
    expect(result).toEqual({ ok: false, error: "Enter 4 numbers." });
    expect(state.signIns).toBe(0);
  });

  it("stops password guessing after 5 tries", async () => {
    for (let i = 0; i < 5; i += 1) await resetParentPinWithPassword("wrong", "1357");
    const result = await resetParentPinWithPassword("right-password", "1357");
    expect(result).toEqual({
      ok: false,
      error: "Too many password tries. Wait a few minutes, then try again.",
    });
    expect(state.signIns).toBe(5);
  });
});
