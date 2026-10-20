import { describe, expect, it } from "vitest";
import {
  applyLessonCoinAward,
  lessonCashInNeedsRetry,
} from "@/lib/academy/lessons/lesson-coin-commit";
import {
  lessonAwardLedgerEvents,
  lessonCoinAward,
} from "@/lib/academy/lessons/completion-xp";
import {
  appendWalletLedgerEvent,
  WALLET_SCHEMA_VERSION,
  type PersistedDashboardWallet,
} from "@/lib/dashboard/dashboard-wallet-storage";

const AT = "2026-10-20T00:00:00.000Z";

function freshWallet(): PersistedDashboardWallet {
  return {
    schemaVersion: WALLET_SCHEMA_VERSION,
    ownerUserId: null,
    totalPoints: 0,
    lifetimePointsEarned: 0,
    audSliderIndex: 0,
    xpExchangeRateSet: false,
  };
}

describe("lesson coin commit", () => {
  it("awards 100, 150, and 170 coins", () => {
    const plain = applyLessonCoinAward(
      freshWallet(),
      lessonAwardLedgerEvents(1, lessonCoinAward({ perfect: false, bonusCoins: 0 })),
      AT,
    );
    const perfect = applyLessonCoinAward(
      freshWallet(),
      lessonAwardLedgerEvents(1, lessonCoinAward({ perfect: true, bonusCoins: 0 })),
      AT,
    );
    const bonus = applyLessonCoinAward(
      freshWallet(),
      lessonAwardLedgerEvents(1, lessonCoinAward({ perfect: true, bonusCoins: 20 })),
      AT,
    );

    expect(plain.wallet.totalPoints).toBe(100);
    expect(plain.awarded).toBe(100);
    expect(perfect.wallet.totalPoints).toBe(150);
    expect(perfect.awarded).toBe(150);
    expect(bonus.wallet.totalPoints).toBe(170);
    expect(bonus.awarded).toBe(170);
    expect(bonus.wallet.lifetimePointsEarned).toBe(170);
  });

  it("does not pay the same lesson twice", () => {
    const events = lessonAwardLedgerEvents(
      1,
      lessonCoinAward({ perfect: true, bonusCoins: 0 }),
    );
    const first = applyLessonCoinAward(freshWallet(), events, AT);
    const second = applyLessonCoinAward(first.wallet, events, AT);

    expect(second.wallet.totalPoints).toBe(150);
    expect(second.awarded).toBe(0);
    expect(second.wallet.ledger).toHaveLength(first.wallet.ledger?.length ?? 0);
  });

  it("puts ledger coins back when the spendable total was wiped", () => {
    const saved = applyLessonCoinAward(
      freshWallet(),
      lessonAwardLedgerEvents(1, lessonCoinAward({ perfect: false, bonusCoins: 0 })),
      AT,
    ).wallet;
    const wiped: PersistedDashboardWallet = { ...saved, totalPoints: 0 };
    const repaired = applyLessonCoinAward(
      wiped,
      lessonAwardLedgerEvents(1, lessonCoinAward({ perfect: false, bonusCoins: 0 })),
      AT,
    );

    expect(repaired.awarded).toBe(0);
    expect(repaired.wallet.totalPoints).toBe(100);
    expect(
      repaired.wallet.ledger?.filter((event) => event.id === "lesson:1:completion"),
    ).toHaveLength(1);
  });

  it("does not put coins back after a spend", () => {
    const earned = applyLessonCoinAward(
      freshWallet(),
      lessonAwardLedgerEvents(1, lessonCoinAward({ perfect: false, bonusCoins: 0 })),
      AT,
    ).wallet;
    const spent = appendWalletLedgerEvent(earned, {
      id: "cash-1",
      kind: "spend",
      points: 60,
      at: AT,
    });
    expect(spent?.totalPoints).toBe(40);

    const zeroed: PersistedDashboardWallet = { ...spent!, totalPoints: 0 };
    const again = applyLessonCoinAward(
      zeroed,
      lessonAwardLedgerEvents(1, lessonCoinAward({ perfect: false, bonusCoins: 0 })),
      AT,
    );

    expect(again.awarded).toBe(0);
    expect(again.wallet.totalPoints).toBe(0);
  });

  it("decides when cash-in should offer a retry", () => {
    expect(
      lessonCashInNeedsRetry({
        accessMode: "guest",
        pendingConsent: false,
        localOk: true,
        cloudOk: false,
      }),
    ).toBe(false);
    expect(
      lessonCashInNeedsRetry({
        accessMode: "registered",
        pendingConsent: true,
        localOk: true,
        cloudOk: false,
      }),
    ).toBe(false);
    expect(
      lessonCashInNeedsRetry({
        accessMode: "registered",
        pendingConsent: false,
        localOk: true,
        cloudOk: false,
      }),
    ).toBe(true);
    expect(
      lessonCashInNeedsRetry({
        accessMode: "registered",
        pendingConsent: false,
        localOk: false,
        cloudOk: true,
      }),
    ).toBe(true);
    expect(
      lessonCashInNeedsRetry({
        accessMode: "registered",
        pendingConsent: false,
        localOk: true,
        cloudOk: true,
      }),
    ).toBe(false);
  });
});
