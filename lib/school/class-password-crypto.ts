import "server-only";

import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const VERSION = "v1";
const KEY_BYTES = 32;
const IV_BYTES = 12;
const TAG_BYTES = 16;

export const CLASS_PASSWORD_KEY_MISSING =
  'CLASS_PASSWORD_KEY is not set. Set a 32-byte AES-256-GCM key on the server before reading or writing a class password. Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'base64url\'))"';

export const CLASS_PASSWORD_KEY_INVALID =
  'CLASS_PASSWORD_KEY must be 32 bytes encoded as base64url (43 characters), standard base64 (44 characters ending in =), or hex (64 characters). Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'base64url\'))"';

export const CLASS_PASSWORD_COLUMN_MISSING =
  "class_password_enc is missing. Run the class password encryption migration in the Supabase SQL editor before reading or writing a class password.";

export const CLASS_PASSWORD_COLUMN_DENIED =
  "The server cannot read class_password_enc. Grant service_role select, insert, and update on class_password and class_password_enc.";

export const CLASS_PASSWORD_DECRYPT_FAILED =
  "Could not read the stored class password. CLASS_PASSWORD_KEY does not match the key that encrypted it, or the ciphertext is damaged.";

export type ClassPasswordCryptoErrorCode =
  | "missing_key"
  | "invalid_key"
  | "decrypt_failed"
  | "empty_password";

export class ClassPasswordCryptoError extends Error {
  readonly code: ClassPasswordCryptoErrorCode;

  constructor(code: ClassPasswordCryptoErrorCode, message: string) {
    super(message);
    this.name = "ClassPasswordCryptoError";
    this.code = code;
  }
}

export type ClassPasswordColumns = {
  class_password?: string | null;
  class_password_enc?: string | null;
};

/** Ciphertext write, or a plaintext clear once ciphertext is already stored. */
export type ClassPasswordBackfillWrite =
  | { class_password: null; class_password_enc: string }
  | { class_password: null };

export function isClassPasswordSetupError(message: string): boolean {
  return (
    message.includes("CLASS_PASSWORD_KEY") ||
    message.includes("class_password_enc")
  );
}

export function explainClassPasswordWriteError(message: string): string {
  const lower = message.toLowerCase();
  if (
    lower.includes("class_password_enc") &&
    /does not exist|schema cache|could not find/.test(lower)
  ) {
    return CLASS_PASSWORD_COLUMN_MISSING;
  }
  return message;
}

/** Reads CLASS_PASSWORD_KEY. Throws a clear error when it is missing or not 32 bytes. */
export function readClassPasswordKey(): Buffer {
  const raw = process.env.CLASS_PASSWORD_KEY;
  if (typeof raw !== "string" || raw.trim() === "") {
    throw new ClassPasswordCryptoError("missing_key", CLASS_PASSWORD_KEY_MISSING);
  }
  return decodeClassPasswordKey(raw);
}

function decodeClassPasswordKey(raw: string): Buffer {
  const trimmed = raw.trim();
  if (/^[0-9a-fA-F]{64}$/.test(trimmed)) {
    return Buffer.from(trimmed, "hex");
  }
  if (/^[A-Za-z0-9_-]{43}$/.test(trimmed)) {
    const key = Buffer.from(trimmed, "base64url");
    if (key.length === KEY_BYTES) return key;
  }
  if (/^[A-Za-z0-9+/]{43}=$/.test(trimmed)) {
    const key = Buffer.from(trimmed, "base64");
    if (key.length === KEY_BYTES) return key;
  }
  throw new ClassPasswordCryptoError("invalid_key", CLASS_PASSWORD_KEY_INVALID);
}

function teacherAad(teacherId: string): Buffer {
  const id = teacherId.trim().toLowerCase();
  if (!id) {
    throw new ClassPasswordCryptoError(
      "empty_password",
      "A profile id is required to encrypt a class password.",
    );
  }
  return Buffer.from(id, "utf8");
}

