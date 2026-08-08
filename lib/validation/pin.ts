/** Shared 4-digit Parent PIN / legacy short-secret pattern. */
export const FOUR_DIGIT_PATTERN = /^\d{4}$/;

export function isFourDigitPin(value: string): boolean {
  return FOUR_DIGIT_PATTERN.test(value.trim());
}
