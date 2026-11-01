import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { restoreAccountProgressForUser } from "@/lib/dashboard/account-progress-local";
import {
  hasSeenHubIntro,
  markHubIntroSeen,
} from "@/lib/dashboard/hub-intro/storage";
import {
  hasAccountSeenMedalsIntro,
  PAGE_INTRO_SEEN_BY_ACCOUNT_KEY,
} from "@/lib/dashboard/page-intro-seen";
import { releaseGuestDeviceLocalCopy } from "@/lib/dev/guest-device-store";
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

function guestSession(genericProfileId: string): UserSession {
  return {
    accessMode: "guest",
    username: `Penny${genericProfileId}`,
    genericProfileId,
    ageTier: "explorer",
    curriculumCohort: "explorer",
    accountStatus: "GUEST",
    createdAt: "2026-10-31T00:00:00.000Z",
  } as UserSession;
}

describe("page intro persistence", () => {
  it("keeps guest dismissals when the same device picks a new guest profile", () => {
    saveUserSession(guestSession("1722"));
    markHubIntroSeen("academy");
    expect(hasSeenHubIntro("academy")).toBe(true);

    saveUserSession(guestSession("8841"));
    expect(hasSeenHubIntro("academy")).toBe(true);
    expect(hasSeenHubIntro("vault")).toBe(false);
  });

  it("honors older per-guest-id dismissals", () => {
    window.localStorage.setItem(
      PAGE_INTRO_SEEN_BY_ACCOUNT_KEY,
      JSON.stringify({
        "guest:1722": { hubs: { launchpad: true }, medals: true },
      }),
    );
    saveUserSession(guestSession("1722"));
    expect(hasSeenHubIntro("launchpad")).toBe(true);
    expect(hasAccountSeenMedalsIntro()).toBe(true);
  });

  it("releasing the guest device copy keeps registered dismissals", () => {
    saveUserSession(seatSession);
    markHubIntroSeen("academy");
    releaseGuestDeviceLocalCopy();
    expect(hasSeenHubIntro("academy")).toBe(true);
  });

  it("keeps a dismissed intro after sign-out and the next sign-in", () => {
    saveUserSession(seatSession);
    markHubIntroSeen("academy");

    vi.stubEnv("NODE_ENV", "development");
    clearAllAppSessionState();

    expect(readUserSession()).toBeNull();
    const stored = JSON.parse(
      window.localStorage.getItem(PAGE_INTRO_SEEN_BY_ACCOUNT_KEY) ?? "{}",
    ) as Record<string, { hubs?: { academy?: boolean } }>;
    expect(stored[`user:${seatSession.supabaseUserId}`]?.hubs?.academy).toBe(
      true,
    );
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
