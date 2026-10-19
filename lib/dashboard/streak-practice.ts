import {
  readPersisted,
  removePersisted,
  writePersisted,
} from "@/lib/dev/client-persist";

/** Consecutive practice days for the signed-in learner. */
export const LEARNING_STREAK_STORAGE_KEY = "nga_learning_streak_v1";

/** Fired after a completed lesson updates the practice streak. */
export const PRACTICE_RECORDED_EVENT = "nga-practice-recorded";

export type PracticeStreakState = {
  dayStreak: number;
  bestStreak: number;
  /** Local YYYY-MM-DD of the last completed lesson, when known. */
  lastPractice: string | null;
};

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

function finiteDayCount(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return 0;
  return Math.floor(parsed);
}

function parseLastPractice(value: unknown): string | null {
  if (typeof value !== "string") return null;
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

export function emptyPracticeStreak(): PracticeStreakState {
  return { dayStreak: 0, bestStreak: 0, lastPractice: null };
}

/** Accepts the legacy plain number and the JSON streak record. */
export function parseStoredPractice(raw: string | null): PracticeStreakState {
  if (!raw) return emptyPracticeStreak();
  const trimmed = raw.trim();
  if (!trimmed) return emptyPracticeStreak();
  if (trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed) as Partial<PracticeStreakState>;
      const dayStreak = finiteDayCount(parsed.dayStreak);
      const bestStreak = Math.max(finiteDayCount(parsed.bestStreak), dayStreak);
      return {
        dayStreak,
        bestStreak,
        lastPractice: parseLastPractice(parsed.lastPractice),
      };
    } catch {
      return emptyPracticeStreak();
    }
  }
  const dayStreak = finiteDayCount(Number(trimmed));
  return { dayStreak, bestStreak: dayStreak, lastPractice: null };
}

function persistPractice(state: PracticeStreakState): void {
  if (state.dayStreak <= 0 && state.bestStreak <= 0 && !state.lastPractice) {
    removePersisted(LEARNING_STREAK_STORAGE_KEY);
    return;
  }
  writePersisted(LEARNING_STREAK_STORAGE_KEY, JSON.stringify(state));
}

export function readStoredPractice(): PracticeStreakState {
  if (typeof window === "undefined") return emptyPracticeStreak();
  return parseStoredPractice(readPersisted(LEARNING_STREAK_STORAGE_KEY));
}

export function readStoredDayStreak(): number {
  return readStoredPractice().dayStreak;
}

export function readStoredBestStreak(): number {
  return readStoredPractice().bestStreak;
}

/** Account restore writes the live streak and keeps the best streak and last practice day. */
export function writeStoredDayStreak(dayStreak: number): void {
  if (typeof window === "undefined") return;
  const current = readStoredPractice();
  const safe = finiteDayCount(dayStreak);
  persistPractice({
    dayStreak: safe,
    bestStreak: Math.max(current.bestStreak, safe),
    lastPractice: current.lastPractice,
  });
}

/**
 * Mark today practiced. A lesson already counted today is a no-op.
 * A streak saved without a date keeps its length and anchors on today.
 */
export function applyLessonPractice(
  state: PracticeStreakState,
  now: Date,
): PracticeStreakState {
  const today = toLocalDateKey(startOfLocalDay(now));
  if (state.lastPractice === today) return state;
  const yesterday = toLocalDateKey(addLocalDays(startOfLocalDay(now), -1));
  const dayStreak =
    state.lastPractice === yesterday
      ? state.dayStreak + 1
      : state.lastPractice == null && state.dayStreak > 0
        ? state.dayStreak
        : 1;
  return {
    dayStreak,
    bestStreak: Math.max(state.bestStreak, dayStreak),
    lastPractice: today,
  };
}

export function recordLessonPractice(now = new Date()): PracticeStreakState {
  if (typeof window === "undefined") return emptyPracticeStreak();
  const next = applyLessonPractice(readStoredPractice(), now);
  persistPractice(next);
  window.dispatchEvent(new Event(PRACTICE_RECORDED_EVENT));
  return next;
}

/** Days required before each learning-streak badge lights. */
export const LEARNING_STREAK_DAY_THRESHOLDS = [
  { id: "streak-1-day", days: 1 },
  { id: "streak-1-week", days: 7 },
  { id: "streak-1-month", days: 30 },
  { id: "streak-3-months", days: 90 },
  { id: "streak-6-months", days: 180 },
  { id: "streak-9-months", days: 270 },
  { id: "streak-12-months", days: 365 },
] as const;

/** Badges earned by the longer of the live streak and the best streak. */
export function earnedLearningStreakIds(streakDays: number): Set<string> {
  const days = finiteDayCount(streakDays);
  return new Set(
    LEARNING_STREAK_DAY_THRESHOLDS.filter((milestone) => days >= milestone.days).map(
      (milestone) => milestone.id,
    ),
  );
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
