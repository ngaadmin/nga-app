import { createHash, randomBytes } from "crypto";
import { CONSENT_TOKEN_TTL_MS } from "@/lib/auth/consent-token";

/** Opaque token emailed to the parent. Only the hash is stored. */
export function generateOpaqueConsentToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashConsentToken(token: string): string {
  return createHash("sha256").update(token.trim(), "utf8").digest("hex");
}

export function consentRequestExpiresAt(from = new Date()): Date {
  return new Date(from.getTime() + CONSENT_TOKEN_TTL_MS);
}

export { CONSENT_TOKEN_TTL_MS };
