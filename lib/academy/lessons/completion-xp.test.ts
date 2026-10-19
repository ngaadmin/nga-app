import { describe, expect, it } from "vitest";
import {
  lessonAwardLedgerEvents,
  lessonCoinAward,
} from "@/lib/academy/lessons/completion-xp";
import {
  appendWalletLedgerEvent,
  WALLET_SCHEMA_VERSION,
  type PersistedDashboardWallet,
} from "@/lib/dashboard/dashboard-wallet-storage";

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

function pay(
  wallet: PersistedDashboardWallet,
  events: readonly { id: string; points: number }[],
): PersistedDashboardWallet {
  return events.reduce((current, event) => {
    return (
      appendWalletLedgerEvent(current, {
        id: event.id,
        kind: "earn",
        points: event.points,
        at: "2026-10-19T00:00:00.000Z",
      }) ?? current
    );
  }, wallet);
}

describe("lesson reward totals", () => {
  it("pays 100 coins for a finished lesson", () => {
    expect(lessonCoinAward({ perfect: false, bonusCoins: 0 })).toEqual({
      base: 100,
      perfectBonus: 0,
      bonus: 0,
      total: 100,
    });
  });

  it("pays 150 coins for a perfect lesson", () => {
    expect(lessonCoinAward({ perfect: true, bonusCoins: 0 })).toEqual({
      base: 100,
      perfectBonus: 50,
      bonus: 0,
      total: 150,
    });
  });

  it("adds bonus-run coins on top of a perfect lesson", () => {
    expect(lessonCoinAward({ perfect: true, bonusCoins: 20 })).toEqual({
      base: 100,
      perfectBonus: 50,
      bonus: 20,
      total: 170,
    });
  });
});

describe("lesson award ledger", () => {
  it("saves base, perfect, and bonus on the existing earn ledger and ignores a replay", () => {
    const award = lessonCoinAward({ perfect: true, bonusCoins: 20 });
    const events = lessonAwardLedgerEvents(4, award);
    expect(events.map((event) => event.id)).toEqual([
      "lesson:4:completion",
      "lesson:4:perfect",
      "lesson:4:bonus-run",
    ]);

    const once = pay(freshWallet(), events);
    const twice = pay(once, events);
    expect(once.totalPoints).toBe(170);
    expect(once.lifetimePointsEarned).toBe(170);
    expect(twice).toEqual(once);
  });

  it("skips the perfect and bonus rows when they are zero", () => {
    const events = lessonAwardLedgerEvents(
      1,
      lessonCoinAward({ perfect: false, bonusCoins: 0 }),
    );
    expect(events).toEqual([{ id: "lesson:1:completion", points: 100 }]);
    const paid = pay(freshWallet(), events);
    expect(paid.totalPoints).toBe(100);
    expect(paid.lifetimePointsEarned).toBe(100);
  });
});
