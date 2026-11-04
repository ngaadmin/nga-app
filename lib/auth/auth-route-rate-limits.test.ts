import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/supabase/admin", async () => {
  const fake = await import("@/lib/test-support/fake-auth-rate-limits-db");
  return { createAdminClient: () => fake.fakeRateLimitAdmin };
});

const mocks = vi.hoisted(() => ({
  signIn: vi.fn(),
  recovery: vi.fn(),
  reset: vi.fn(),
}));

vi.mock("@/lib/onboarding/sign-in-supabase", () => ({
  SIGN_IN_MISMATCH_ERROR: "Those details don't match.",
  SIGN_IN_UNAVAILABLE_ERROR: "Sign-in is unavailable.",
  signInSupabaseAccount: mocks.signIn,
}));
vi.mock("@/lib/onboarding/household-recovery", () => ({
  requestHouseholdPasswordRecovery: mocks.recovery,
}));
vi.mock("@/lib/onboarding/complete-password-reset", () => ({
  completePasswordReset: mocks.reset,
}));

import { POST as signInPost } from "@/app/api/auth/sign-in/route";
import { POST as recoveryPost } from "@/app/api/auth/password-recovery/route";
import { POST as resetPost } from "@/app/api/auth/reset-password/route";
import { signPasswordResetToken } from "@/lib/auth/password-reset-token";
import { AUTH_RATE_LIMITS } from "@/lib/auth/shared-rate-limit";
import { fakeRateLimitDb } from "@/lib/test-support/fake-auth-rate-limits-db";

const SCHOOL_IP = "203.0.113.50";

function post(url: string, body: unknown, ip = SCHOOL_IP): Request {
  return new Request(`http://localhost:3000${url}`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  fakeRateLimitDb.reset();
  vi.stubEnv("NGA_TOKEN_SECRET", "route-test-secret");
  mocks.signIn.mockReset().mockResolvedValue({ success: true });
  mocks.recovery.mockReset().mockResolvedValue({ accepted: true });
  mocks.reset.mockReset().mockResolvedValue({ ok: true });
});

describe("sign-in rate limits", () => {
  it("lets 30 different learners on one school IP sign in, none blocked", async () => {
    for (let i = 1; i <= 30; i += 1) {
      const res = await signInPost(post("/api/auth/sign-in", {
        identifier: `learner${i}`,
        password: "class-pass",
      }));
      expect(res.status, `learner${i}`).toBe(200);
    }
    expect(mocks.signIn).toHaveBeenCalledTimes(30);
    // Counted in the shared table (not the per-instance fallback).
    expect(fakeRateLimitDb.rows.size).toBe(31); // 1 IP bucket + 30 accounts
  });

  it("also lets a class retry: 30 learners x 2 attempts from one IP", async () => {
    for (let round = 0; round < 2; round += 1) {
      for (let i = 1; i <= 30; i += 1) {
        const res = await signInPost(post("/api/auth/sign-in", {
          identifier: `learner${i}`,
          password: "wrong-pass",
        }));
        expect(res.status).not.toBe(429);
      }
    }
  });

  it("blocks one account after 10 attempts in 15 minutes, from any IP or casing", async () => {
    mocks.signIn.mockResolvedValue({ success: false, error: "Those details don't match." });
    for (let i = 0; i < AUTH_RATE_LIMITS.signInAccount.limit; i += 1) {
      const res = await signInPost(post("/api/auth/sign-in", {
        identifier: "target.learner",
        password: `guess-${i}`,
      }, `198.51.100.${i + 1}`));
      expect(res.status).toBe(401);
    }
    const blocked = await signInPost(post("/api/auth/sign-in", {
      identifier: "  Target.Learner ",
      password: "guess-final",
    }, "198.51.100.200"));
    expect(blocked.status).toBe(429);
    expect(mocks.signIn).toHaveBeenCalledTimes(AUTH_RATE_LIMITS.signInAccount.limit);

    // Other learners on the same IPs are unaffected.
    mocks.signIn.mockResolvedValue({ success: true });
    const other = await signInPost(post("/api/auth/sign-in", {
      identifier: "another.learner",
      password: "class-pass",
    }, "198.51.100.1"));
    expect(other.status).toBe(200);
    expect(mocks.signIn).toHaveBeenLastCalledWith({ identifier: "another.learner", password: "class-pass" });
  });

  it("still caps one IP at the high per-IP limit", async () => {
    for (let i = 0; i < AUTH_RATE_LIMITS.signInIp.limit; i += 1) {
      const res = await signInPost(post("/api/auth/sign-in", {
        identifier: `bulk${i}`,
        password: "class-pass",
      }, "192.0.2.9"));
      expect(res.status).toBe(200);
    }
    const res = await signInPost(post("/api/auth/sign-in", {
      identifier: "bulk-extra",
      password: "class-pass",
    }, "192.0.2.9"));
    expect(res.status).toBe(429);
  });
});

describe("password recovery rate limits", () => {
  it("lets 30 learners on one school IP request recovery", async () => {
    for (let i = 1; i <= 30; i += 1) {
      const res = await recoveryPost(post("/api/auth/password-recovery", {
        username: `learner${i}`,
      }));
      expect(res.status).toBe(200);
    }
  });

  it("blocks one email after 5 requests in 15 minutes", async () => {
    for (let i = 0; i < AUTH_RATE_LIMITS.recoveryAccount.limit; i += 1) {
      const res = await recoveryPost(post("/api/auth/password-recovery", {
        email: "parent@example.com",
      }, `198.51.100.${i + 1}`));
      expect(res.status).toBe(200);
    }
    const blocked = await recoveryPost(post("/api/auth/password-recovery", {
      email: "Parent@Example.com",
    }, "198.51.100.99"));
    expect(blocked.status).toBe(429);
    expect(mocks.recovery).toHaveBeenCalledTimes(AUTH_RATE_LIMITS.recoveryAccount.limit);
  });
});

describe("password reset rate limits", () => {
  const tokenFor = (userId: string) =>
    signPasswordResetToken({
      userId,
      username: `user-${userId}`,
      createdAt: new Date().toISOString(),
    });

  it("lets 30 learners on one school IP reset their passwords", async () => {
    for (let i = 1; i <= 30; i += 1) {
      const res = await resetPost(post("/api/auth/reset-password", {
        token: tokenFor(`learner-${i}`),
        password: "new-password-1",
      }));
      expect(res.status).toBe(200);
    }
  });

  it("blocks one account after 10 reset attempts in 15 minutes", async () => {
    mocks.reset.mockResolvedValue({ ok: false, error: "Too short." });
    const token = tokenFor("user-1");
    for (let i = 0; i < AUTH_RATE_LIMITS.resetAccount.limit; i += 1) {
      const res = await resetPost(post("/api/auth/reset-password", {
        token,
        password: "x",
      }, `198.51.100.${i + 1}`));
      expect(res.status).toBe(400);
    }
    const blocked = await resetPost(post("/api/auth/reset-password", {
      token,
      password: "x",
    }, "198.51.100.99"));
    expect(blocked.status).toBe(429);
  });
});
