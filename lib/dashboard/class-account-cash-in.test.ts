import { describe, expect, it } from "vitest";
import {
  CLASS_ACCOUNT_XP_MESSAGE,
  cashInClaimAllowed,
  cashInRateMissingMessage,
  shouldSendParentCashInEmail,
} from "@/lib/dashboard/class-account-cash-in";

const askParentBody =
  "Ask your parent to set that rate in Settings. Then you can cash in right here.";
const askParentIfParentBody =
  "Set the coins exchange rate in Settings. Then coins can be cashed in here.";

describe("class account cash-in", () => {
  it("replaces the ask-a-parent message and keeps cash-in off without inventing a rate", () => {
    expect(
      cashInRateMissingMessage({
        classAccountWithoutParent: true,
        isParentMaster: false,
        askParentBody,
        askParentIfParentBody,
      }),
    ).toBe(CLASS_ACCOUNT_XP_MESSAGE);

    expect(
      cashInClaimAllowed({
        classAccountWithoutParent: true,
        xpExchangeRateSet: false,
        parsedPoints: 20,
        totalPoints: 20,
        audPayout: 1,
        isClaiming: false,
      }),
    ).toBe(false);

    expect(
      cashInClaimAllowed({
        classAccountWithoutParent: true,
        xpExchangeRateSet: true,
        parsedPoints: 20,
        totalPoints: 20,
        audPayout: 1,
        isClaiming: false,
      }),
    ).toBe(false);

    expect(shouldSendParentCashInEmail(true)).toBe(false);
  });

  it("still asks a household learner to get a parent rate", () => {
    expect(
      cashInRateMissingMessage({
        classAccountWithoutParent: false,
        isParentMaster: false,
        askParentBody,
        askParentIfParentBody,
      }),
    ).toBe(askParentBody);
    expect(shouldSendParentCashInEmail(false)).toBe(true);
  });
});
