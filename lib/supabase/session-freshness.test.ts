import { describe, expect, it } from "vitest";
import {
  SESSION_REFRESH_MARGIN_MS,
  shouldRefreshSupabaseSession,
} from "@/lib/supabase/session-freshness";

const NOW = 1_700_000_000_000;

function sessionCookie(expiresAtSeconds: number, name = "sb-project-auth-token") {
  return {
    name,
    value: `base64-${Buffer.from(
      JSON.stringify({
        access_token: "header.payload.sig",
        expires_at: expiresAtSeconds,
      }),
      "utf8",
    ).toString("base64url")}`,
  };
}

describe("shouldRefreshSupabaseSession", () => {
  it("skips guests who have no Supabase auth cookie", () => {
    expect(
      shouldRefreshSupabaseSession([{ name: "other", value: "1" }], NOW),
    ).toBe(false);
  });

  it("skips a session that is still outside the refresh margin", () => {
    const expiresAt = Math.floor((NOW + SESSION_REFRESH_MARGIN_MS + 60_000) / 1000);
    expect(shouldRefreshSupabaseSession([sessionCookie(expiresAt)], NOW)).toBe(false);
  });

  it("refreshes when the access token is inside the refresh margin", () => {
    const expiresAt = Math.floor((NOW + SESSION_REFRESH_MARGIN_MS - 1_000) / 1000);
    expect(shouldRefreshSupabaseSession([sessionCookie(expiresAt)], NOW)).toBe(true);
  });

  it("refreshes an expired session", () => {
    const expiresAt = Math.floor((NOW - 5_000) / 1000);
    expect(shouldRefreshSupabaseSession([sessionCookie(expiresAt)], NOW)).toBe(true);
  });

  it("reads a chunked base64url session cookie", () => {
    const expiresAt = Math.floor((NOW + 10 * 60_000) / 1000);
    const encoded = `base64-${Buffer.from(
      JSON.stringify({ expires_at: expiresAt }),
      "utf8",
    ).toString("base64url")}`;
    const midpoint = Math.floor(encoded.length / 2);
    expect(
      shouldRefreshSupabaseSession(
        [
          { name: "sb-project-auth-token.0", value: encoded.slice(0, midpoint) },
          { name: "sb-project-auth-token.1", value: encoded.slice(midpoint) },
        ],
        NOW,
      ),
    ).toBe(false);
  });

  it("falls back to the JWT exp when expires_at is missing", () => {
    const exp = Math.floor((NOW + 10 * 60_000) / 1000);
    const payload = Buffer.from(JSON.stringify({ exp }), "utf8").toString("base64url");
    const value = `base64-${Buffer.from(
      JSON.stringify({ access_token: `aaa.${payload}.sig` }),
      "utf8",
    ).toString("base64url")}`;
    expect(
      shouldRefreshSupabaseSession(
        [{ name: "sb-project-auth-token", value }],
        NOW,
      ),
    ).toBe(false);
  });

  it("asks Supabase to repair an unreadable auth cookie", () => {
    expect(
      shouldRefreshSupabaseSession(
        [{ name: "sb-project-auth-token", value: "base64-not-json" }],
        NOW,
      ),
    ).toBe(true);
  });
});
