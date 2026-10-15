import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearAllAppSessionState } from "@/lib/onboarding/clear-app-session-state";
import {
  readUserSession,
  saveUserSession,
  type UserSession,
} from "@/lib/onboarding/guest-session";
import * as recordingAction from "@/lib/recording/suppress-intro-action";
import {
  captureRecordingSuppressIntroQuery,
  enableRecordingSuppressIntroFlag,
  readRecordingSuppressIntroFlag,
  RECORDING_SUPPRESS_INTRO_FLAG_KEY,
} from "@/lib/recording/suppress-intro-flag";
import { resetRecordingSuppressDecisionCache, resolveRecordingSuppressIntro } from "@/lib/recording/resolve-recording-suppress-intro";
import {
  matchesRecordingSuppressIntro,
  RECORDING_SUPPRESSED_INTRO_IDS,
  RECORDING_SUPPRESS_INTRO_USERS_FALLBACK,
  recordingSuppressIntroIdentities,
} from "@/lib/recording/suppress-intro";

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

function guest(username: string, extra: Partial<UserSession> = {}): UserSession {
  return {
    accessMode: "guest",
    username,
    ageTier: "pathfinder",
    curriculumCohort: "pathfinder",
    accountStatus: "GUEST",
    createdAt: "2026-10-15T00:00:00.000Z",
    ...extra,
  };
}

beforeEach(() => {
  delete process.env.RECORDING_SUPPRESS_INTRO_USERS;
  resetRecordingSuppressDecisionCache();
  const local = memoryStorage();
  const session = memoryStorage();
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      localStorage: local,
      sessionStorage: session,
      location: { search: "" },
      dispatchEvent() {
        return true;
      },
    },
  });
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  resetRecordingSuppressDecisionCache();
  Reflect.deleteProperty(globalThis, "window");
});

describe("recording intro allow-list", () => {
  it("uses the in-code fallback when the env var is unset or blank", () => {
    expect(recordingSuppressIntroIdentities()).toEqual([
      ...RECORDING_SUPPRESS_INTRO_USERS_FALLBACK,
    ]);
    expect(matchesRecordingSuppressIntro(["delta3"])).toBe(true);
    expect(
      matchesRecordingSuppressIntro([
        "cath+recteacher1015@nextgenachievers.com.au",
      ]),
    ).toBe(true);

    vi.stubEnv("RECORDING_SUPPRESS_INTRO_USERS", "   \n\t  ");
    expect(recordingSuppressIntroIdentities()).toEqual([
      ...RECORDING_SUPPRESS_INTRO_USERS_FALLBACK,
    ]);
    expect(matchesRecordingSuppressIntro(["cathmav1015"])).toBe(true);
  });

  it("lets a non-empty env list replace the fallback", () => {
    vi.stubEnv(
      "RECORDING_SUPPRESS_INTRO_USERS",
      " Delta9 , cath+recteacher1015@nextgenachievers.com.au ",
    );
    expect(recordingSuppressIntroIdentities()).toEqual([
      "Delta9",
      "cath+recteacher1015@nextgenachievers.com.au",
    ]);
    expect(matchesRecordingSuppressIntro(["delta9"])).toBe(true);
    expect(matchesRecordingSuppressIntro(["delta3"])).toBe(false);
    expect(matchesRecordingSuppressIntro(["cathpf1015"])).toBe(false);
  });

  it("matches usernames and emails without case, and keeps + addresses", () => {
    expect(matchesRecordingSuppressIntro(["DeLtA7"])).toBe(true);
    expect(
      matchesRecordingSuppressIntro([
        "CATH+RECTEACHER1015@NEXTGENACHIEVERS.COM.AU",
      ]),
    ).toBe(true);
    expect(matchesRecordingSuppressIntro(["pennytest"])).toBe(false);
    expect(matchesRecordingSuppressIntro(["delta5"])).toBe(false);
    expect(matchesRecordingSuppressIntro(["", "  "])).toBe(false);
    expect(
      matchesRecordingSuppressIntro(["cath recteacher1015@nextgenachievers.com.au"]),
    ).toBe(false);
  });

  it("lists the first-visit intros this switch closes", () => {
    expect(RECORDING_SUPPRESSED_INTRO_IDS).toEqual([
      "academy",
      "launchpad",
      "community",
      "vault",
      "medals",
      "vault-add-money",
      "parent-first-welcome",
    ]);
  });
});

