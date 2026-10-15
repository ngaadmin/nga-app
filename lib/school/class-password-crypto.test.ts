import { readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  CLASS_PASSWORD_DECRYPT_FAILED,
  CLASS_PASSWORD_KEY_INVALID,
  CLASS_PASSWORD_KEY_MISSING,
  classPasswordCipherUpdate,
  decryptClassPassword,
  encryptClassPassword,
  planClassPasswordBackfill,
} from "@/lib/school/class-password-crypto";

const TEACHER_ID = "11111111-1111-4111-8111-111111111111";
const KEY = Buffer.alloc(32, 4);

let originalKey: string | undefined;

beforeEach(() => {
  originalKey = process.env.CLASS_PASSWORD_KEY;
  process.env.CLASS_PASSWORD_KEY = KEY.toString("base64url");
});

afterEach(() => {
  if (originalKey === undefined) delete process.env.CLASS_PASSWORD_KEY;
  else process.env.CLASS_PASSWORD_KEY = originalKey;
});

describe("class password AES-256-GCM", () => {
  it("round-trips and uses a fresh iv each time", () => {
    const first = encryptClassPassword("Banana", TEACHER_ID);
    const second = encryptClassPassword("Banana", TEACHER_ID);
    expect(first).not.toBe(second);
    expect(first.startsWith("v1.")).toBe(true);
    expect(decryptClassPassword(first, TEACHER_ID)).toBe("Banana");
    expect(decryptClassPassword(second, TEACHER_ID.toUpperCase())).toBe("Banana");
  });

  it("accepts the same key as hex or standard base64", () => {
    const stored = encryptClassPassword("Harbor", TEACHER_ID);
    process.env.CLASS_PASSWORD_KEY = KEY.toString("hex");
    expect(decryptClassPassword(stored, TEACHER_ID)).toBe("Harbor");
    process.env.CLASS_PASSWORD_KEY = KEY.toString("base64");
    expect(decryptClassPassword(stored, TEACHER_ID)).toBe("Harbor");
  });

  it("does not put the password in the ciphertext or the stored columns", () => {
    const password = "Class password!";
    const update = classPasswordCipherUpdate(password, TEACHER_ID);
    expect(update.class_password).toBeNull();
    expect(update.class_password_enc.includes(password)).toBe(false);
    expect(decryptClassPassword(update.class_password_enc, TEACHER_ID)).toBe(
      password,
    );
  });

  it("refuses a ciphertext encrypted for another profile", () => {
    const stored = encryptClassPassword("Banana", TEACHER_ID);
    expect(() => decryptClassPassword(stored, `${TEACHER_ID}-other`)).toThrow(
      CLASS_PASSWORD_DECRYPT_FAILED,
    );
  });

  it("refuses a tampered ciphertext and a wrong key", () => {
    const stored = encryptClassPassword("Banana", TEACHER_ID);
    const parts = stored.split(".");
    const body = Buffer.from(parts[3] ?? "", "base64url");
    body[0] = (body[0] ?? 0) ^ 0xff;
    parts[3] = body.toString("base64url");
    expect(() => decryptClassPassword(parts.join("."), TEACHER_ID)).toThrow(
      CLASS_PASSWORD_DECRYPT_FAILED,
    );

    process.env.CLASS_PASSWORD_KEY = Buffer.alloc(32, 9).toString("base64url");
    expect(() => decryptClassPassword(stored, TEACHER_ID)).toThrow(
      CLASS_PASSWORD_DECRYPT_FAILED,
    );
  });

  it("fails with a clear error when the key is missing or the wrong size", () => {
    delete process.env.CLASS_PASSWORD_KEY;
    expect(() => encryptClassPassword("Banana", TEACHER_ID)).toThrow(
      CLASS_PASSWORD_KEY_MISSING,
    );

    process.env.CLASS_PASSWORD_KEY = "   ";
    expect(() => encryptClassPassword("Banana", TEACHER_ID)).toThrow(
      CLASS_PASSWORD_KEY_MISSING,
    );

    process.env.CLASS_PASSWORD_KEY = "not-a-key";
    expect(() => encryptClassPassword("Banana", TEACHER_ID)).toThrow(
      CLASS_PASSWORD_KEY_INVALID,
    );

    process.env.CLASS_PASSWORD_KEY = "a".repeat(32);
    expect(() => readKeyViaEncrypt()).toThrow(CLASS_PASSWORD_KEY_INVALID);
  });

  it("migrates plaintext into ciphertext and then only decrypts", () => {
    const first = planClassPasswordBackfill(
      { class_password: "Banana", class_password_enc: "stale-cipher" },
      TEACHER_ID,
    );
    expect(first.password).toBe("Banana");
    expect(first.write?.class_password).toBeNull();
    expect(first.write && "class_password_enc" in first.write).toBe(true);
    if (!first.write || !("class_password_enc" in first.write)) {
      throw new Error("expected ciphertext write");
    }
    expect(first.write.class_password_enc.includes("Banana")).toBe(false);
    expect(decryptClassPassword(first.write.class_password_enc, TEACHER_ID)).toBe(
      "Banana",
    );

    const second = planClassPasswordBackfill(
      { class_password: null, class_password_enc: first.write.class_password_enc },
      TEACHER_ID,
    );
    expect(second).toEqual({ password: "Banana", write: null });
  });

  it("clears leftover plaintext without re-encrypting when ciphertext is the only secret", () => {
    const enc = encryptClassPassword("Orange", TEACHER_ID);
    const blank = planClassPasswordBackfill(
      { class_password: "   ", class_password_enc: enc },
      TEACHER_ID,
    );
    expect(blank).toEqual({
      password: "Orange",
      write: { class_password: null },
    });
  });

  it("does not write when the key is missing and plaintext still exists", () => {
    delete process.env.CLASS_PASSWORD_KEY;
    expect(() =>
      planClassPasswordBackfill(
        { class_password: "Banana", class_password_enc: null },
        TEACHER_ID,
      ),
    ).toThrow(CLASS_PASSWORD_KEY_MISSING);
  });

  it("nulls a blank legacy value without inventing a password", () => {
    delete process.env.CLASS_PASSWORD_KEY;
    expect(
      planClassPasswordBackfill(
        { class_password: " ", class_password_enc: null },
        TEACHER_ID,
      ),
    ).toEqual({ password: "", write: { class_password: null } });
  });
});

describe("class password migration sql", () => {
  const sql = readFileSync(
    path.join(
      process.cwd(),
      "supabase/migrations/20261015000000_class_password_enc.sql",
    ),
    "utf8",
  );

  it("adds the ciphertext column idempotently and keeps the legacy column", () => {
    expect(sql).toContain("ADD COLUMN IF NOT EXISTS class_password_enc text");
    expect(sql).toContain("CREATE OR REPLACE FUNCTION public.protect_profile_columns()");
    expect(sql).toContain("NEW.class_password_enc IS DISTINCT FROM OLD.class_password_enc");
    expect(sql).not.toMatch(/drop\s+column/i);
  });

  it("stops browser roles from reading or writing either password column", () => {
    expect(sql).toContain(
      "REVOKE SELECT (class_password, class_password_enc)",
    );
    expect(sql).toContain(
      "REVOKE UPDATE (class_password, class_password_enc)",
    );
    expect(sql).toContain("FROM PUBLIC, anon, authenticated");
  });
});

function readKeyViaEncrypt(): string {
  return encryptClassPassword("Banana", TEACHER_ID);
}
