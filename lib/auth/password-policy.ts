/**
 * Password length rules.
 *
 * Parent and teacher accounts are adult accounts that unlock Parent Hub,
 * child data downloads and class rosters, so they need a longer password.
 * Learner (child) accounts keep the shorter minimum.
 *
 * Only new passwords are checked: sign-in still accepts any existing
 * password, so nobody is forced to change one they already have.
 */

/** Minimum length for a new parent or teacher password. */
export const ADULT_PASSWORD_MIN_LENGTH = 10;

/** Minimum length for a new learner (child) password. */
export const LEARNER_PASSWORD_MIN_LENGTH = 6;

export const ADULT_PASSWORD_TOO_SHORT_ERROR = `Use at least ${ADULT_PASSWORD_MIN_LENGTH} characters for your password.`;

export const LEARNER_PASSWORD_TOO_SHORT_ERROR = `Use at least ${LEARNER_PASSWORD_MIN_LENGTH} characters for your password.`;

/** True for account roles that must use the adult minimum. */
export function isAdultAccountRole(role: string | null | undefined): boolean {
  return role === "parent_master" || role === "teacher";
}

/** Minimum new-password length for an account role. */
export function passwordMinLengthForRole(role: string | null | undefined): number {
  return isAdultAccountRole(role)
    ? ADULT_PASSWORD_MIN_LENGTH
    : LEARNER_PASSWORD_MIN_LENGTH;
}

/** Error copy for a too-short new password, or null when it is long enough. */
export function newPasswordLengthError(
  password: string,
  minLength: number,
): string | null {
  if (password.length >= minLength) return null;
  return `Use at least ${minLength} characters for your password.`;
}
