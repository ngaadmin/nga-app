import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { applyLearnerAccountSnapshot } from "@/lib/onboarding/sync-registered-session";

function memoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear() {
      map.clear();
    },
    getItem(key: string) {
      return map.get(key) ?? null;
    },
    key(index: number) {
      return [...map.keys()][index] ?? null;
    },
    removeItem(key: string) {
      map.delete(key);
    },
    setItem(key: string, value: string) {
      map.set(key, value);
    },
  };
}

beforeEach(() => {
  const local = memoryStorage();
  const session = memoryStorage();
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      localStorage: local,
      sessionStorage: session,
      dispatchEvent() {
        return true;
      },
    },
  });
});

afterEach(() => {
  Reflect.deleteProperty(globalThis, "window");
});

describe("applyLearnerAccountSnapshot", () => {
  it("stores the class seat curriculum cohort so Academy opens that track", () => {
    const session = applyLearnerAccountSnapshot({
      userId: "22222222-2222-2222-2222-222222222222",
      username: "amber4",
      birthYear: 2014,
      curriculumCohort: "explorer",
      accountRole: "child",
      accountStatus: "active",
      consentApprovedAt: "2026-10-09T00:00:00.000Z",
      parentEmail: null,
      learnerEmail: null,
    });

    expect(session.curriculumCohort).toBe("explorer");
  });
});
