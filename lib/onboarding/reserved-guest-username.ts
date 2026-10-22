/**
 * Guest handles are Penny plus four digits (Penny1842), or PennyX plus four
 * digits when the local pool overflows (PennyX0042). Real accounts cannot
 * take either pattern. The database trigger is the backstop.
 */
export const RESERVED_GUEST_USERNAME_PATTERN = /^pennyx?\d{4}$/i;

export const RESERVED_GUEST_USERNAME_ERROR =
  "That username is reserved. Pick another one.";

export function isReservedGuestUsername(username: string): boolean {
  return RESERVED_GUEST_USERNAME_PATTERN.test(username.trim());
}
