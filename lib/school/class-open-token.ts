import { createHmac, timingSafeEqual } from "crypto";

export type ClassOpenTokenClaims = {
  userId: string;
  email: string;
  createdAt: string;
};

const TOKEN_PREFIX = "cls";
const CLASS_OPEN_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

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

export function signClassOpenToken(claims: ClassOpenTokenClaims): string {
  const body = {
    v: 1 as const,
    i: claims.userId.trim(),
    e: claims.email.trim().toLowerCase(),
    c: claims.createdAt,
  };
  const payloadB64 = toBase64Url(JSON.stringify(body));
  return `${TOKEN_PREFIX}.${payloadB64}.${signPayload(payloadB64)}`;
}

export function verifyClassOpenToken(
  token: string,
): ClassOpenTokenClaims | null {
  const trimmed = token.trim();
  const parts = trimmed.split(".");
  if (parts.length !== 3 || parts[0] !== TOKEN_PREFIX) return null;

  const payloadB64 = parts[1]!;
  const sig = parts[2]!;
  if (!safeEqual(sig, signPayload(payloadB64))) return null;

  try {
    const parsed = JSON.parse(fromBase64Url(payloadB64)) as {
      v?: number;
      i?: string;
      e?: string;
      c?: string;
    };
    if (
      parsed.v !== 1 ||
      typeof parsed.i !== "string" ||
      typeof parsed.e !== "string" ||
      typeof parsed.c !== "string"
    ) {
      return null;
    }
    const createdAt = Date.parse(parsed.c);
    if (!Number.isFinite(createdAt)) return null;
    if (Date.now() - createdAt > CLASS_OPEN_TOKEN_TTL_MS) return null;
    return {
      userId: parsed.i.trim(),
      email: parsed.e.trim().toLowerCase(),
      createdAt: parsed.c,
    };
  } catch {
    return null;
  }
}