/**
 * AES-256-GCM payload: `v1.<iv>.<tag>.<ciphertext>` (base64url).
 * The profile id is additional authenticated data, so a ciphertext cannot be
 * moved onto another row and still decrypt.
 */
export function encryptClassPassword(plaintext: string, teacherId: string): string {
  if (plaintext.length === 0) {
    throw new ClassPasswordCryptoError(
      "empty_password",
      "Cannot encrypt an empty class password.",
    );
  }
  const key = readClassPasswordKey();
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  cipher.setAAD(teacherAad(teacherId));
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return [
    VERSION,
    iv.toString("base64url"),
    tag.toString("base64url"),
    ciphertext.toString("base64url"),
  ].join(".");
}

export function decryptClassPassword(stored: string, teacherId: string): string {
  const key = readClassPasswordKey();
  const parts = stored.trim().split(".");
  const [version, ivPart, tagPart, cipherPart] = parts;
  if (
    parts.length !== 4 ||
    version !== VERSION ||
    !ivPart ||
    !tagPart ||
    cipherPart === undefined
  ) {
    throw new ClassPasswordCryptoError("decrypt_failed", CLASS_PASSWORD_DECRYPT_FAILED);
  }

  let iv: Buffer;
  let tag: Buffer;
  let ciphertext: Buffer;
  try {
    iv = Buffer.from(ivPart, "base64url");
    tag = Buffer.from(tagPart, "base64url");
    ciphertext = Buffer.from(cipherPart, "base64url");
  } catch {
    throw new ClassPasswordCryptoError("decrypt_failed", CLASS_PASSWORD_DECRYPT_FAILED);
  }
  if (iv.length !== IV_BYTES || tag.length !== TAG_BYTES) {
    throw new ClassPasswordCryptoError("decrypt_failed", CLASS_PASSWORD_DECRYPT_FAILED);
  }

  try {
    const decipher = createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAAD(teacherAad(teacherId));
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString(
      "utf8",
    );
  } catch (error) {
    if (error instanceof ClassPasswordCryptoError) throw error;
    throw new ClassPasswordCryptoError("decrypt_failed", CLASS_PASSWORD_DECRYPT_FAILED);
  }
}

/** Columns for a new or replaced class password. Plaintext is stored as NULL. */
export function classPasswordCipherUpdate(
  plaintext: string,
  teacherId: string,
): { class_password: null; class_password_enc: string } {
  return {
    class_password: null,
    class_password_enc: encryptClassPassword(plaintext, teacherId),
  };
}

/**
 * One-off backfill of a single row.
 *
 * While `class_password` still holds a password, that plaintext is the value
 * students were given (older writes updated it together with the Auth
 * password). Encrypt it into `class_password_enc` and clear `class_password`.
 * Once plaintext is null, only the ciphertext is read.
 *
 * The class page does this on the next read or password change. Run
 * `scripts/backfill-class-password-enc.ts` to clear every row immediately.
 * Throws when the key is missing or ciphertext cannot be read — it never
 * returns a plaintext column write.
 */
export function planClassPasswordBackfill(
  row: ClassPasswordColumns,
  teacherId: string,
): { password: string; write: ClassPasswordBackfillWrite | null } {
  const legacy =
    typeof row.class_password === "string" ? row.class_password.trim() : "";
  const enc =
    typeof row.class_password_enc === "string" ? row.class_password_enc.trim() : "";

  if (legacy) {
    return {
      password: legacy,
      write: classPasswordCipherUpdate(legacy, teacherId),
    };
  }

  if (enc) {
    return {
      password: decryptClassPassword(enc, teacherId),
      write: row.class_password != null ? { class_password: null } : null,
    };
  }

  if (row.class_password != null) {
    return { password: "", write: { class_password: null } };
  }

  return { password: "", write: null };
}
