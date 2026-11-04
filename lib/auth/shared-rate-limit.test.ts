import { createHash } from "node:crypto";

import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/supabase/admin", async () => {
  const fake = await import("@/lib/test-support/fake-auth-rate-limits-db");
  return { createAdminClient: () => fake.fakeRateLimitAdmin };
});

import {
  consumeSharedRateLimit,
  normalizeRateLimitAccount,
  purgeExpiredAuthRateLimits,
  sharedRateLimitKeyHash,
} from "@/lib/auth/shared-rate-limit";
import {
  fakeRateLimitAdmin,
  fakeRateLimitDb as db,
} from "@/lib/test-support/fake-auth-rate-limits-db";

beforeEach(() => {
  db.reset();
  vi.unstubAllEnvs();
  vi.stubEnv("NGA_TOKEN_SECRET", "test-secret-one");
});

describe("consumeSharedRateLimit", () => {
  it("allows up to the limit, then refuses until the window ends", async () => {
    const now = 1_000_000;
    for (let i = 0; i < 3; i += 1) {
      const r = await consumeSharedRateLimit("sign-in:ip:1.2.3.4", 3, 60_000, now);
      expect(r).toMatchObject({ allowed: true, source: "db" });
    }
    const blocked = await consumeSharedRateLimit("sign-in:ip:1.2.3.4", 3, 60_000, now + 1_000);
    expect(blocked).toEqual({ allowed: false, retryAfterMs: 59_000, source: "db" });

    const later = await consumeSharedRateLimit("sign-in:ip:1.2.3.4", 3, 60_000, now + 60_000);
    expect(later).toMatchObject({ allowed: true, source: "db" });
    expect(db.tables.every((t) => t === "auth_rate_limits")).toBe(true);
  });

  it("keeps separate counts per key", async () => {
    await consumeSharedRateLimit("a", 1, 60_000, 0);
    expect((await consumeSharedRateLimit("a", 1, 60_000, 1)).allowed).toBe(false);
    expect((await consumeSharedRateLimit("b", 1, 60_000, 1)).allowed).toBe(true);
  });

  it("stores only a hash of the key, never the IP or email", async () => {
    await consumeSharedRateLimit("consent-resend:email:parent@example.com", 3, 60_000, 0);
    const [stored] = [...db.rows.keys()];
    expect(stored).toBe(sharedRateLimitKeyHash("consent-resend:email:parent@example.com"));
    expect(stored).toMatch(/^[0-9a-f]{64}$/);
    expect(JSON.stringify([...db.rows.values()])).not.toContain("example.com");
  });

  it("falls back to the in-memory limit when the table is missing", async () => {
    db.missing = true;
    const key = `fallback-${Math.random()}`;
    expect(await consumeSharedRateLimit(key, 2, 60_000)).toMatchObject({ allowed: true, source: "memory" });
    expect(await consumeSharedRateLimit(key, 2, 60_000)).toMatchObject({ allowed: true, source: "memory" });
    expect(await consumeSharedRateLimit(key, 2, 60_000)).toMatchObject({ allowed: false, source: "memory" });
  });

  it("uses HMAC-SHA256 with NGA_TOKEN_SECRET, not a plain SHA-256", () => {
    const key = "sign-in:ip:203.0.113.7";
    const withOne = sharedRateLimitKeyHash(key);
    expect(withOne).toMatch(/^[0-9a-f]{64}$/);
    expect(withOne).not.toBe(
      createHash("sha256").update(`auth-rate-limit:${key}`).digest("hex"),
    );
    vi.stubEnv("NGA_TOKEN_SECRET", "test-secret-two");
    expect(sharedRateLimitKeyHash(key)).not.toBe(withOne);
  });

  it("falls back to memory in production when NGA_TOKEN_SECRET is missing", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NGA_TOKEN_SECRET", "");
    const result = await consumeSharedRateLimit(`no-secret-${Math.random()}`, 1, 60_000);
    expect(result).toMatchObject({ allowed: true, source: "memory" });
    expect(db.rows.size).toBe(0);
  });

  it("normalizes account keys by case and surrounding spaces", () => {
    expect(normalizeRateLimitAccount("  Sam.Learner ")).toBe("sam.learner");
    expect(normalizeRateLimitAccount("Parent@Example.COM")).toBe("parent@example.com");
  });
});

describe("purgeExpiredAuthRateLimits", () => {
  it("deletes only rows whose window ended more than 24 hours ago", async () => {
    const now = new Date("2026-11-04T00:00:00.000Z");
    const hours = (h: number) => new Date(now.getTime() - h * 3_600_000).toISOString();
    db.rows.set("a".repeat(64), { key_hash: "a".repeat(64), hit_count: 3, window_reset_at: hours(30) });
    db.rows.set("b".repeat(64), { key_hash: "b".repeat(64), hit_count: 3, window_reset_at: hours(25) });
    db.rows.set("c".repeat(64), { key_hash: "c".repeat(64), hit_count: 3, window_reset_at: hours(23) });
    db.rows.set("d".repeat(64), { key_hash: "d".repeat(64), hit_count: 3, window_reset_at: hours(-1) });

    const result = await purgeExpiredAuthRateLimits(fakeRateLimitAdmin as never, now);
    expect(result).toEqual({ removed: 2, error: false });
    expect([...db.rows.keys()].sort()).toEqual(["c".repeat(64), "d".repeat(64)]);
  });

  it("treats a missing table as nothing to purge, not an error", async () => {
    db.missing = true;
    expect(await purgeExpiredAuthRateLimits(fakeRateLimitAdmin as never)).toEqual({
      removed: null,
      error: false,
    });
  });
});
