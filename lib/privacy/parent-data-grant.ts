import { createHmac, timingSafeEqual } from "crypto";

/** How long a parent PIN unlock lasts for view and download. */
export const PARENT_DATA_GRANT_TTL_MS = 15 * 60 * 1000;

export const PARENT_DATA_GRANT_COOKIE = "nga_parent_data";

function grantSecret(): string {
  const dedicated = process.env.NGA_TOKEN_SECRET?.trim();
  if (dedicated) return dedicated;
  if (process.env.NODE_ENV === "production") {
    throw new Error("NGA_TOKEN_SECRET must be set in production.");
  }
  return (
    process.env.EMAIL_API_SECRET?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.SUPABASE_SECRET_KEY?.trim() ||
    "nga-dev-only-token-secret-change-me"
  );
}

function sign(body: string): string {
  return createHmac("sha256", grantSecret()).update(body).digest("base64url");
}

export function signParentDataGrant(
  userId: string,
  now = Date.now(),
): string {
  const exp = now + PARENT_DATA_GRANT_TTL_MS;
  const body = `${userId}.${exp}`;
  return `${body}.${sign(body)}`;
}

export function readParentDataGrant(
  token: string | null | undefined,
  now = Date.now(),
): { userId: string } | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [userId, expText, mac] = parts;
  if (!userId || !expText || !mac) return null;
  const exp = Number(expText);
  if (!Number.isFinite(exp) || exp <= now) return null;
  const body = `${userId}.${expText}`;
  const expected = sign(body);
  const left = Buffer.from(mac);
  const right = Buffer.from(expected);
  if (left.length !== right.length) return null;
  if (!timingSafeEqual(left, right)) return null;
  return { userId };
}
