import { describe, expect, it } from "vitest";
import type { PersistedDashboardWallet } from "@/lib/dashboard/dashboard-wallet-storage";
import { dollarsToCents } from "@/lib/dashboard/vault-amount-input";
import {
  addCentsToDollars,
  beginCashInAttempt,
  cashInLockReason,
  convertPointsToCents,
  endCashInAttempt,
  formatXpCashPreview,
  parseExchangeRateToCents,
  pickExchangeRate,
  planCashBucketAssignment,
  readLifetimeXp,
  readSpendableXp,
  resolveExchangeRateCents,
  spendSpendableXp,
  validateCashInPoints,
  withExchangeRate,
} from "@/lib/dashboard/xp-cash";
import { convertPointsToCents as pointsToCents } from "@/lib/dashboard/point-conversion";

function wallet(
  partial: Partial<PersistedDashboardWallet> &
    Pick<PersistedDashboardWallet, "totalPoints" | "lifetimePointsEarned">,
): PersistedDashboardWallet {
  return {
    audSliderIndex: 2,
    xpExchangeRateSet: false,
    ...partial,
  };
}

describe("XP cash conversion", () => {
  it("turns 500 XP at $2 per 100 into $10.00", () => {
    expect(convertPointsToCents(500, 200)).toBe(1000);
    expect(pointsToCents(500, 200)).toBe(1000);
  });

  it("accepts $3 and 50 cents per 100 XP", () => {
    expect(parseExchangeRateToCents("3")).toBe(300);
    expect(parseExchangeRateToCents("$0.50")).toBe(50);
    expect(parseExchangeRateToCents("2.5")).toBe(250);
    expect(convertPointsToCents(100, 300)).toBe(300);
    expect(convertPointsToCents(100, 50)).toBe(50);
  });

  it("rounds half-up to the nearest cent and rejects a zero payout rate path", () => {
    expect(convertPointsToCents(1, 50)).toBe(1);
    expect(convertPointsToCents(1, 1)).toBe(0);
    expect(convertPointsToCents(3, 50)).toBe(2);
  });

  it("rejects empty, zero, and oversized rates", () => {
    expect(parseExchangeRateToCents("")).toBeNull();
    expect(parseExchangeRateToCents("0")).toBeNull();
    expect(parseExchangeRateToCents("0.001")).toBeNull();
    expect(parseExchangeRateToCents("-2")).toBeNull();
  });
});

describe("cash-in amount validation", () => {
  it("accepts a whole number inside the spendable balance", () => {
    expect(validateCashInPoints("40", 100)).toEqual({ ok: true, points: 40 });
    expect(validateCashInPoints("100", 100)).toEqual({ ok: true, points: 100 });
  });

  it("rejects empty, decimals, zero, and amounts over the balance", () => {
    expect(validateCashInPoints("", 10).ok).toBe(false);
    expect(validateCashInPoints("1.5", 10)).toEqual({ ok: false, error: "not-whole" });
    expect(validateCashInPoints("0", 10)).toEqual({ ok: false, error: "not-positive" });
    expect(validateCashInPoints("11", 10)).toEqual({ ok: false, error: "over-balance" });
  });
});

describe("cash-in unlock", () => {
  it("stays locked for guests, class seats, and a missing rate", () => {
    expect(
      cashInLockReason({
        sessionReady: true,
        classStatusReady: true,
        isGuest: true,
        classAccountWithoutParent: false,
        rateSet: true,
      }),
    ).toBe("guest");
    expect(
      cashInLockReason({
        sessionReady: true,
        classStatusReady: true,
        isGuest: false,
        classAccountWithoutParent: true,
        rateSet: true,
      }),
    ).toBe("class-seat");
    expect(
      cashInLockReason({
        sessionReady: true,
        classStatusReady: true,
        isGuest: false,
        classAccountWithoutParent: false,
        rateSet: false,
      }),
    ).toBe("rate-missing");
    expect(
      cashInLockReason({
        sessionReady: true,
        classStatusReady: true,
        isGuest: false,
        classAccountWithoutParent: false,
        rateSet: true,
      }),
    ).toBe("ready");
  });
});

