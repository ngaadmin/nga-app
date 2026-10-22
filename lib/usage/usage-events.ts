/** School-trial usage events. Usernames and class ids only. */

export const USAGE_EVENT_TYPES = [
  "login",
  "lesson_started",
  "lesson_completed",
  "lesson_abandoned",
  "medal_earned",
  "vault_visit",
  "launchpad_visit",
] as const;

export type UsageEventType = (typeof USAGE_EVENT_TYPES)[number];

/** Page views. Repeated hits inside this window count once per user. */
export const PAGE_VISIT_EVENT_TYPES = [
  "lesson_started",
  "vault_visit",
  "launchpad_visit",
] as const;

export const USAGE_PAGE_VISIT_DEDUPE_MS = 60_000;

const MEDAL_TIERS = new Set(["unlocked", "bronze", "silver", "gold"]);
const LESSON_EVENT_TYPES = new Set<UsageEventType>([
  "lesson_started",
  "lesson_completed",
  "lesson_abandoned",
  "medal_earned",
]);
const PAGE_VISIT_TYPES = new Set<UsageEventType>(PAGE_VISIT_EVENT_TYPES);

const INT4_MAX = 2_147_483_647;

export type UsageEventInsert = {
  username: string;
  class_id: string | null;
  event_type: UsageEventType;
  lesson_number: number | null;
  xp_total: number | null;
  streak_days: number | null;
  metadata: Record<string, unknown>;
};

export type UsageDedupeStore = {
  get(key: string): number | null;
  set(key: string, at: number): void;
  delete(key: string): void;
};

export function createMemoryUsageDedupeStore(): UsageDedupeStore {
  const entries = new Map<string, number>();
  return {
    get(key) {
      return entries.get(key) ?? null;
    },
    set(key, at) {
      entries.set(key, at);
    },
    delete(key) {
      entries.delete(key);
    },
  };
}

export function toUsageEventInsert(input: unknown): UsageEventInsert | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const draft = input as Record<string, unknown>;
  const eventType = draft.eventType ?? draft.event_type;
  if (!isUsageEventType(eventType)) return null;

  const username = cleanUsername(draft.username);
  if (!username) return null;

  return {
    username,
    class_id: cleanClassId(draft.classId ?? draft.class_id),
    event_type: eventType,
    lesson_number: lessonNumberFor(eventType, draft.lessonNumber ?? draft.lesson_number),
    xp_total: optionalInt(draft.xpTotal ?? draft.xp_total),
    streak_days: optionalInt(draft.streakDays ?? draft.streak_days),
    metadata: cleanMetadata(draft.metadata),
  };
}

/** Null when the event is not a page visit. Key includes the username. */
export function pageVisitDedupeKey(row: UsageEventInsert): string | null {
  if (!PAGE_VISIT_TYPES.has(row.event_type)) return null;
  const lesson =
    row.event_type === "lesson_started" ? String(row.lesson_number ?? "") : "";
  return `${row.username}\n${row.event_type}\n${lesson}`;
}

export function isRecentPageVisit(
  store: UsageDedupeStore,
  key: string,
  now: number,
): boolean {
  const last = store.get(key);
  if (last == null || !Number.isFinite(last)) return false;
  return now - last < USAGE_PAGE_VISIT_DEDUPE_MS;
}

function isUsageEventType(value: unknown): value is UsageEventType {
  return (
    typeof value === "string" &&
    (USAGE_EVENT_TYPES as readonly string[]).includes(value)
  );
}

function cleanUsername(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed.length < 1 || trimmed.length > 80) return null;
  if (trimmed.includes("@")) return null;
  if (/[\s\u0000]/.test(trimmed)) return null;
  return trimmed;
}

function cleanClassId(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 80) return null;
  if (trimmed.includes("@") || /[\s\u0000]/.test(trimmed)) return null;
  return trimmed;
}

function lessonNumberFor(eventType: UsageEventType, value: unknown): number | null {
  if (!LESSON_EVENT_TYPES.has(eventType)) return null;
  const parsed = optionalInt(value);
  if (parsed == null || parsed < 1 || parsed > 999) return null;
  return parsed;
}

function optionalInt(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  const floored = Math.floor(value);
  if (floored < 0 || floored > INT4_MAX) return null;
  return floored;
}

/** Keep medal labels. Drop emails, names, addresses, and anything else. */
function cleanMetadata(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const source = value as Record<string, unknown>;
  const metadata: Record<string, string> = {};

  if (typeof source.skill === "string") {
    const skill = source.skill.trim();
    if (/^[A-Za-z0-9_-]{1,64}$/.test(skill)) metadata.skill = skill;
  }
  if (typeof source.tier === "string" && MEDAL_TIERS.has(source.tier)) {
    metadata.tier = source.tier;
  }

  return metadata;
}
