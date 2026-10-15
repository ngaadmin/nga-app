import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { restoreAccountProgressForUser } from "@/lib/dashboard/account-progress-local";
import { hasSeenHubIntro, markHubIntroSeen } from "@/lib/dashboard/hub-intro/storage";
import {
  hasAccountSeenMedalsIntro,
  PAGE_INTRO_SEEN_BY_ACCOUNT_KEY,
} from "@/lib/dashboard/page-intro-seen";
import { clearAllAppSessionState } from "@/lib/onboarding/clear-app-session-state";
import {
  GUEST_SESSION_STORAGE_KEY,
  readUserSession,
  saveUserSession,
  type UserSession,
} from "@/lib/onboarding/guest-session";

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
  birthYear: 2012,
  birthYearLocked: true,
  ageTier: "pathfinder",
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
      clearTimeout() {},
      setTimeout() {
        return 0;
      },
    },
  });
});

afterEach(() => {
  vi.unstubAllEnvs();
  Reflect.deleteProperty(globalThis, "window");
});

describe("page intro persistence", () => {
  it("keeps a dismissed intro after sign-out and the next sign-in", () => {
    saveUserSession(seatSession);
    markHubIntroSeen("academy");

    vi.stubEnv("NODE_ENV", "development");
    clearAllAppSessionState();

    expect(readUserSession()).toBeNull();
    const stored = JSON.parse(
      window.localStorage.getItem(PAGE_INTRO_SEEN_BY_ACCOUNT_KEY) ?? "{}",
    ) as Record<string, { hubs?: { academy?: boolean } }>;
    expect(stored[`user:${seatSession.supabaseUserId}`]?.hubs?.academy).toBe(true);
    expect(window.sessionStorage.getItem(GUEST_SESSION_STORAGE_KEY)).toBeNull();

    saveUserSession(seatSession);
    expect(hasSeenHubIntro("academy")).toBe(true);
  });

  it("applies seen intros from a learner progress payload when this device has none", () => {
    saveUserSession(seatSession);
    expect(hasSeenHubIntro("academy")).toBe(false);
    expect(hasAccountSeenMedalsIntro()).toBe(false);

    restoreAccountProgressForUser({
      userId: seatSession.supabaseUserId,
      username: seatSession.username,
      remote: {
        schemaVersion: 1,
        academyProgress: null,
        wallet: null,
        skillProgress: null,
        vaultProfile: null,
        vaultSession: null,
        pageIntros: {
          hubs: { academy: true },
          medals: true,
        },
      },
    });

    expect(hasSeenHubIntro("academy")).toBe(true);
    expect(hasAccountSeenMedalsIntro()).toBe(true);
  });
});