describe("recording intro server action", () => {
  it("ignores empty payloads, extra identities, and overlong values", async () => {
    await expect(recordingAction.recordingIdentitySuppressesIntros([])).resolves.toBe(
      false,
    );
    const extras = Array.from({ length: 8 }, (_, index) => `nobody${index}`);
    await expect(
      recordingAction.recordingIdentitySuppressesIntros([...extras, "delta4"]),
    ).resolves.toBe(false);
    await expect(
      recordingAction.recordingIdentitySuppressesIntros(["delta4", ...extras]),
    ).resolves.toBe(true);
    await expect(
      recordingAction.recordingIdentitySuppressesIntros([`${"delta4"}${"x".repeat(300)}`]),
    ).resolves.toBe(false);
  });
});

describe("recording intro session flag", () => {
  it("turns on only for ?recording=1 and round-trips on the session", () => {
    expect(captureRecordingSuppressIntroQuery("?recording=0")).toBe(false);
    expect(captureRecordingSuppressIntroQuery("recording=true")).toBe(false);
    expect(readRecordingSuppressIntroFlag()).toBe(false);

    saveUserSession(guest("pennytest"));
    expect(captureRecordingSuppressIntroQuery("?recording=1")).toBe(true);
    expect(readRecordingSuppressIntroFlag()).toBe(true);
    expect(readUserSession()?.recordingSuppressIntro).toBe(true);
    expect(window.localStorage.getItem(RECORDING_SUPPRESS_INTRO_FLAG_KEY)).toBeNull();

    const stored = readUserSession();
    expect(stored?.username).toBe("pennytest");
    expect(stored?.recordingSuppressIntro).toBe(true);
  });

  it("leaves a normal session without the recording field", () => {
    saveUserSession(guest("pennytest"));
    expect(readUserSession()?.recordingSuppressIntro).toBeUndefined();
  });

  it("keeps the tab flag after logout", () => {
    saveUserSession(guest("delta3"));
    enableRecordingSuppressIntroFlag();
    clearAllAppSessionState();
    expect(readRecordingSuppressIntroFlag()).toBe(true);
    expect(readUserSession()).toBeNull();
  });
});

describe("resolveRecordingSuppressIntro", () => {
  it("suppresses a listed username and caches the decision", async () => {
    const spy = vi.spyOn(recordingAction, "recordingIdentitySuppressesIntros");
    saveUserSession(guest("delta3"));
    await expect(resolveRecordingSuppressIntro()).resolves.toBe(true);
    await expect(resolveRecordingSuppressIntro()).resolves.toBe(true);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("matches a listed email on the session", async () => {
    saveUserSession(
      guest("teacher", {
        accessMode: "registered",
        accountStatus: "ACTIVE",
        learnerEmail: "Cath+RecTeacher1015@nextgenachievers.com.au",
        email: "Cath+RecTeacher1015@nextgenachievers.com.au",
        supabaseUserId: "11111111-1111-1111-1111-111111111111",
      }),
    );
    await expect(resolveRecordingSuppressIntro()).resolves.toBe(true);
  });

  it("leaves everyone else unchanged", async () => {
    saveUserSession(guest("pennytest", { learnerEmail: "pennytest@example.com" }));
    await expect(resolveRecordingSuppressIntro()).resolves.toBe(false);
  });

  it("suppresses a guest tab opened with ?recording=1 without a lookup", async () => {
    const spy = vi.spyOn(recordingAction, "recordingIdentitySuppressesIntros");
    window.location.search = "?recording=1";
    await expect(resolveRecordingSuppressIntro()).resolves.toBe(true);
    expect(spy).not.toHaveBeenCalled();
    expect(readRecordingSuppressIntroFlag()).toBe(true);
    expect(readUserSession()).toBeNull();
  });

  it("stamps an open session when the tab flag is already set", async () => {
    saveUserSession(guest("pennytest"));
    window.sessionStorage.setItem(RECORDING_SUPPRESS_INTRO_FLAG_KEY, "1");
    await expect(resolveRecordingSuppressIntro()).resolves.toBe(true);
    expect(readUserSession()?.recordingSuppressIntro).toBe(true);
  });

  it("stays visible when the lookup fails and retries on the next check", async () => {
    saveUserSession(guest("delta9"));
    vi.spyOn(recordingAction, "recordingIdentitySuppressesIntros").mockRejectedValueOnce(
      new Error("lookup failed"),
    );
    await expect(resolveRecordingSuppressIntro()).resolves.toBe(false);
    await expect(resolveRecordingSuppressIntro()).resolves.toBe(true);
  });
});
