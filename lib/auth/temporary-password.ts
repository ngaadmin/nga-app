import { sha256Hex } from "@/lib/auth/sha256-sync";

/** Unambiguous alphabet (no 0/O/1/I) for 6-character temporary passwords. */
const TEMP_PASSWORD_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const TEMP_PASSWORD_LENGTH = 6;
const TEMP_HASH_PREFIX = "nga_tmp1_";

function getRandomValues(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  if (typeof globalThis.crypto?.getRandomValues !== "function") {
    throw new Error("Secure random generator is unavailable.");
  }
  globalThis.crypto.getRandomValues(bytes);
  return bytes;
}

/** Crypto-secure random 6-character temporary password (server-issued). */
export function generateTemporaryPassword(
  length = TEMP_PASSWORD_LENGTH,
): string {
  const bytes = getRandomValues(length);
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += TEMP_PASSWORD_ALPHABET[bytes[i]! % TEMP_PASSWORD_ALPHABET.length]!;
  }
  return out;
}

/** Random 4-digit Parent PIN for parental-controls recovery (not login). */
export function generateRecoveryParentPin(): string {
  const bytes = getRandomValues(4);
  let out = "";
  for (let i = 0; i < 4; i += 1) {
    out += String(bytes[i]! % 10);
  }
  return out;
}

export function isTemporaryPasswordHash(stored: string): boolean {
  return stored.startsWith(TEMP_HASH_PREFIX);
}

/**
 * Salted SHA-256 digest: `nga_tmp1_<saltHex>_<digestHex>`.
 * Salt is random when omitted (issuance); provide salt to re-hash for verify.
 */
export function hashTemporaryPassword(password: string, saltHex?: string): string {
  const salt =
    saltHex ??
    Array.from(getRandomValues(16))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  const digest = sha256Hex(`${salt}\0${password.trim()}`);
  return `${TEMP_HASH_PREFIX}${salt}_${digest}`;
}

export function verifyTemporaryPassword(
  password: string,
  stored: string,
): boolean {
  if (!isTemporaryPasswordHash(stored)) return false;
  const rest = stored.slice(TEMP_HASH_PREFIX.length);
  const sep = rest.indexOf("_");
  if (sep <= 0) return false;
  const saltHex = rest.slice(0, sep);
  const expected = rest.slice(sep + 1);
  if (!saltHex || !expected) return false;
  const actual = hashTemporaryPassword(password, saltHex);
  const actualDigest = actual.slice(TEMP_HASH_PREFIX.length + saltHex.length + 1);
  if (actualDigest.length !== expected.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expected.length; i += 1) {
    mismatch |= expected.charCodeAt(i) ^ actualDigest.charCodeAt(i);
  }
  return mismatch === 0;
}
