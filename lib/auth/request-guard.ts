import { timingSafeEqual } from "crypto";
import { allowedEmailLinkHosts } from "@/lib/email/templates";

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

function isLoopbackHost(host: string): boolean {
  const hostname = host.replace(/:\d+$/, "").replace(/^\[|\]$/g, "");
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

/**
 * Deployment hosts that may call mutating routes.
 * The incoming Host header is not an allowlist entry: a script can set Host
 * and Origin to the same attacker-controlled value.
 * Loopback is accepted only off Vercel, for local `next dev` / `next start`.
 */
export function allowedDeploymentHosts(request?: Request): Set<string> {
  const allowedHosts = allowedEmailLinkHosts();

  if (!process.env.VERCEL && request) {
    const host = request.headers.get("host")?.trim().toLowerCase();
    if (host && isLoopbackHost(host)) allowedHosts.add(host);
  }

  return allowedHosts;
}

function originHost(value: string): string | null {
  try {
    return new URL(value).host.toLowerCase();
  } catch {
    return null;
  }
}

/**
 * True when every presented Origin/Referer matches an allowed deployment host.
 * Production requires at least one of them. Development may omit both.
 */
export function isAllowedBrowserOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const candidates = [origin, referer].filter(
    (value): value is string => Boolean(value?.trim()),
  );

  if (candidates.length === 0) {
    return process.env.NODE_ENV !== "production";
  }

  const allowedHosts = allowedDeploymentHosts(request);
  return candidates.every((value) => {
    const host = originHost(value);
    return host !== null && allowedHosts.has(host);
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
 * - same-origin browser request.
 *
 * Production requires Origin or Referer on the deployment allowlist (not the
 * request Host) and a browser Sec-Fetch-Site of same-origin or same-site.
 * Sec-Fetch-Site stops cross-site browser calls. It is not authentication:
 * a script can still set headers, so routes that send email or change
 * accounts need a session or a server-issued token as well.
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
    if (site !== "same-origin" && site !== "same-site") {
      return { ok: false, status: 403, error: "Forbidden request site." };
    }
  }

  return { ok: true };
}
