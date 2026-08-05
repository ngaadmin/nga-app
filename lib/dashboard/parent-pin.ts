export const PARENT_PIN_STORAGE_KEY = "nga_parent_pin";

/** Master recovery token - only applied after explicit Forgot PIN recovery. */
export const RECOVERY_PARENT_PIN = "2580";

const PIN_PATTERN = /^\d{4}$/;

export function isValidPinFormat(pin: string): boolean {
  return PIN_PATTERN.test(pin.trim());
}

export function isParentPinConfigured(): boolean {
  if (typeof window === "undefined") return false;
  const stored = window.sessionStorage.getItem(PARENT_PIN_STORAGE_KEY);
  return Boolean(stored && isValidPinFormat(stored));
}

export function getStoredParentPin(): string | null {
  if (typeof window === "undefined") return null;
  const stored = window.sessionStorage.getItem(PARENT_PIN_STORAGE_KEY);
  if (!stored || !isValidPinFormat(stored)) return null;
  return stored;
}

export function verifyParentPin(input: string): boolean {
  if (!isValidPinFormat(input) || !isParentPinConfigured()) return false;
  return input.trim() === getStoredParentPin();
}

export function saveParentPin(pin: string): void {
  if (typeof window === "undefined" || !isValidPinFormat(pin)) return;
  window.sessionStorage.setItem(PARENT_PIN_STORAGE_KEY, pin.trim());
}

export function resetParentPinToRecovery(): void {
  saveParentPin(RECOVERY_PARENT_PIN);
}

/** Simulated parent email for guest-session recovery dispatch. */
export function resolveSimulatedParentEmail(username: string): string {
  const safe =
    username.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "") || "parent";
  return `${safe}.parent@nextgenachievers.app`;
}

/**
 * Simulated background email dispatch for PIN recovery.
 * Resolves when the mock service accepts the outbound job.
 */
export async function dispatchParentPinRecoveryEmail(
  parentEmail: string,
): Promise<{ dispatched: true; email: string; recoveryCode: string }> {
  await new Promise((resolve) => {
    window.setTimeout(resolve, 450);
  });

  if (typeof console !== "undefined") {
    console.info(
      `[NGA Recovery] Parent PIN recovery code (${RECOVERY_PARENT_PIN}) dispatched to ${parentEmail}`,
    );
  }

  return {
    dispatched: true,
    email: parentEmail,
    recoveryCode: RECOVERY_PARENT_PIN,
  };
}
