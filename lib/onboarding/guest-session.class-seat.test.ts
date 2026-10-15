import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getMasteryCohortFromBirthYear } from "@/lib/dashboard/mastery-cohort";
import {
  GUEST_SESSION_STORAGE_KEY,
  readUserSession,
  saveUserSession,
  type UserSession,
} from "@/lib/onboarding/guest-session";
import { currentAccountLocalKey } from "@/lib/onboarding/account-local-key";
import { hasSeenHubIntro, markHubIntroSeen } from "@/lib/dashboard/hub-intro/storage";
import { PAGE_INTRO_SEEN_BY_ACCOUNT_KEY } from "@/lib/dashboard/page-intro-seen";

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

const seatSession = {
  accessMode: "registered",
  username: "amber4",
  ageTier: "pathfinder",
  curriculumCohort: "pathfinder",
  accountStatus: "ACTIVE",
  accountRole: "child",
  createdAt: "2026-10-09T00:00:00.000Z",
  convertedAt: "2026-10-09T00:00:00.000Z",
  consentApprovedAt: "2026-10-09T00:00:00.000Z",
  supabaseUserId: "11111111-1111-1111-1111-111111111111",
} as UserSession;

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

describe("class seat session", () => {
  it("reads a Pathfinder seat with no learner email instead of treating them as signed out", () => {
    saveUserSession(seatSession);
    expect(window.sessionStorage.getItem(GUEST_SESSION_STORAGE_KEY)).toBeTruthy();

    const session = readUserSession();
    expect(session?.username).toBe("amber4");
    expect(session?.accessMode).toBe("registered");
    expect(currentAccountLocalKey()).toBe(`user:${seatSession.supabaseUserId}`);
  });

  it("stores Academy intro seen on the seat account, not a shared session flag", () => {
    saveUserSession(seatSession);
    expect(hasSeenHubIntro("academy")).toBe(false);
    markHubIntroSeen("academy");
    expect(hasSeenHubIntro("academy")).toBe(true);

    const store = JSON.parse(
      window.localStorage.getItem(PAGE_INTRO_SEEN_BY_ACCOUNT_KEY) ?? "{}",
    ) as Record<string, { hubs?: { academy?: boolean } }>;
    expect(store[`user:${seatSession.supabaseUserId}`]?.hubs?.academy).toBe(true);
    expect(window.sessionStorage.getItem("nga_hub_intro_seen_v2")).toBeNull();
  });

  it("maps an old birth-year session onto a track and does not keep the year", () => {
    const legacyYear = 2014;
    window.sessionStorage.setItem(
      GUEST_SESSION_STORAGE_KEY,
      JSON.stringify({
        accessMode: "registered",
        username: "oldkid",
        birthYear: legacyYear,
        birthYearLocked: true,
        accountStatus: "PENDING_CONSENT",
        accountRole: "child",
        createdAt: "2026-01-01T00:00:00.000Z",
        supabaseUserId: "44444444-4444-4444-4444-444444444444",
      }),
    );

    const session = readUserSession();
    expect(session?.curriculumCohort).toBe(
      getMasteryCohortFromBirthYear(legacyYear),
    );
    expect(session).not.toHaveProperty("birthYear");
  });

  it("keeps a saved track when an old birth year is also stored", () => {
    window.sessionStorage.setItem(
      GUEST_SESSION_STORAGE_KEY,
      JSON.stringify({
        accessMode: "guest",
        username: "lars",
        birthYear: 2014,
        ageTier: "explorer",
        curriculumCohort: "maverick",
        accountStatus: "GUEST",
        createdAt: "2026-01-01T00:00:00.000Z",
      }),
    );

    const session = readUserSession();
    expect(session?.curriculumCohort).toBe("maverick");
    expect(session?.ageTier).toBe("maverick");
  });
});
