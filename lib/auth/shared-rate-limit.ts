import "server-only";

import { createHash } from "node:crypto";

import { consumeRateLimit } from "@/lib/auth/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Fixed-window rate limit shared by every server instance, stored in
 * public.auth_rate_limits (same pattern as parent_pin_lockouts).
 *
 * - The bucket key is hashed (SHA-256) before it is stored, so no IP address
 *   or email address is written to the table.
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

export function sharedRateLimitKeyHash(key: string): string {
  return createHash("sha256").update(`auth-rate-limit:${key}`).digest("hex");
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
  const keyHash = sharedRateLimitKeyHash(key);
  try {
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
