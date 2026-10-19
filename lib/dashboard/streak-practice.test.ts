import { describe, expect, it } from "vitest";
import {
  applyLessonPractice,
  buildPracticeCalendar,
  earnedLearningStreakIds,
  emptyPracticeStreak,
  resolvePracticedDateKeys,
  toLocalDateKey,
} from "@/lib/dashboard/streak-practice";

function localDate(year: number, monthIndex: number, day: number): Date {
  return new Date(year, monthIndex, day, 12, 0, 0);
}

describe("resolvePracticedDateKeys", () => {
  const now = localDate(2026, 7, 30);

  it("marks no days for a new profile with streak 0", () => {
    const keys = resolvePracticedDateKeys(now, 0);
    expect(keys.size).toBe(0);
  });

  it("marks consecutive days ending today for a live streak", () => {
    const keys = resolvePracticedDateKeys(now, 3);
    expect(keys).toEqual(
      new Set(["2026-08-30", "2026-08-29", "2026-08-28"]),
    );
  });

  it("keeps extra persisted offsets without applying a demo seed", () => {
    const keys = resolvePracticedDateKeys(now, 1, [5]);
    expect(keys).toEqual(new Set(["2026-08-30", "2026-08-25"]));
  });
});

describe("earnedLearningStreakIds", () => {
  it("leaves every badge dark on a 0-day streak", () => {
    expect(earnedLearningStreakIds(0)).toEqual(new Set());
  });

  it("lights 1 Day only after a one-day streak", () => {
    expect(earnedLearningStreakIds(1)).toEqual(new Set(["streak-1-day"]));
  });

  it("keeps the week badge when the best streak still covers it", () => {
    expect(earnedLearningStreakIds(Math.max(0, 7))).toEqual(
      new Set(["streak-1-day", "streak-1-week"]),
    );
  });
});

describe("applyLessonPractice", () => {
  const now = localDate(2026, 7, 30);

  it("marks today practiced when the first lesson is completed", () => {
    const next = applyLessonPractice(emptyPracticeStreak(), now);
    expect(next).toEqual({
      dayStreak: 1,
      bestStreak: 1,
      lastPractice: "2026-08-30",
    });
    expect(resolvePracticedDateKeys(now, next.dayStreak)).toEqual(
      new Set(["2026-08-30"]),
    );
  });

  it("does not count a second lesson on the same day twice", () => {
    const once = applyLessonPractice(emptyPracticeStreak(), now);
    expect(applyLessonPractice(once, now)).toEqual(once);
  });

  it("anchors a dateless streak on today without resetting it", () => {
    const next = applyLessonPractice(
      { dayStreak: 3, bestStreak: 3, lastPractice: null },
      now,
    );
    expect(next.dayStreak).toBe(3);
    expect(next.lastPractice).toBe("2026-08-30");
  });
});

describe("buildPracticeCalendar", () => {
  it("outlines today and leaves past days unpracticed when streak is 0", () => {
    const now = localDate(2026, 7, 30);
    const todayKey = toLocalDateKey(now);
    const model = buildPracticeCalendar(now, 0);

    const today = model.days.find((day) => day.key === todayKey);
    expect(today).toMatchObject({ isToday: true, practiced: false });
    expect(model.days.filter((day) => day.practiced)).toEqual([]);
  });
});
