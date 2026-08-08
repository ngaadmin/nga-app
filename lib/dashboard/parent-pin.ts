import {
  hashCredential,
  isCredentialHash,
  verifyCredential,
} from "@/lib/auth/credential-hash";
import { generateRecoveryParentPin } from "@/lib/auth/temporary-password";
import {
  FOUR_DIGIT_PATTERN,
  isFourDigitPin,
} from "@/lib/validation/pin";

export const PARENT_PIN_STORAGE_KEY = "nga_parent_pin";

export function isValidPinFormat(pin: string): boolean {
  return isFourDigitPin(pin);
}

export function isParentPinConfigured(): boolean {
  if (typeof window === "undefined") return false;
  const stored = window.sessionStorage.getItem(PARENT_PIN_STORAGE_KEY);
  return Boolean(stored && stored.trim());
}

export function verifyParentPin(input: string): boolean {
  if (typeof window === "undefined" || !isValidPinFormat(input)) return false;
  const stored = window.sessionStorage.getItem(PARENT_PIN_STORAGE_KEY);
  if (!stored) return false;

  // Migrate legacy plaintext PIN on successful match.
  if (!isCredentialHash(stored) && isValidPinFormat(stored)) {
    if (input.trim() === stored.trim()) {
      saveParentPin(input);
      return true;
    }
    return false;
  }

  return verifyCredential(input, stored);
}

/** Persists a salted hash of the Parent PIN - never stores plaintext. */
export function saveParentPin(pin: string): void {
  if (typeof window === "undefined" || !isValidPinFormat(pin)) return;
  window.sessionStorage.setItem(PARENT_PIN_STORAGE_KEY, hashCredential(pin));
}

/**
 * Issues a fresh random 4-digit Parent PIN for parental-controls recovery.
 * Returns plaintext once for display/email; only the hash is stored.
 */
export function issueParentPinRecovery(): string {
  const pin = generateRecoveryParentPin();
  saveParentPin(pin);
  return pin;
}

/** Simulated parent email for guest-session recovery dispatch. */
export function resolveSimulatedParentEmail(username: string): string {
  const safe =
    username.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "") || "parent";
  return `${safe}.parent@nextgenachievers.app`;
}

/**
 * Simulated background email dispatch for Parent PIN recovery.
 * Callers must pass the PIN from {@link issueParentPinRecovery}.
 */
export async function dispatchParentPinRecoveryEmail(
  parentEmail: string,
  recoveryCode: string,
): Promise<{ dispatched: true; email: string; recoveryCode: string }> {
  await new Promise((resolve) => {
    window.setTimeout(resolve, 450);
  });

  const code = recoveryCode.trim();
  if (!FOUR_DIGIT_PATTERN.test(code)) {
    throw new Error("Parent PIN recovery code must be exactly 4 digits.");
  }

  return {
    dispatched: true,
    email: parentEmail,
    recoveryCode: code,
  };
}
