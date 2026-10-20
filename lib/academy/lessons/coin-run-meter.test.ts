import { describe, expect, it } from "vitest";
import {
  BONUS_RUN_COINS,
  reduceBonusRun,
  type BonusRunEvent,
} from "@/lib/academy/lessons/bonus-run";
import {
  coinRunMeterFilledCount,
  coinRunMeterLabel,
  coinRunMeterSlots,
} from "@/lib/academy/lessons/coin-run-meter";
import {
  LESSON_PERFECT_STREAK_BONUS,
  lessonCoinAward,
} from "@/lib/academy/lessons/completion-xp";

function corrects(count: number, prefix = "screen"): BonusRunEvent[] {
  return Array.from({ length: count }, (_, index) => ({
    kind: "correct" as const,
    unitId: `${prefix}:${index}`,
  }));
}

describe("coin run meter", () => {
  it("fills one slot from the left for each correct answer in the streak", () => {
    expect(coinRunMeterSlots(0)).toEqual([false, false, false, false, false]);
    expect(coinRunMeterLabel(0)).toBe("0 of 5 coins towards your bonus");

    const three = reduceBonusRun(corrects(3));
    expect(coinRunMeterFilledCount(three.streak)).toBe(3);
    expect(coinRunMeterSlots(three.streak)).toEqual([
      true,
      true,
      true,
      false,
      false,
    ]);
    expect(coinRunMeterLabel(three.streak)).toBe("3 of 5 coins towards your bonus");
  });

  it("empties every slot on a wrong answer and pays nothing", () => {
    const state = reduceBonusRun([
      ...corrects(3),
      { kind: "wrong", unitId: "miss" },
    ]);
    expect(state.streak).toBe(0);
    expect(state.bonusCoins).toBe(0);
    expect(coinRunMeterSlots(state.streak)).toEqual([
      false,
      false,
      false,
      false,
      false,
    ]);
    expect(coinRunMeterLabel(state.streak)).toBe("0 of 5 coins towards your bonus");
  });

  it("empties the meter and pays 10 coins when the fifth answer lands", () => {
    const four = reduceBonusRun(corrects(4));
    expect(coinRunMeterFilledCount(four.streak)).toBe(4);
    expect(four.bonusCoins).toBe(0);

    const five = reduceBonusRun(corrects(5));
    expect(five.bonusCoins).toBe(BONUS_RUN_COINS);
    expect(five.bonusCoins).toBe(10);
    expect(five.runs).toBe(1);
    expect(five.streak).toBe(0);
    expect(coinRunMeterFilledCount(five.streak)).toBe(0);
    expect(coinRunMeterLabel(five.streak)).toBe("0 of 5 coins towards your bonus");
  });

  it("does not move the meter for an unscored screen or a second try", () => {
    const unscored = reduceBonusRun([
      ...corrects(2),
      { kind: "unscored" },
      { kind: "unscored" },
    ]);
    expect(coinRunMeterFilledCount(unscored.streak)).toBe(2);
    expect(unscored.bonusCoins).toBe(0);

    const secondCorrect = reduceBonusRun([
      { kind: "correct", unitId: "screen:1" },
      { kind: "correct", unitId: "screen:1" },
    ]);
    expect(coinRunMeterFilledCount(secondCorrect.streak)).toBe(1);

    const retryAfterWrong = reduceBonusRun([
      { kind: "wrong", unitId: "screen:1" },
      { kind: "correct", unitId: "screen:1" },
      ...corrects(2, "next"),
    ]);
    expect(coinRunMeterFilledCount(retryAfterWrong.streak)).toBe(2);
    expect(retryAfterWrong.bonusCoins).toBe(0);
  });

  it("keeps the +50 perfect bonus for zero mistakes when the meter is empty", () => {
    const emptied = reduceBonusRun([
      ...corrects(4),
      { kind: "wrong", unitId: "miss" },
    ]);
    expect(coinRunMeterFilledCount(emptied.streak)).toBe(0);
    expect(LESSON_PERFECT_STREAK_BONUS).toBe(50);

    const withAMistake = lessonCoinAward({
      perfect: false,
      bonusCoins: emptied.bonusCoins,
    });
    expect(withAMistake.perfectBonus).toBe(0);
    expect(withAMistake.base).toBe(100);
    expect(withAMistake.total).toBe(100);

    const noMistakes = lessonCoinAward({ perfect: true, bonusCoins: 0 });
    expect(noMistakes.perfectBonus).toBe(50);
    expect(noMistakes.total).toBe(150);

    const perfectWithARun = lessonCoinAward({ perfect: true, bonusCoins: 10 });
    expect(perfectWithARun.perfectBonus).toBe(50);
    expect(perfectWithARun.bonus).toBe(10);
    expect(perfectWithARun.total).toBe(160);
  });
});
