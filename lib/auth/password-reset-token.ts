import { createHmac, timingSafeEqual } from "crypto";

export type PasswordResetClaims = {
  userId: string;
  username: string;
  createdAt: string;
};

/** Password reset links remain usable for 1 hour. */
export const PASSWORD_RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

const TOKEN_PREFIX = "pr1";

export function isPasswordResetTokenUnexpired(createdAtIso: string): boolean {
  const createdAt = Date.parse(createdAtIso);
  if (!Number.isFinite(createdAt)) return false;
  return Date.now() - createdAt <= PASSWORD_RESET_TOKEN_TTL_MS;
}

function getTokenSecret(): string {
  const secret =
    process.env.NGA_TOKEN_SECRET?.trim() ||
    process.env.EMAIL_API_SECRET?.trim();
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "NGA_TOKEN_SECRET (or EMAIL_API_SECRET) must be set in production.",
    );
  }
  return "nga-dev-only-token-secret-change-me";
}

function toBase64Url(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function fromBase64Url(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signPayload(payloadB64: string): string {
  return createHmac("sha256", getTokenSecret())
    .update(payloadB64)
    .digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

/** Create a signed password-reset token bound to one Auth user. */
export function signPasswordResetToken(claims: PasswordResetClaims): string {
  const body = {
    v: 1 as const,
    i: claims.userId.trim(),
    u: claims.username.trim(),
    c: claims.createdAt,
  };
  const payloadB64 = toBase64Url(JSON.stringify(body));
  const sig = signPayload(payloadB64);
  return `${TOKEN_PREFIX}.${payloadB64}.${sig}`;
}

function parseResetPayload(payloadB64: string): PasswordResetClaims | null {
  try {
    const parsed = JSON.parse(fromBase64Url(payloadB64)) as {
      v?: number;
      i?: string;
      u?: string;
      c?: string;
    };
    if (
      parsed.v !== 1 ||
      typeof parsed.i !== "string" ||
      !parsed.i.trim() ||
      typeof parsed.u !== "string" ||
      !parsed.u.trim() ||
      typeof parsed.c !== "string"
    ) {
      return null;
    }
    return {
      userId: parsed.i.trim(),
      username: parsed.u.trim(),
      createdAt: parsed.c,
    };
  } catch {
    return null;
  }
}

/** Verify signature and return claims, or null if invalid. */
export function verifyPasswordResetToken(
  token: string,
): PasswordResetClaims | null {
  const trimmed = token.trim();
  const parts = trimmed.split(".");
  if (parts.length !== 3 || parts[0] !== TOKEN_PREFIX) return null;

  const payloadB64 = parts[1]!;
  const sig = parts[2]!;
  const expected = signPayload(payloadB64);
  if (!safeEqual(sig, expected)) return null;

  return parseResetPayload(payloadB64);
}
