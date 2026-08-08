import { hashCredential } from "@/lib/auth/credential-hash";
import { isFourDigitPin } from "@/lib/validation/pin";

export type ExplorerPasswordHashInput = {
  /**
   * Explorer login password (min 6). Named `passcode` at some call sites for
   * the consent-token API bridge; storage field remains `passcodeHash`.
   */
  passcode?: string;
  /** Preferred plain password field when available. */
  password?: string;
  passcodeHash?: string;
};

/**
 * Resolve the Explorer login credential digest.
 * Accepts an existing hash, or hashes a plaintext password (min 6).
 * Legacy 4-digit values still hash for older local accounts.
 */
export function resolvePasscodeHash(
  input: ExplorerPasswordHashInput,
): string | undefined {
  if (typeof input.passcodeHash === "string" && input.passcodeHash.trim()) {
    return input.passcodeHash.trim();
  }

  const plain =
    typeof input.passcode === "string" && input.passcode.length > 0
      ? input.passcode
      : typeof input.password === "string" && input.password.length > 0
        ? input.password
        : "";

  if (!plain) return undefined;

  const trimmed = plain.trim();
  if (trimmed.length < 6 && !isFourDigitPin(trimmed)) {
    throw new Error("Explorer password must be at least 6 characters.");
  }
  return hashCredential(trimmed);
}
