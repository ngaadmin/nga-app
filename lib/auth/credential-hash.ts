import { sha256Hex } from "@/lib/auth/sha256-sync";
import {
  isTemporaryPasswordHash,
  verifyTemporaryPassword,
} from "@/lib/auth/temporary-password";

const LEGACY_PREFIX = "nga1_";
const V2_PREFIX = "nga2_";

function getRandomValues(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  if (typeof globalThis.crypto?.getRandomValues !== "function") {
    throw new Error("Secure random generator is unavailable.");
  }
  globalThis.crypto.getRandomValues(bytes);
  return bytes;
}

function randomSaltHex(bytes = 16): string {
  return Array.from(getRandomValues(bytes))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Legacy FNV-1a digest - verify-only for existing local accounts. */
function legacyHashCredential(value: string): string {
  const normalized = value.trim();
  let hash = 2166136261;
  for (let i = 0; i < normalized.length; i += 1) {
    hash ^= normalized.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `${LEGACY_PREFIX}${(hash >>> 0).toString(16)}`;
}

/**
 * Salted SHA-256 credential digest: `nga2_<salt>_<digest>`.
 * Replaces the legacy unsalted FNV digest for new writes.
 */
export function hashCredential(value: string): string {
  const salt = randomSaltHex();
  const digest = sha256Hex(`${salt}\0${value.trim()}`);
  return `${V2_PREFIX}${salt}_${digest}`;
}

export function isCredentialHash(stored: string): boolean {
  return (
    stored.startsWith(V2_PREFIX) ||
    stored.startsWith(LEGACY_PREFIX) ||
    isTemporaryPasswordHash(stored)
  );
}

/** Constant-time-ish compare for hex digests. */
function digestsEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

/**
 * Verifies a plaintext credential against stored digests:
 * temporary (`nga_tmp1_`), salted (`nga2_`), or legacy FNV (`nga1_`).
 */
export function verifyCredential(value: string, stored: string): boolean {
  const trimmed = value.trim();
  if (!trimmed || !stored) return false;

  if (isTemporaryPasswordHash(stored)) {
    return verifyTemporaryPassword(trimmed, stored);
  }

  if (stored.startsWith(V2_PREFIX)) {
    const rest = stored.slice(V2_PREFIX.length);
    const sep = rest.indexOf("_");
    if (sep <= 0) return false;
    const salt = rest.slice(0, sep);
    const expected = rest.slice(sep + 1);
    if (!salt || !expected) return false;
    const actual = sha256Hex(`${salt}\0${trimmed}`);
    return digestsEqual(actual, expected);
  }

  if (stored.startsWith(LEGACY_PREFIX)) {
    return legacyHashCredential(trimmed) === stored;
  }

  return false;
}
