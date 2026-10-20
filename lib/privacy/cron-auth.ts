import { timingSafeEqual } from "crypto";

function safeEqualString(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

/**
 * Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` when that env var is set.
 * Missing or wrong secrets fail closed. Browser sessions are not accepted.
 */
export function authorizeCronRequest(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim() ?? "";
  if (!secret) return false;
  const header = request.headers.get("authorization")?.trim() ?? "";
  return safeEqualString(header, `Bearer ${secret}`);
}
