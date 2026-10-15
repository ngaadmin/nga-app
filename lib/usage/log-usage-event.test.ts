import { describe, expect, it } from "vitest";
import {
  logUsageEvent,
  createMemoryUsageDedupeStore,
  type UsageEventInsert,
} from "@/lib/usage/log-usage-event";

const NOW = 1_700_000_000_000;

function row(overrides: Partial<UsageEventInsert> = {}): UsageEventInsert {
  return {
    username: "amber4",
    class_id: null,
    event_type: "vault_visit",
    lesson_number: null,
    xp_total: 120,
    streak_days: 3,
    metadata: {},
    ...overrides,
  };
}

async function flush(): Promise<void> {
  await new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

describe("logUsageEvent", () => {
  it("inserts a sanitized row and returns before the insert finishes", () => {
    const store = createMemoryUsageDedupeStore();
    let finished = false;
    const inserted: UsageEventInsert[] = [];

    const result = logUsageEvent(
      {
        eventType: "lesson_completed",
        username: "  amber4  ",
        classId: "class-a",
        lessonNumber: 4.8,
        xpTotal: 120.9,
        streakDays: 3,
        metadata: {
          skill: "smart-saving",
          tier: "bronze",
          email: "student@example.com",
          name: "Amber",
          ip: "203.0.113.8",
          userAgent: "Mozilla",
        },
      },
      {
        now: NOW,
        store,
        insert: (next) =>
          new Promise((resolve) => {
            setTimeout(() => {
              finished = true;
              inserted.push(next);
              resolve();
            }, 30);
          }),
      },
    );

    expect(result).toBeUndefined();
    expect(finished).toBe(false);
    expect(inserted).toEqual([]);
  });

  it("keeps medal labels and drops personal fields from metadata", async () => {
    const store = createMemoryUsageDedupeStore();
    const inserted: UsageEventInsert[] = [];

    logUsageEvent(
      {
        eventType: "medal_earned",
        username: "amber4",
        lessonNumber: 4,
        xpTotal: 120.2,
        streakDays: 3,
        metadata: {
          skill: "smart-saving",
          tier: "bronze",
          email: "student@example.com",
          userAgent: "Mozilla",
        },
      },
      {
        now: NOW,
        store,
        insert: async (next) => {
          inserted.push(next);
        },
      },
    );
    await flush();

    expect(inserted).toEqual([
      row({
        event_type: "medal_earned",
        lesson_number: 4,
        xp_total: 120,
        metadata: { skill: "smart-saving", tier: "bronze" },
      }),
    ]);
  });

  it("rejects emails, blank usernames, and unknown event types", async () => {
    const store = createMemoryUsageDedupeStore();
    let calls = 0;
    const insert = async () => {
      calls += 1;
    };

    logUsageEvent(
      { eventType: "login", username: "student@example.com" },
      { now: NOW, store, insert },
    );
    logUsageEvent(
      { eventType: "login", username: "   " },
      { now: NOW, store, insert },
    );
    logUsageEvent(
      { eventType: "page_view", username: "amber4" },
      { now: NOW, store, insert },
    );
    await flush();

    expect(calls).toBe(0);
  });

  it("does not dedupe login, lesson completion, or medals", async () => {
    const store = createMemoryUsageDedupeStore();
    const inserted: string[] = [];
    const insert = async (next: UsageEventInsert) => {
      inserted.push(next.event_type);
    };

    for (const eventType of ["login", "lesson_completed", "medal_earned"] as const) {
      logUsageEvent(
        { eventType, username: "amber4", lessonNumber: 2 },
        { now: NOW, store, insert },
      );
      logUsageEvent(
        { eventType, username: "amber4", lessonNumber: 2 },
        { now: NOW + 1_000, store, insert },
      );
    }
    await flush();

    expect(inserted).toEqual([
      "login",
      "login",
      "lesson_completed",
      "lesson_completed",
      "medal_earned",
      "medal_earned",
    ]);
  });

  it("dedupes page visits for one minute and keeps a second user", async () => {
    const store = createMemoryUsageDedupeStore();
    const inserted: UsageEventInsert[] = [];
    const insert = async (next: UsageEventInsert) => {
      inserted.push(next);
    };

    logUsageEvent(
      { eventType: "vault_visit", username: "amber4", xpTotal: 10, streakDays: 1 },
      { now: NOW, store, insert },
    );
    logUsageEvent(
      { eventType: "vault_visit", username: "amber4" },
      { now: NOW + 59_999, store, insert },
    );
    logUsageEvent(
      { eventType: "vault_visit", username: "cedar2" },
      { now: NOW + 1_000, store, insert },
    );
    logUsageEvent(
      { eventType: "launchpad_visit", username: "amber4" },
      { now: NOW + 1_000, store, insert },
    );
    logUsageEvent(
      { eventType: "lesson_started", username: "amber4", lessonNumber: 1 },
      { now: NOW, store, insert },
    );
    logUsageEvent(
      { eventType: "lesson_started", username: "amber4", lessonNumber: 1 },
      { now: NOW + 10_000, store, insert },
    );
    logUsageEvent(
      { eventType: "lesson_started", username: "amber4", lessonNumber: 2 },
      { now: NOW + 10_000, store, insert },
    );
    await flush();

    expect(inserted.map((next) => `${next.username}:${next.event_type}:${next.lesson_number}`)).toEqual([
      "amber4:vault_visit:null",
      "cedar2:vault_visit:null",
      "amber4:launchpad_visit:null",
      "amber4:lesson_started:1",
      "amber4:lesson_started:2",
    ]);

    logUsageEvent(
      { eventType: "vault_visit", username: "amber4" },
      { now: NOW + 60_000, store, insert },
    );
    await flush();

    expect(inserted.filter((next) => next.event_type === "vault_visit" && next.username === "amber4")).toHaveLength(2);
  });

  it("does not throw when the insert fails and retries the page visit", async () => {
    const store = createMemoryUsageDedupeStore();
    let calls = 0;

    expect(() =>
      logUsageEvent(
        { eventType: "vault_visit", username: "amber4" },
        {
          now: NOW,
          store,
          insert: () => {
            calls += 1;
            throw new Error('relation "usage_events" does not exist');
          },
        },
      ),
    ).not.toThrow();
    await flush();

    logUsageEvent(
      { eventType: "vault_visit", username: "amber4" },
      {
        now: NOW + 1_000,
        store,
        insert: async () => {
          calls += 1;
          throw new Error("permission denied");
        },
      },
    );
    await flush();

    expect(calls).toBe(2);
  });

  it("drops lesson numbers on visits that are not lessons", async () => {
    const store = createMemoryUsageDedupeStore();
    const inserted: UsageEventInsert[] = [];

    logUsageEvent(
      {
        eventType: "launchpad_visit",
        username: "amber4",
        lessonNumber: 3,
        xpTotal: Number.NaN,
        streakDays: -1,
        classId: "not an id",
      },
      {
        now: NOW,
        store,
        insert: async (next) => {
          inserted.push(next);
        },
      },
    );
    await flush();

    expect(inserted).toEqual([
      row({
        event_type: "launchpad_visit",
        lesson_number: null,
        xp_total: null,
        streak_days: null,
        class_id: null,
      }),
    ]);
  });
});
