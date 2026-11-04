import "server-only";

import { createHmac } from "node:crypto";

import { consumeRateLimit } from "@/lib/auth/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Fixed-window rate limit shared by every server instance, stored in
 * public.auth_rate_limits (same pattern as parent_pin_lockouts).
 *
 * - The bucket key is keyed-hashed (HMAC-SHA256 with NGA_TOKEN_SECRET)
 *   before it is stored, so no IP address, email address or username is
 *   written to the table, and the stored hash can't be reversed by hashing
 *   every IPv4 address or a list of known emails without the secret.
 * - Fails safe: if the table is missing (migration not applied yet) or the
 *   database can't be reached, the same limit runs in memory on this
 *   instance instead (lib/auth/rate-limit.ts), so a request is never served
 *   without a limit.
 */

const TABLE = "auth_rate_limits";

type LimitRow = { hit_count: number | null; window_reset_at: string | null };

export type SharedRateLimitResult = {
  allowed: boolean;
  retryAfterMs: number;
  /** "db" when counted in the table, "memory" when on the fallback. */
  source: "db" | "memory";
};

/**
 * Limits for the auth routes. Per-account limits stop guessing against one
 * login; per-IP limits are high enough for a whole class signing in from one
 * school IP (a NAT address), and only stop bulk abuse from a single address.
 */
export const AUTH_RATE_LIMITS = {
  signInAccount: { limit: 10, windowMs: 15 * 60_000 },
  signInIp: { limit: 300, windowMs: 60_000 },
  recoveryAccount: { limit: 5, windowMs: 15 * 60_000 },
  recoveryIp: { limit: 60, windowMs: 60_000 },
  resetAccount: { limit: 10, windowMs: 15 * 60_000 },
  resetIp: { limit: 60, windowMs: 60_000 },
} as const;

/** Rows whose window ended more than this long ago are purged daily. */
export const AUTH_RATE_LIMIT_RETENTION_MS = 24 * 60 * 60_000;

/**
 * Normalizes a username or email for an account bucket, so case or
 * surrounding spaces can't be used to get a fresh limit. Usernames are
 * matched case-insensitively at sign-in, so this never merges two accounts.
 */
export function normalizeRateLimitAccount(value: string): string {
  return value.trim().toLowerCase();
}

function hashSecret(): string {
  const dedicated = process.env.NGA_TOKEN_SECRET?.trim();
  if (dedicated) return dedicated;
  if (process.env.NODE_ENV === "production") {
    // Caught by consumeSharedRateLimit: the in-memory limit is used instead.
    throw new Error("NGA_TOKEN_SECRET must be set in production.");
  }
  return (
    process.env.EMAIL_API_SECRET?.trim() ||
    "nga-dev-only-token-secret-change-me"
  );
}

export function sharedRateLimitKeyHash(key: string): string {
  return createHmac("sha256", hashSecret())
    .update(`auth-rate-limit:${key}`)
    .digest("hex");
}

function admin() {
  return createAdminClient();
}

async function readRow(keyHash: string): Promise<LimitRow | null> {
  const { data, error } = await admin()
    .from(TABLE)
    .select("hit_count, window_reset_at")
    .eq("key_hash", keyHash)
    .maybeSingle();
  if (error) throw error;
  return (data as LimitRow | null) ?? null;
}

function resetAtMs(row: LimitRow): number {
  const ms = row.window_reset_at ? Date.parse(row.window_reset_at) : NaN;
  return Number.isFinite(ms) ? ms : 0;
}

/**
 * Counts one request against `key` and says whether it is allowed:
 * at most `limit` requests per `windowMs` window, across all instances.
 */
export async function consumeSharedRateLimit(
  key: string,
  limit: number,
  windowMs: number,
  now: number = Date.now(),
): Promise<SharedRateLimitResult> {
  try {
    const keyHash = sharedRateLimitKeyHash(key);
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const row = await readRow(keyHash);
      const updatedAt = new Date(now).toISOString();

      if (!row) {
        const { error } = await admin()
          .from(TABLE)
          .insert({
            key_hash: keyHash,
            hit_count: 1,
            window_reset_at: new Date(now + windowMs).toISOString(),
            updated_at: updatedAt,
          });
        if (!error) return { allowed: true, retryAfterMs: 0, source: "db" };
        if (error.code === "23505") continue; // Another instance inserted first.
        throw error;
      }

      const resetAt = resetAtMs(row);
      const count = Math.max(0, Number(row.hit_count) || 0);
      const windowOver = now >= resetAt;

      if (!windowOver && count >= limit) {
        return { allowed: false, retryAfterMs: Math.max(0, resetAt - now), source: "db" };
      }

      const values = windowOver
        ? {
            hit_count: 1,
            window_reset_at: new Date(now + windowMs).toISOString(),
            updated_at: updatedAt,
          }
        : { hit_count: count + 1, updated_at: updatedAt };

      // Only applies if nobody else changed the row since it was read.
      let update = admin()
        .from(TABLE)
        .update(values)
        .eq("key_hash", keyHash)
        .eq("hit_count", row.hit_count ?? 0);
      update = row.window_reset_at
        ? update.eq("window_reset_at", row.window_reset_at)
        : update.is("window_reset_at", null);
      const { data, error } = await update.select("key_hash");
      if (error) throw error;
      if (Array.isArray(data) && data.length > 0) {
        return { allowed: true, retryAfterMs: 0, source: "db" };
      }
    }
    throw new Error("auth_rate_limits: concurrent update");
  } catch {
    return { ...consumeRateLimit(key, limit, windowMs), source: "memory" };
  }
}

type PurgeClient = {
  from: (table: string) => {
    delete: (options: { count: "exact" }) => {
      lt: (
        column: string,
        value: string,
      ) => PromiseLike<{ count: number | null; error: { code?: string } | null }>;
    };
  };
};

/** PostgREST / Postgres codes for "table does not exist". */
const MISSING_TABLE_CODES = new Set(["PGRST205", "42P01"]);

/**
 * Deletes rate-limit rows whose window ended more than 24 hours ago.
 * Returns the number removed, or null when it could not run. A missing table
 * (migration not applied yet) is not reported as an error.
 */
export async function purgeExpiredAuthRateLimits(
  admin: PurgeClient,
  now: Date = new Date(),
): Promise<{ removed: number | null; error: boolean }> {
  try {
    const cutoff = new Date(now.getTime() - AUTH_RATE_LIMIT_RETENTION_MS).toISOString();
    const { count, error } = await admin
      .from(TABLE)
      .delete({ count: "exact" })
      .lt("window_reset_at", cutoff);
    if (error) {
      return { removed: null, error: !MISSING_TABLE_CODES.has(error.code ?? "") };
    }
    return { removed: typeof count === "number" ? count : 0, error: false };
  } catch {
    return { removed: null, error: true };
  }
}
