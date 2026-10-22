import {
  createMemoryUsageDedupeStore,
  isRecentPageVisit,
  pageVisitDedupeKey,
  toUsageEventInsert,
  USAGE_PAGE_VISIT_DEDUPE_MS,
  type UsageDedupeStore,
  type UsageEventInsert,
  type UsageEventType,
} from "@/lib/usage/usage-events";

export { createMemoryUsageDedupeStore, USAGE_PAGE_VISIT_DEDUPE_MS };
export type { UsageDedupeStore, UsageEventInsert };

const DEDUPE_STORAGE_KEY = "nga_usage_event_dedupe_v1";
const memoryDedupe = new Map<string, number>();

export type LogUsageEventOptions = {
  now?: number;
  store?: UsageDedupeStore;
  insert: (row: UsageEventInsert) => Promise<void> | void;
};

export type GuestCountSend = {
  eventType: UsageEventType;
  lessonNumber: number | null;
};

/**
 * Guest page visits use the same one-minute collapse as signed-in visits.
 * The send callback receives the event type and lesson number only.
 */
export function logGuestCountEvent(
  input: { eventType: UsageEventType; lessonNumber?: number | null },
  send: (event: GuestCountSend) => void,
): void {
  logUsageEvent(
    {
      eventType: input.eventType,
      username: "guest-count",
      lessonNumber: input.lessonNumber ?? null,
    },
    {
      insert: (row) => {
        send({ eventType: row.event_type, lessonNumber: row.lesson_number });
      },
    },
  );
}

/**
 * Schedule one usage insert. Returns immediately, never throws, and never
 * waits on the network. Page visits for the same user collapse for 1 minute.
 * A failed insert forgets that dedupe so a later visit can try again.
 */
export function logUsageEvent(draft: unknown, options: LogUsageEventOptions): void {
  try {
    const row = toUsageEventInsert(draft);
    if (!row) return;

    const now = options.now ?? Date.now();
    const store = options.store ?? defaultUsageDedupeStore();
    const dedupeKey = pageVisitDedupeKey(row);
    if (dedupeKey && isRecentPageVisit(store, dedupeKey, now)) return;
    if (dedupeKey) store.set(dedupeKey, now);

    void Promise.resolve()
      .then(() => options.insert(row))
      .catch(() => {
        if (!dedupeKey) return;
        try {
          store.delete(dedupeKey);
        } catch {
          // A broken dedupe store must not surface to the UI.
        }
      });
  } catch {
    // Missing table, denied insert, or a storage glitch stays silent.
  }
}

function defaultUsageDedupeStore(): UsageDedupeStore {
  return {
    get(key) {
      try {
        return readDedupeEntries().get(key) ?? null;
      } catch {
        return null;
      }
    },
    set(key, at) {
      try {
        const entries = readDedupeEntries();
        entries.set(key, at);
        writeDedupeEntries(entries, at);
      } catch {
        memoryDedupe.set(key, at);
      }
    },
    delete(key) {
      try {
        const entries = readDedupeEntries();
        entries.delete(key);
        memoryDedupe.delete(key);
        writeDedupeEntries(entries, Date.now());
      } catch {
        memoryDedupe.delete(key);
      }
    },
  };
}

function readDedupeEntries(): Map<string, number> {
  const merged = new Map(memoryDedupe);
  if (typeof window === "undefined") return merged;

  try {
    const raw = window.sessionStorage.getItem(DEDUPE_STORAGE_KEY);
    if (!raw) return merged;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return merged;
    }
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value !== "number" || !Number.isFinite(value)) continue;
      const current = merged.get(key);
      if (current == null || value > current) merged.set(key, value);
    }
  } catch {
    // Ignore unreadable session storage.
  }

  return merged;
}

function writeDedupeEntries(entries: Map<string, number>, now: number): void {
  memoryDedupe.clear();
  const fresh: Record<string, number> = {};
  for (const [key, at] of entries) {
    if (now - at >= USAGE_PAGE_VISIT_DEDUPE_MS) continue;
    memoryDedupe.set(key, at);
    fresh[key] = at;
  }
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(DEDUPE_STORAGE_KEY, JSON.stringify(fresh));
  } catch {
    // Private mode or a full quota. The in-memory map still covers this tab.
  }
}
