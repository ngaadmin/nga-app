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
  cashedIn?: boolean;
}): string {
  return renderToStaticMarkup(
    createElement(LessonCloseRewardView, {
      xpReward: 100,
      perfectStreakBonus: 50,
      perfectStreak: props.perfectStreak,
      bonusCoins: props.bonusCoins,
      bonusRuns: props.bonusRuns,
      cashedIn: props.cashedIn,
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
    expect(lines.map((line) => line.label)).toEqual(["Lesson complete"]);
    expect(lines[0]?.emoji).toBe("🎓");
    expect(lines[0]?.coins).toBe(100);
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
    expect(lines[1]?.label).toBe("Perfect lesson");
    expect(lines[1]?.detail).toBe("No mistakes");
    expect(lines[1]?.coins).toBe(50);
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
    expect(lines[2]?.label).toBe("Bonus runs");
    expect(lines[2]?.detail).toBe("2 bonus runs × 10");
    expect(lines[2]?.coins).toBe(20);
    expect(lessonCloseRewardTotal(lines)).toBe(170);
  });

  it("uses the singular bonus line for one run", () => {
    const lines = lessonCloseRewardLines({
      base: 100,
      perfect: false,
      perfectBonus: 50,
      bonusCoins: 10,
      runs: 1,
    });
    expect(lines[1]?.label).toBe("Bonus run");
    expect(lines[1]?.detail).toBe("1 bonus run × 10");
  });

  it("omits a bonus line when no run was earned", () => {
    const lines = lessonCloseRewardLines({
      base: 100,
      perfect: true,
      perfectBonus: 50,
      bonusCoins: 10,
      runs: 0,
    });
    expect(lines.map((line) => line.id)).toEqual(["base", "perfect"]);
  });
});

describe("lesson close screen reward rendering", () => {
  it("renders only the lesson line when the lesson was not perfect", () => {
    const html = markup({ perfectStreak: false, bonusCoins: 0, bonusRuns: 0 });
    expect(html).toContain("Lesson complete");
    expect(html).toContain("+100");
    expect(html).toContain('data-reward-line="base"');
    expect(html).not.toContain("Perfect lesson");
    expect(html).not.toContain("Bonus run");
    expect(html).toContain('data-lesson-reward-total="100"');
    expect(html).not.toContain("XP");
    expect(html).not.toContain("NGA");
  });

  it("renders the perfect line and a 150 coin total", () => {
    const html = markup({ perfectStreak: true, bonusCoins: 0, bonusRuns: 0 });
    expect(html).toContain("Lesson complete");
    expect(html).toContain("Perfect lesson");
    expect(html).toContain("No mistakes");
    expect(html).toContain("+50");
    expect(html).not.toContain("Bonus run");
    expect(html).toContain('data-lesson-reward-total="150"');
    expect(html).toContain("penny-master-512.webp");
  });

  it("renders the bonus line only when bonus coins are above zero", () => {
    const html = markup({ perfectStreak: true, bonusCoins: 20, bonusRuns: 2 });
    expect(html).toContain("Lesson complete");
    expect(html).toContain("Perfect lesson");
    expect(html).toContain("Bonus runs");
    expect(html).toContain("2 bonus runs × 10");
    expect(html).toContain("+20");
    expect(html).toContain('data-reward-line="bonus"');
    expect(html).toContain('data-lesson-reward-total="170"');
  });

  it("omits the perfect line when a bonus was earned with a mistake", () => {
    const html = markup({ perfectStreak: false, bonusCoins: 10, bonusRuns: 1 });
    expect(html).toContain("Lesson complete");
    expect(html).not.toContain("Perfect lesson");
    expect(html).toContain("Bonus run");
    expect(html).toContain("1 bonus run × 10");
    expect(html).toContain('data-lesson-reward-total="110"');
  });

  it("replaces the total with cashed in once the coins have landed", () => {
    const html = markup({
      perfectStreak: true,
      bonusCoins: 20,
      bonusRuns: 2,
      cashedIn: true,
    });
    expect(html).toContain("Cashed in ✓");
    expect(html).not.toContain('data-lesson-reward-total="170"');
  });
});
