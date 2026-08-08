import { createHmac, timingSafeEqual } from "crypto";

export type ConsentTokenClaims = {
  parentEmail: string;
  childUsername: string;
  birthYear: number;
  createdAt: string;
  passcodeHash?: string;
};

/** Parental consent / approval links remain usable for 24 hours. */
export const CONSENT_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

const TOKEN_PREFIX = "v2";

/** True when the token's createdAt is still inside the consent TTL window. */
export function isConsentTokenUnexpired(createdAtIso: string): boolean {
  const createdAt = Date.parse(createdAtIso);
  if (!Number.isFinite(createdAt)) return false;
  return Date.now() - createdAt <= CONSENT_TOKEN_TTL_MS;
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

/** Create a signed portable consent token (server-only). */
export function signConsentToken(claims: ConsentTokenClaims): string {
  const body = {
    v: 2 as const,
    e: claims.parentEmail.trim().toLowerCase(),
    u: claims.childUsername.trim(),
    y: claims.birthYear,
    c: claims.createdAt,
    ...(claims.passcodeHash ? { p: claims.passcodeHash } : {}),
  };
  const payloadB64 = toBase64Url(JSON.stringify(body));
  const sig = signPayload(payloadB64);
  return `${TOKEN_PREFIX}.${payloadB64}.${sig}`;
}

function parseConsentPayload(payloadB64: string): ConsentTokenClaims | null {
  try {
    const parsed = JSON.parse(fromBase64Url(payloadB64)) as {
      v?: number;
      e?: string;
      u?: string;
      y?: number;
      c?: string;
      p?: string;
    };
    if (
      parsed.v !== 2 ||
      typeof parsed.e !== "string" ||
      typeof parsed.u !== "string" ||
      typeof parsed.y !== "number" ||
      !Number.isInteger(parsed.y) ||
      typeof parsed.c !== "string"
    ) {
      return null;
    }
    return {
      parentEmail: parsed.e.trim().toLowerCase(),
      childUsername: parsed.u.trim(),
      birthYear: parsed.y,
      createdAt: parsed.c,
      passcodeHash:
        typeof parsed.p === "string" && parsed.p.trim()
          ? parsed.p.trim()
          : undefined,
    };
  } catch {
    return null;
  }
}

/** Verify signature and return claims, or null if invalid. */
export function verifyConsentToken(token: string): ConsentTokenClaims | null {
  const trimmed = token.trim();
  const parts = trimmed.split(".");
  if (parts.length !== 3 || parts[0] !== TOKEN_PREFIX) return null;

  const payloadB64 = parts[1]!;
  const sig = parts[2]!;
  const expected = signPayload(payloadB64);
  if (!safeEqual(sig, expected)) return null;

  return parseConsentPayload(payloadB64);
}
