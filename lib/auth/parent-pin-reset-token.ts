import { createHmac, timingSafeEqual } from "crypto";
import { getPasswordResetTokenSecretSource } from "@/lib/auth/password-reset-token";

export type ParentPinResetClaims = {
  userId: string;
  nonce: string;
  createdAt: string;
};

/** PIN reset links stay usable for about 30 minutes. */
export const PARENT_PIN_RESET_TTL_MS = 30 * 60 * 1000;

const TOKEN_PREFIX = "pin1";

function getTokenSecret(): string {
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

function toBase64Url(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function fromBase64Url(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signPayload(payloadB64: string): string {
  return createHmac("sha256", getTokenSecret()).update(payloadB64).digest("base64url");
}

export function parentPinResetSecretReady(): boolean {
  if (process.env.NODE_ENV === "production") {
    return getPasswordResetTokenSecretSource() === "nga_token_secret";
  }
  return true;
}

export function signParentPinResetToken(claims: ParentPinResetClaims): string {
  const body = {
    v: 1 as const,
    i: claims.userId.trim(),
    n: claims.nonce.trim(),
    c: claims.createdAt,
  };
  const payloadB64 = toBase64Url(JSON.stringify(body));
  return `${TOKEN_PREFIX}.${payloadB64}.${signPayload(payloadB64)}`;
}

export function verifyParentPinResetToken(token: string): ParentPinResetClaims | null {
  const parts = token.trim().split(".");
  if (parts.length !== 3 || parts[0] !== TOKEN_PREFIX) return null;
  const [, payloadB64, sig] = parts;
  if (!payloadB64 || !sig) return null;
  const expected = signPayload(payloadB64);
  const left = Buffer.from(sig);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) return null;
  try {
    const parsed = JSON.parse(fromBase64Url(payloadB64)) as {
      v?: number;
      i?: string;
      n?: string;
      c?: string;
    };
    if (
      parsed.v !== 1 ||
      typeof parsed.i !== "string" ||
      !parsed.i.trim() ||
      typeof parsed.n !== "string" ||
      !parsed.n.trim() ||
      typeof parsed.c !== "string"
    ) {
      return null;
    }
    return { userId: parsed.i.trim(), nonce: parsed.n.trim(), createdAt: parsed.c };
  } catch {
    return null;
  }
}

export function isParentPinResetTokenUnexpired(createdAtIso: string, now = Date.now()): boolean {
  const createdAt = Date.parse(createdAtIso);
  if (!Number.isFinite(createdAt)) return false;
  return now - createdAt <= PARENT_PIN_RESET_TTL_MS && now >= createdAt;
}
