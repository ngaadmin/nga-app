import { verifyCredential } from "@/lib/auth/credential-hash";
import { isFourDigitPin } from "@/lib/validation/pin";

export const PARENT_PIN_GATE_COPY = {
  required: "Enter the parent PIN to delete this account.",
  wrong: "That PIN didn't match. Try again.",
  missing: "Set a parent PIN in Settings before you delete an account.",
  limited: "Too many PIN attempts. Wait a few minutes, then try again.",
} as const;

/**
 * Server-side parent PIN check. The stored value is the salted hash on
 * profiles.parent_pin_hash. A missing hash does not mean "no PIN required".
 */
export function assessParentPin(
  pin: unknown,
  storedHash: string | null | undefined,
): { ok: true } | { ok: false; error: string } {
  const hash = storedHash?.trim() ?? "";
  if (!hash) {
    return { ok: false, error: PARENT_PIN_GATE_COPY.missing };
  }
  if (typeof pin !== "string" || !isFourDigitPin(pin)) {
    return { ok: false, error: PARENT_PIN_GATE_COPY.required };
  }
  if (!verifyCredential(pin, hash)) {
    return { ok: false, error: PARENT_PIN_GATE_COPY.wrong };
  }
  return { ok: true };
}
