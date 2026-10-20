import { describe, expect, it } from "vitest";
import type { BonusRunEvent } from "@/lib/academy/lessons/bonus-run";
import {
  COIN_RUN_REWARD_FADE_MS,
  COIN_RUN_REWARD_LABEL,
  COIN_RUN_REWARD_MS,
  coinRunRewardCue,
  coinRunRewardCues,
  coinRunRewardFlySpanMs,
} from "@/lib/academy/lessons/coin-run-reward";

function corrects(count: number, prefix = "screen"): BonusRunEvent[] {
  return Array.from({ length: count }, (_, index) => ({
    kind: "correct" as const,
    unitId: `${prefix}:${index}`,
  }));
}

describe("coin run reward cue", () => {
  it("plays the flight once when a payout lands", () => {
    const cues = coinRunRewardCues(corrects(5));
    expect(cues).toHaveLength(1);
    expect(cues[0]).toMatchObject({
      motion: "fly",
      label: COIN_RUN_REWARD_LABEL,
      durationMs: COIN_RUN_REWARD_MS,
      runs: 1,
    });
    expect(COIN_RUN_REWARD_LABEL).toBe("+10 coins");
    expect(cues[0]?.durationMs).toBeGreaterThanOrEqual(1000);
    expect(cues[0]?.durationMs).toBeLessThanOrEqual(1500);
    expect(coinRunRewardFlySpanMs()).toBeGreaterThan(0);
    expect(coinRunRewardFlySpanMs()).toBeLessThanOrEqual(COIN_RUN_REWARD_MS);
  });

  it("plays again for the next payout and not for answers in between", () => {
    const cues = coinRunRewardCues([
      ...corrects(4),
      { kind: "unscored" },
      { kind: "correct", unitId: "screen:4" },
      ...corrects(4, "next"),
      { kind: "correct", unitId: "screen:4" },
      { kind: "correct", unitId: "after:9" },
    ]);
    expect(cues.map((cue) => cue.runs)).toEqual([1, 2]);
    expect(cues.every((cue) => cue.motion === "fly")).toBe(true);
  });

  it("does not play for a wrong answer, an unscored screen, or a second try", () => {
    expect(
      coinRunRewardCues([
        ...corrects(4),
        { kind: "wrong", unitId: "miss" },
      ]),
    ).toEqual([]);
    expect(
      coinRunRewardCues([...corrects(3), { kind: "unscored" }]),
    ).toEqual([]);
    expect(
      coinRunRewardCues([
        { kind: "correct", unitId: "screen:1" },
        { kind: "correct", unitId: "screen:1" },
        { kind: "wrong", unitId: "screen:2" },
        { kind: "correct", unitId: "screen:2" },
      ]),
    ).toEqual([]);
    expect(
      coinRunRewardCue({ previousRuns: 1, runs: 1, prefersReducedMotion: false }),
    ).toBeNull();
  });

  it("uses a fade instead of the flight when reduced motion is on", () => {
    const cues = coinRunRewardCues(corrects(10), true);
    expect(cues).toHaveLength(2);
    expect(cues[0]).toMatchObject({
      motion: "fade",
      label: "+10 coins",
      durationMs: COIN_RUN_REWARD_FADE_MS,
      runs: 1,
    });
    expect(cues[0]?.durationMs).toBeGreaterThanOrEqual(1000);
    expect(cues[0]?.durationMs).toBeLessThanOrEqual(1500);
    expect(cues[0]?.motion).not.toBe("fly");
    expect(cues[1]?.runs).toBe(2);

    expect(
      coinRunRewardCue({
        previousRuns: 0,
        runs: 1,
        prefersReducedMotion: true,
      })?.motion,
    ).toBe("fade");
  });
});
