import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LessonCloseRewardView } from "@/lib/academy/lessons/lesson-close-reward-view";
import {
  lessonCloseRewardLines,
  lessonCloseRewardTotal,
} from "@/lib/academy/lessons/lesson-close-rewards";

function markup(props: {
  perfectStreak: boolean;
  bonusCoins: number;
  bonusRuns: number;
}): string {
  return renderToStaticMarkup(
    createElement(LessonCloseRewardView, {
      xpReward: 100,
      perfectStreakBonus: 50,
      perfectStreak: props.perfectStreak,
      bonusCoins: props.bonusCoins,
      bonusRuns: props.bonusRuns,
    }),
  );
}

describe("lesson close reward lines", () => {
  it("lists the lesson line on its own when nothing else was earned", () => {
    const lines = lessonCloseRewardLines({
      base: 100,
      perfect: false,
      perfectBonus: 50,
      bonusCoins: 0,
      runs: 0,
    });
    expect(lines.map((line) => line.text)).toEqual(["Lesson complete +100 coins"]);
    expect(lessonCloseRewardTotal(lines)).toBe(100);
  });

  it("adds the perfect line only for a perfect lesson", () => {
    const lines = lessonCloseRewardLines({
      base: 100,
      perfect: true,
      perfectBonus: 50,
      bonusCoins: 0,
      runs: 0,
    });
    expect(lines.map((line) => line.id)).toEqual(["base", "perfect"]);
    expect(lines[1]?.text).toBe("Perfect lesson +50 coins");
    expect(lessonCloseRewardTotal(lines)).toBe(150);
  });

  it("adds the bonus line with the run count when bonus coins were earned", () => {
    const lines = lessonCloseRewardLines({
      base: 100,
      perfect: true,
      perfectBonus: 50,
      bonusCoins: 20,
      runs: 2,
    });
    expect(lines.map((line) => line.id)).toEqual(["base", "perfect", "bonus"]);
    expect(lines[2]?.text).toBe("Bonus run +20 coins");
    expect(lines[2]?.detail).toBe("2 runs of 5 in a row");
    expect(lessonCloseRewardTotal(lines)).toBe(170);
  });
});

describe("lesson close screen reward rendering", () => {
  it("renders only the lesson line when the lesson was not perfect", () => {
    const html = markup({ perfectStreak: false, bonusCoins: 0, bonusRuns: 0 });
    expect(html).toContain("Lesson complete +100 coins");
    expect(html).toContain('data-reward-line="base"');
    expect(html).not.toContain("Perfect lesson");
    expect(html).not.toContain("Bonus run");
    expect(html).toContain('data-lesson-reward-total="100"');
  });

  it("renders the perfect line and a 150 coin total", () => {
    const html = markup({ perfectStreak: true, bonusCoins: 0, bonusRuns: 0 });
    expect(html).toContain("Lesson complete +100 coins");
    expect(html).toContain("Perfect lesson +50 coins");
    expect(html).not.toContain("Bonus run");
    expect(html).toContain('data-lesson-reward-total="150"');
  });

  it("renders the bonus line only when bonus coins are above zero", () => {
    const html = markup({ perfectStreak: true, bonusCoins: 20, bonusRuns: 2 });
    expect(html).toContain("Lesson complete +100 coins");
    expect(html).toContain("Perfect lesson +50 coins");
    expect(html).toContain("Bonus run +20 coins");
    expect(html).toContain("2 runs of 5 in a row");
    expect(html).toContain('data-reward-line="bonus"');
    expect(html).toContain('data-lesson-reward-total="170"');
  });

  it("omits the perfect line when a bonus was earned with a mistake", () => {
    const html = markup({ perfectStreak: false, bonusCoins: 10, bonusRuns: 1 });
    expect(html).toContain("Lesson complete +100 coins");
    expect(html).not.toContain("Perfect lesson");
    expect(html).toContain("Bonus run +10 coins");
    expect(html).toContain("1 run of 5 in a row");
    expect(html).toContain('data-lesson-reward-total="110"');
  });
});