describe("spendable cash-in versus lifetime XP", () => {
  it("reduces spendable XP, leaves lifetime XP, and adds cents to the cash bucket", () => {
    const saved = withExchangeRate(
      wallet({ totalPoints: 500, lifetimePointsEarned: 800 }),
      200,
      "2026-10-01T00:00:00.000Z",
    );
    const result = spendSpendableXp(saved, 500, {
      id: "cash-1",
      at: "2026-10-02T00:00:00.000Z",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(readSpendableXp(result.wallet)).toBe(0);
    expect(readLifetimeXp(result.wallet)).toBe(800);
    expect(result.audCents).toBe(1000);
    expect(formatXpCashPreview(500, "$10.00")).toBe("500 XP = $10.00");

    const bucket = addCentsToDollars(0, result.audCents);
    expect(dollarsToCents(bucket)).toBe(1000);
    const again = addCentsToDollars(bucket, 50);
    expect(dollarsToCents(again)).toBe(1050);
  });

  it("does not pay the same cash-in id twice", () => {
    const saved = withExchangeRate(
      wallet({ totalPoints: 100, lifetimePointsEarned: 100 }),
      100,
      "2026-10-01T00:00:00.000Z",
    );
    const first = spendSpendableXp(saved, 40, {
      id: "same",
      at: "2026-10-02T00:00:00.000Z",
    });
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    const second = spendSpendableXp(first.wallet, 40, {
      id: "same",
      at: "2026-10-02T00:00:01.000Z",
    });
    expect(second).toEqual({ ok: false, error: "duplicate" });
    expect(readLifetimeXp(first.wallet)).toBe(100);
    expect(readSpendableXp(first.wallet)).toBe(60);
  });

  it("blocks a second tap while the first cash-in is still saving", () => {
    const started = beginCashInAttempt({ inFlight: false });
    expect(started.ok).toBe(true);
    if (!started.ok) return;
    expect(beginCashInAttempt(started.state).ok).toBe(false);
    expect(beginCashInAttempt(endCashInAttempt()).ok).toBe(true);
  });
});

describe("exchange rate source of truth", () => {
  it("reads a legacy slider when cent storage is missing", () => {
    expect(
      resolveExchangeRateCents({
        xpExchangeRateSet: true,
        audSliderIndex: 4,
      }),
    ).toBe(200);
    expect(
      resolveExchangeRateCents({
        xpExchangeRateSet: false,
        audSliderIndex: 4,
        exchangeRateCentsPer100Xp: 300,
      }),
    ).toBeNull();
  });

  it("keeps a parent rate when a later XP award has no rate", () => {
    const parent = withExchangeRate(
      wallet({ totalPoints: 80, lifetimePointsEarned: 80 }),
      300,
      "2026-10-01T00:00:00.000Z",
    );
    const childEarn = wallet({
      totalPoints: 180,
      lifetimePointsEarned: 180,
      xpExchangeRateSet: false,
      updatedAt: "2026-10-19T00:00:00.000Z",
    });
    const picked = pickExchangeRate(parent, childEarn);
    expect(picked.xpExchangeRateSet).toBe(true);
    expect(picked.exchangeRateCentsPer100Xp).toBe(300);
  });

  it("uses the newer explicit rate when a parent changes it", () => {
    const earlier = withExchangeRate(
      wallet({ totalPoints: 10, lifetimePointsEarned: 10 }),
      200,
      "2026-10-01T00:00:00.000Z",
    );
    const later = withExchangeRate(
      wallet({
        totalPoints: 10,
        lifetimePointsEarned: 10,
        updatedAt: "2026-09-01T00:00:00.000Z",
      }),
      50,
      "2026-10-18T00:00:00.000Z",
    );
    expect(pickExchangeRate(earlier, later).exchangeRateCentsPer100Xp).toBe(50);
  });
});

describe("cash bucket assignment", () => {
  it("moves every cent into jars and leaves the bucket empty", () => {
    const plan = planCashBucketAssignment({
      cashDollars: 10.5,
      allocations: { "save-jar": 10, "spend-jar": 0.5 },
    });
    expect(plan).toEqual({
      ok: true,
      remainingDollars: 0,
      allocations: { "save-jar": 10, "spend-jar": 0.5 },
    });
  });

  it("rejects a split that drops or invents cents", () => {
    expect(
      planCashBucketAssignment({
        cashDollars: 2,
        allocations: { "save-jar": 1 },
      }),
    ).toEqual({ ok: false, reason: "mismatch" });
  });

  it("adds 10 cents three times as 30 cents, not a binary fraction", () => {
    let amount = 0;
    amount = addCentsToDollars(amount, 10);
    amount = addCentsToDollars(amount, 10);
    amount = addCentsToDollars(amount, 10);
    expect(dollarsToCents(amount)).toBe(30);
  });
});
