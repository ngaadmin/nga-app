import { describe, expect, it } from "vitest";
import {
  buildPracticeCalendar,
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
