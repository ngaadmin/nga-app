import "server-only";

import { createHmac, timingSafeEqual } from "crypto";

/**
 * Short-lived proof that the Parent tab gate was opened in this tab.
 * The client keeps it in memory only, so leaving the tab, reloading or
 * backgrounding the app drops it. Scoped so it can't be reused as the
 * "My child's data" grant.
 */
export const PARENT_TAB_GATE_PASS_TTL_MS = 10 * 60 * 1000;
const SCOPE = "parent-tab";

function secret(): string {
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
  return createHmac("sha256", secret()).update(body).digest("base64url");
}

export function signParentTabGatePass(
  userId: string,
  now = Date.now(),
): string {
  const body = `${SCOPE}.${userId}.${now + PARENT_TAB_GATE_PASS_TTL_MS}`;
  return `${body}.${sign(body)}`;
}

export function parentTabGatePassValid(
  pass: unknown,
  userId: string,
  now = Date.now(),
): boolean {
  if (typeof pass !== "string" || !userId) return false;
  const parts = pass.split(".");
  if (parts.length !== 4) return false;
  const [scope, passUser, expText, mac] = parts;
  if (scope !== SCOPE || passUser !== userId || !mac) return false;
  const exp = Number(expText);
  if (!Number.isFinite(exp) || exp <= now) return false;
  const expected = Buffer.from(sign(`${scope}.${passUser}.${expText}`));
  const given = Buffer.from(mac);
  return expected.length === given.length && timingSafeEqual(expected, given);
}
