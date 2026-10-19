/** Shown instead of the ask-a-parent line for a class seat with no linked parent. */
export const CLASS_ACCOUNT_XP_MESSAGE =
  "Your XP counts towards your class total! 🏆";

export function cashInRateMissingMessage(input: {
  classAccountWithoutParent: boolean;
  isParentMaster: boolean;
  askParentBody: string;
  askParentIfParentBody: string;
}): string {
  if (input.classAccountWithoutParent) return CLASS_ACCOUNT_XP_MESSAGE;
  return input.isParentMaster ? input.askParentIfParentBody : input.askParentBody;
}

/**
 * Class seats with no parent stay unable to cash in.
 * A missing exchange rate also stays disabled. This does not invent a rate.
 */
export function cashInClaimAllowed(input: {
  classAccountWithoutParent: boolean;
  xpExchangeRateSet: boolean;
  parsedPoints: number | null;
  totalPoints: number;
  audPayout: number;
  isClaiming: boolean;
  isGuest?: boolean;
}): boolean {
  if (input.classAccountWithoutParent || input.isGuest) return false;
  return (
    input.xpExchangeRateSet &&
    input.parsedPoints !== null &&
    input.parsedPoints > 0 &&
    input.parsedPoints <= input.totalPoints &&
    Number.isFinite(input.audPayout) &&
    input.audPayout > 0 &&
    !input.isClaiming
  );
}

/** Class seats with no linked parent must not send the parent cash-in email. */
export function shouldSendParentCashInEmail(classAccountWithoutParent: boolean): boolean {
  return !classAccountWithoutParent;
}
