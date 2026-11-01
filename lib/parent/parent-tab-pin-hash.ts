import "server-only";

import { pbkdf2, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { PARENT_TAB_PIN_ITERATIONS } from "@/lib/parent/parent-tab-pin";

const pbkdf2Async = promisify(pbkdf2);

/** PBKDF2-SHA-256, 32-byte digest, base64. */
export async function hashParentTabPin(
  pin: string,
  saltB64: string,
  iterations: number,
): Promise<string> {
  const digest = await pbkdf2Async(
    pin,
    Buffer.from(saltB64, "base64"),
    iterations,
    32,
    "sha256",
  );
  return digest.toString("base64");
}

export async function newParentTabPinHash(pin: string): Promise<{
  hash: string;
  salt: string;
  iterations: number;
}> {
  const salt = randomBytes(16).toString("base64");
  const iterations = PARENT_TAB_PIN_ITERATIONS;
  return { hash: await hashParentTabPin(pin, salt, iterations), salt, iterations };
}

/** Constant-time compare of two base64 digests. */
export function parentTabPinHashesMatch(left: string, right: string): boolean {
  const a = Buffer.from(left, "base64");
  const b = Buffer.from(right, "base64");
  if (a.length === 0 || a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
