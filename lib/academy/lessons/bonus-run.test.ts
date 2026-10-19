import { describe, expect, it } from "vitest";
import {
  bonusRunUnitForScreen,
  reduceBonusRun,
  spotlightRoundUnitId,
  type BonusRunEvent,
} from "@/lib/academy/lessons/bonus-run";
import type { ScreenConfig } from "@/lib/academy/lessons/types";

function corrects(count: number, prefix = "screen"): BonusRunEvent[] {
  return Array.from({ length: count }, (_, index) => ({
    kind: "correct" as const,
    unitId: `${prefix}:${index}`,
  }));
}

describe("bonus run counter", () => {
  it("pays 10 coins for 5 correct answers and clears the streak", () => {
    const state = reduceBonusRun(corrects(5));
    expect(state.bonusCoins).toBe(10);
    expect(state.runs).toBe(1);
    expect(state.streak).toBe(0);
  });

  it("pays 20 coins for 10 correct answers", () => {
    const state = reduceBonusRun(corrects(10));
    expect(state.bonusCoins).toBe(20);
    expect(state.runs).toBe(2);
    expect(state.streak).toBe(0);
  });

  it("drops a streak of 4 on a wrong answer, then pays 10 for the next 5", () => {
    const state = reduceBonusRun([
      ...corrects(4),
      { kind: "wrong", unitId: "miss" },
      ...corrects(5, "after"),
    ]);
    expect(state.bonusCoins).toBe(10);
    expect(state.runs).toBe(1);
    expect(state.streak).toBe(0);
  });

  it("ignores a correct retry after the first try was wrong", () => {
    const state = reduceBonusRun([
      { kind: "wrong", unitId: "screen:1" },
      { kind: "correct", unitId: "screen:1" },
      ...corrects(4, "next"),
    ]);
    expect(state.bonusCoins).toBe(0);
    expect(state.streak).toBe(4);
  });

  it("resets the streak and the coins at the start of the next lesson", () => {
    const carried = reduceBonusRun([
      ...corrects(5),
      { kind: "correct", unitId: "partial" },
      { kind: "reset" },
      ...corrects(5, "next-lesson"),
    ]);
    expect(carried.bonusCoins).toBe(10);
    expect(carried.runs).toBe(1);
    expect(carried.streak).toBe(0);

    const cleared = reduceBonusRun([
      ...corrects(4),
      { kind: "reset" },
    ]);
    expect(cleared.bonusCoins).toBe(0);
    expect(cleared.streak).toBe(0);
  });

  it("ignores unscored screens without breaking or growing the streak", () => {
    const state = reduceBonusRun([
      ...corrects(4),
      { kind: "unscored" },
      { kind: "unscored" },
      { kind: "correct", unitId: "screen:4" },
    ]);
    expect(state.bonusCoins).toBe(10);
    expect(state.streak).toBe(0);
  });

  it("counts each spotlight round as its own answer", () => {
    const fiveRounds = reduceBonusRun(
      Array.from({ length: 5 }, (_, roundIndex) => ({
        kind: "correct" as const,
        unitId: spotlightRoundUnitId(4, roundIndex),
      })),
    );
    expect(fiveRounds.bonusCoins).toBe(10);
    expect(fiveRounds.runs).toBe(1);
    expect(fiveRounds.streak).toBe(0);

    const mixed = reduceBonusRun([
      ...corrects(2),
      ...[0, 1, 2].map((roundIndex) => ({
        kind: "correct" as const,
        unitId: spotlightRoundUnitId(8, roundIndex),
      })),
    ]);
    expect(mixed.bonusCoins).toBe(10);
    expect(mixed.streak).toBe(0);

    const missedRound = reduceBonusRun([
      { kind: "wrong", unitId: spotlightRoundUnitId(1, 0) },
      { kind: "correct", unitId: spotlightRoundUnitId(1, 0) },
      { kind: "correct", unitId: spotlightRoundUnitId(1, 1) },
    ]);
    expect(missedRound.bonusCoins).toBe(0);
    expect(missedRound.streak).toBe(1);
  });
});

describe("bonus run scored screens", () => {
  const tapReveal = {
    type: "tap-reveal",
    id: "tap",
    intro: "",
    items: [],
    buckets: [],
  } as ScreenConfig;

  const hold = {
    type: "hold-to-fill",
    id: "hold",
    narrative: "",
    holdLabel: "Hold",
    frozenLabel: "Frozen",
    successMessage: "Done",
  } as ScreenConfig;

  const completion = { type: "completion", id: "done" } as ScreenConfig;

  const trueFalse = {
    type: "true-false",
    id: "tf",
    prompt: "Ready?",
    correctAnswer: "true",
    wrongError: "Not yet",
  } as ScreenConfig;

  const spotlight = {
    type: "spotlight-rounds",
    id: "spot",
    prompt: "Which one?",
    rounds: [
      {
        iconA: "",
        optionA: "A",
        iconB: "",
        optionB: "B",
        correct: "a",
        error: "Nope",
      },
    ],
  } as ScreenConfig;

  it("leaves tap-reveal, hold-to-fill, and completion unscored", () => {
    expect(bonusRunUnitForScreen(tapReveal, 0)).toBeNull();
    expect(bonusRunUnitForScreen(hold, 1)).toBeNull();
    expect(bonusRunUnitForScreen(completion, 2)).toBeNull();
  });

  it("gives a scored screen one unit and a spotlight round its own unit", () => {
    expect(bonusRunUnitForScreen(trueFalse, 3)).toBe("screen:3");
    expect(bonusRunUnitForScreen(spotlight, 4)).toBeNull();
    expect(spotlightRoundUnitId(4, 0)).toBe("spotlight:4:0");
    expect(spotlightRoundUnitId(4, 1)).toBe("spotlight:4:1");
  });
});
