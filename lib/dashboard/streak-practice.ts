/** Local YYYY-MM-DD for calendar cells — not UTC, so the day matches what the user sees. */
export function toLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addLocalDays(date: Date, days: number): Date {
  const next = startOfLocalDay(date);
  next.setDate(next.getDate() + days);
  return next;
}

/** Monday of the week that contains `date` (ISO-style week). */
export function mondayOfWeek(date: Date): Date {
  const start = startOfLocalDay(date);
  const weekday = start.getDay();
  const offset = weekday === 0 ? -6 : 1 - weekday;
  return addLocalDays(start, offset);
}

export type PracticeCalendarDay = {
  key: string;
  dayOfMonth: number;
  isToday: boolean;
  isFuture: boolean;
  practiced: boolean;
};

export type PracticeCalendarModel = {
  rangeLabel: string;
  days: readonly PracticeCalendarDay[];
};

/**
 * Days marked practiced: the live streak (consecutive days ending today),
 * plus optional extra offsets for persisted history. New / reset profiles pass
 * streak 0 and no extras — today is outlined, not gold, until they complete a lesson.
 */
export function resolvePracticedDateKeys(
  now: Date,
  dayStreak: number,
  extraDaysAgo: readonly number[] = [],
): Set<string> {
  const today = startOfLocalDay(now);
  const keys = new Set<string>();

  for (let offset = 0; offset < dayStreak; offset += 1) {
    keys.add(toLocalDateKey(addLocalDays(today, -offset)));
  }

  for (const daysAgo of extraDaysAgo) {
    if (daysAgo < 1) continue;
    keys.add(toLocalDateKey(addLocalDays(today, -daysAgo)));
  }

  return keys;
}

function formatRangeLabel(start: Date, end: Date): string {
  const sameMonth =
    start.getMonth() === end.getMonth() &&
    start.getFullYear() === end.getFullYear();

  if (sameMonth) {
    return start.toLocaleDateString(undefined, {
      month: "long",
      year: "numeric",
    });
  }

  const startLabel = start.toLocaleDateString(undefined, { month: "short" });
  const endLabel = end.toLocaleDateString(undefined, {
    month: "short",
    year: "numeric",
  });
  return `${startLabel} – ${endLabel}`;
}

/** Last `weekCount` weeks ending this week — compact Duolingo-style grid. */
export function buildPracticeCalendar(
  now: Date,
  dayStreak: number,
  weekCount = 4,
): PracticeCalendarModel {
  const today = startOfLocalDay(now);
  const todayKey = toLocalDateKey(today);
  const practicedKeys = resolvePracticedDateKeys(now, dayStreak);
  const thisMonday = mondayOfWeek(today);
  const gridStart = addLocalDays(thisMonday, -(weekCount - 1) * 7);
  const gridEnd = addLocalDays(gridStart, weekCount * 7 - 1);

  const days: PracticeCalendarDay[] = [];
  for (let index = 0; index < weekCount * 7; index += 1) {
    const date = addLocalDays(gridStart, index);
    const key = toLocalDateKey(date);
    days.push({
      key,
      dayOfMonth: date.getDate(),
      isToday: key === todayKey,
      isFuture: date.getTime() > today.getTime(),
      practiced: practicedKeys.has(key),
    });
  }

  return {
    rangeLabel: formatRangeLabel(gridStart, gridEnd),
    days,
  };
}
