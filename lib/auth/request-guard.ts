import { timingSafeEqual } from "crypto";
import { getDefaultAppUrl } from "@/lib/email/templates";

function safeEqualString(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

/** Client IP key for rate limiting (best-effort behind proxies). */
export function clientIpKey(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "unknown"
  );
}

function allowedHostsForRequest(request: Request): Set<string> {
  const allowedHosts = new Set<string>();
  try {
    // Env-aware default (NEXT_PUBLIC_APP_URL) plus last-resort fallback host.
    allowedHosts.add(new URL(getDefaultAppUrl()).host.toLowerCase());
  } catch {
    // ignore invalid configured URL
  }

  if (process.env.NODE_ENV !== "production") {
    allowedHosts.add("localhost:3000");
    allowedHosts.add("127.0.0.1:3000");
  }

  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) {
    allowedHosts.add(vercelUrl.replace(/^https?:\/\//, "").toLowerCase());
  }

  const host = request.headers.get("host")?.trim().toLowerCase();
  if (host) allowedHosts.add(host);

  return allowedHosts;
}

/**
 * True when Origin/Referer matches an allowed deployment host.
 * Production requires Origin or Referer; development may omit both.
 */
export function isAllowedBrowserOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const candidates = [origin, referer].filter(Boolean) as string[];

  if (candidates.length === 0) {
    return process.env.NODE_ENV !== "production";
  }

  const allowedHosts = allowedHostsForRequest(request);
  return candidates.some((value) => {
    try {
      return allowedHosts.has(new URL(value).host.toLowerCase());
    } catch {
      return false;
    }
  });
}

function hasValidBearerSecret(request: Request): boolean | "invalid" {
  const auth = request.headers.get("authorization")?.trim();
  if (!auth) return false;

  const secret =
    process.env.EMAIL_API_SECRET?.trim() ||
    process.env.NGA_TOKEN_SECRET?.trim();
  if (!secret) return "invalid";

  const expected = `Bearer ${secret}`;
  return safeEqualString(auth, expected) ? true : "invalid";
}

export type RequestAuthResult =
  | { ok: true }
  | { ok: false; status: 401 | 403; error: string };

/**
 * Authorize a mutating browser/API call:
 * - Bearer EMAIL_API_SECRET / NGA_TOKEN_SECRET, or
 * - same-origin browser request (Origin/Referer + Sec-Fetch-Site in production).
 */
export function authorizeBrowserMutation(request: Request): RequestAuthResult {
  const bearer = hasValidBearerSecret(request);
  if (bearer === true) return { ok: true };
  if (bearer === "invalid") {
    return { ok: false, status: 401, error: "Unauthorized." };
  }

  if (!isAllowedBrowserOrigin(request)) {
    return { ok: false, status: 403, error: "Forbidden origin." };
  }

  if (process.env.NODE_ENV === "production") {
    const site = (request.headers.get("sec-fetch-site") ?? "").toLowerCase();
    // Browsers set this on fetch(); cross-site pages cannot spoof it from JS.
    if (site && site !== "same-origin" && site !== "same-site") {
      return { ok: false, status: 403, error: "Forbidden request site." };
    }
  }

  return { ok: true };
}
