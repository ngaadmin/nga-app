import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const saveLearnerProgressForUser = vi.hoisted(() =>
  vi.fn(async (...args: unknown[]) => {
    void args;
    return { ok: true };
  }),
);
const loadLearnerProgressByUserId = vi.hoisted(() =>
  vi.fn(async (...args: unknown[]) => {
    void args;
    return null;
  }),
);

vi.mock("@/lib/onboarding/learner-progress", () => ({
  saveLearnerProgressForUser,
  loadLearnerProgressByUserId,
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getUser: async () => ({
        data: { user: { id: "11111111-1111-4111-8111-111111111111" } },
      }),
    },
  }),
}));

vi.mock("@/lib/email/request-send", () => ({
  requestOnboardingEmailSend: vi.fn(async () => ({ success: true })),
}));

vi.mock("@/lib/onboarding/registered-accounts", () => ({
  REGISTERED_ACCOUNTS_STORAGE_KEY: "nga_registered_accounts_v1",
  upsertRegisteredAccount: vi.fn(),
}));

import { ACADEMY_PROGRESS_STORAGE_KEY } from "@/lib/dashboard/academy-progress-storage";
import { HUB_INTRO_SEEN_STORAGE_KEY } from "@/lib/dashboard/hub-intro/storage";
import { PAGE_INTRO_SEEN_BY_ACCOUNT_KEY } from "@/lib/dashboard/page-intro-seen";
import {
  completeAcademyMilestone,
  defaultAcademyMilestones,
  readAcademyMilestones,
  saveAcademyMilestones,
} from "@/lib/dashboard/academy-progress-storage";
import { persistRegisteredProgressNow } from "@/lib/dashboard/account-progress-sync";
import { DASHBOARD_WALLET_STORAGE_KEY } from "@/lib/dashboard/dashboard-wallet-storage";
import { VAULT_SKILL_PROGRESS_STORAGE_KEY } from "@/lib/dashboard/vault-skill-progress-storage";
import { writeVaultSessionRaw, readVaultSessionRaw } from "@/lib/dashboard/vault/profile-persist";
import { VAULT_SESSION_STORAGE_KEY } from "@/lib/dashboard/vault/vault-profile-storage";
import { readPersisted, writePersisted } from "@/lib/dev/client-persist";
import {
  GUEST_DEVICE_EXPIRE_EXTRA_KEYS,
  GUEST_DEVICE_META_KEY,
  GUEST_DEVICE_TTL_MS,
  wipeGuestDeviceProgress,
} from "@/lib/dev/guest-device-store";
import { clearAllAppSessionState } from "@/lib/onboarding/clear-app-session-state";
import {
  createGuestAccessSession,
  GUEST_SESSION_STORAGE_KEY,
  readUserSession,
  saveUserSession,
  convertToRegisteredProfile,
  type UserSession,
} from "@/lib/onboarding/guest-session";
import {
  GUEST_PROGRESS_SNAPSHOT_KEY,
  readGuestProgressSnapshot,
} from "@/lib/onboarding/guest-progress-snapshot";
import { finalizeRegisteredSignup } from "@/lib/onboarding/signup-finalize";
import type { MasteryCohort } from "@/lib/dashboard/mastery-cohort";
import type { AccountProgressPayload } from "@/lib/dashboard/account-progress";

const USER_ID = "11111111-1111-4111-8111-111111111111";

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

function installWindow(): void {
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      localStorage: memoryStorage(),
      sessionStorage: memoryStorage(),
      dispatchEvent() {
        return true;
      },
    },
  });
}

function seedGuestPlay(cohort: MasteryCohort = "explorer"): void {
  const session = createGuestAccessSession({
    username: "pennyguest",
    genericProfileId: "guest-penny",
    curriculumCohort: cohort,
  });
  saveUserSession(session);
  saveAcademyMilestones(
    completeAcademyMilestone(1, defaultAcademyMilestones()),
  );
  writePersisted(DASHBOARD_WALLET_STORAGE_KEY, JSON.stringify({ totalPoints: 8 }));
  writePersisted(
    VAULT_SKILL_PROGRESS_STORAGE_KEY,
    JSON.stringify({ "spot-a-need": "bronze" }),
  );
  writeVaultSessionRaw(VAULT_SESSION_STORAGE_KEY, JSON.stringify({ spend: 4 }));
  writePersisted(
    GUEST_PROGRESS_SNAPSHOT_KEY,
    JSON.stringify({
      capturedAt: "2026-10-15T00:00:00.000Z",
      guestSession: session,
      wallet: window.localStorage.getItem(DASHBOARD_WALLET_STORAGE_KEY),
      vaultSession: window.localStorage.getItem(VAULT_SESSION_STORAGE_KEY),
      vaultProfile: null,
      academyProgress: window.localStorage.getItem(ACADEMY_PROGRESS_STORAGE_KEY),
      skillProgress: window.localStorage.getItem(VAULT_SKILL_PROGRESS_STORAGE_KEY),
      parentPin: null,
    }),
  );
}

function registeredChild(
  cohort: MasteryCohort,
  accountStatus: "PENDING_CONSENT" | "ACTIVE",
): UserSession {
  return convertToRegisteredProfile({
    username: "learner1",
    accountRole: "child",
    curriculumCohort: cohort,
    parentEmail: cohort === "maverick" ? undefined : "parent@example.com",
    learnerEmail: cohort === "explorer" ? undefined : "learner@example.com",
    password: "secret12",
    supabaseUserId: USER_ID,
    accountStatus,
    consentApprovedAt:
      accountStatus === "ACTIVE" ? "2026-10-15T12:00:00.000Z" : undefined,
  });
}

beforeEach(() => {
  installWindow();
  saveLearnerProgressForUser.mockClear();
  loadLearnerProgressByUserId.mockClear();
});

afterEach(() => {
  Reflect.deleteProperty(globalThis, "window");
});

describe("guest device progress", () => {
  it("keeps guest progress after the tab session is cleared", () => {
    seedGuestPlay();

    window.sessionStorage.clear();

    expect(readUserSession()?.accessMode).toBe("guest");
    expect(readUserSession()?.username).toBe("pennyguest");
    expect(readPersisted(DASHBOARD_WALLET_STORAGE_KEY)).toContain("totalPoints");
    expect(readPersisted(ACADEMY_PROGRESS_STORAGE_KEY)).toBeTruthy();
    expect(readPersisted(VAULT_SKILL_PROGRESS_STORAGE_KEY)).toContain("bronze");
    expect(readVaultSessionRaw(VAULT_SESSION_STORAGE_KEY)).toContain("spend");
    expect(readPersisted(GUEST_PROGRESS_SNAPSHOT_KEY)).toContain("pennyguest");
    expect(readAcademyMilestones().find((node) => node.id === 1)?.status).toBe(
      "completed",
    );

    const meta = JSON.parse(
      window.localStorage.getItem(GUEST_DEVICE_META_KEY) ?? "{}",
    ) as { expiresAt?: number };
    expect(meta.expiresAt).toBeGreaterThan(Date.now() + GUEST_DEVICE_TTL_MS - 60_000);
  });

  it("drops an expired guest copy, including guest page-intro flags only", () => {
    seedGuestPlay();
    window.localStorage.setItem(
      PAGE_INTRO_SEEN_BY_ACCOUNT_KEY,
      JSON.stringify({
        "guest:guest-penny": { hubs: { academy: true } },
        "guest:device": { hubs: { vault: true } },
        "user:abc": { hubs: { academy: true } },
      }),
    );
    window.localStorage.setItem(
      HUB_INTRO_SEEN_STORAGE_KEY,
      JSON.stringify({ academy: true }),
    );
    window.localStorage.setItem(
      GUEST_DEVICE_META_KEY,
      JSON.stringify({ guestId: "guest-penny", expiresAt: Date.now() - 1000 }),
    );
    window.sessionStorage.clear();

    expect(GUEST_DEVICE_EXPIRE_EXTRA_KEYS).toEqual([HUB_INTRO_SEEN_STORAGE_KEY]);
    expect(readPersisted(ACADEMY_PROGRESS_STORAGE_KEY)).toBeNull();
    expect(readPersisted(DASHBOARD_WALLET_STORAGE_KEY)).toBeNull();
    expect(readUserSession()).toBeNull();
    expect(window.localStorage.getItem(ACADEMY_PROGRESS_STORAGE_KEY)).toBeNull();
    expect(window.localStorage.getItem(GUEST_DEVICE_META_KEY)).toBeNull();
    expect(window.localStorage.getItem(GUEST_SESSION_STORAGE_KEY)).toBeNull();
    expect(
      JSON.parse(window.localStorage.getItem(PAGE_INTRO_SEEN_BY_ACCOUNT_KEY) ?? "{}"),
    ).toEqual({ "user:abc": { hubs: { academy: true } } });
    expect(window.localStorage.getItem(HUB_INTRO_SEEN_STORAGE_KEY)).toBeNull();
  });

  it("leaves a registered account on the session store", () => {
    saveUserSession(registeredChild("pathfinder", "ACTIVE"));
    writePersisted(DASHBOARD_WALLET_STORAGE_KEY, "{\"totalPoints\":4}");

    expect(window.sessionStorage.getItem(DASHBOARD_WALLET_STORAGE_KEY)).toBe(
      "{\"totalPoints\":4}",
    );
    expect(window.localStorage.getItem(DASHBOARD_WALLET_STORAGE_KEY)).toBeNull();
    expect(window.localStorage.getItem(GUEST_SESSION_STORAGE_KEY)).toBeNull();
  });

  it("wipes guest progress on logout and when a new guest starts", () => {
    seedGuestPlay();
    window.localStorage.setItem(PAGE_INTRO_SEEN_BY_ACCOUNT_KEY, "{\"user:1\":{}}");
    wipeGuestDeviceProgress();
    expect(window.localStorage.getItem(PAGE_INTRO_SEEN_BY_ACCOUNT_KEY)).toBe(
      "{\"user:1\":{}}",
    );

    expect(readUserSession()).toBeNull();
    expect(window.localStorage.getItem(ACADEMY_PROGRESS_STORAGE_KEY)).toBeNull();
    expect(window.sessionStorage.getItem(DASHBOARD_WALLET_STORAGE_KEY)).toBeNull();
    expect(window.localStorage.getItem(GUEST_DEVICE_META_KEY)).toBeNull();

    seedGuestPlay();
    clearAllAppSessionState();
    expect(window.localStorage.getItem(GUEST_SESSION_STORAGE_KEY)).toBeNull();
    expect(window.localStorage.getItem(GUEST_PROGRESS_SNAPSHOT_KEY)).toBeNull();
    expect(window.localStorage.getItem(GUEST_DEVICE_META_KEY)).toBeNull();
  });
});

describe("signup progress carry-over", () => {
  it("holds Explorer progress on the device until approval, including the pending email branch", async () => {
    seedGuestPlay("explorer");

    await finalizeRegisteredSignup(registeredChild("explorer", "PENDING_CONSENT"), {
      explorerConsentToken: "consent-token",
    });

    expect(saveLearnerProgressForUser).not.toHaveBeenCalled();
    expect(readGuestProgressSnapshot()?.heldForConsent).toBe(true);

    saveLearnerProgressForUser.mockClear();
    installWindow();
    seedGuestPlay("explorer");
    await finalizeRegisteredSignup(registeredChild("explorer", "PENDING_CONSENT"), {
      skipEmail: true,
    });

    expect(saveLearnerProgressForUser).not.toHaveBeenCalled();
    expect(readGuestProgressSnapshot()?.heldForConsent).toBe(true);

    window.sessionStorage.clear();
    saveAcademyMilestones(
      completeAcademyMilestone(2, readAcademyMilestones()),
    );

    saveUserSession(registeredChild("explorer", "ACTIVE"));
    await finalizeRegisteredSignup(registeredChild("explorer", "ACTIVE"), {
      skipEmail: true,
    });

    expect(saveLearnerProgressForUser).toHaveBeenCalledTimes(1);
    const payload = saveLearnerProgressForUser.mock.calls[0]?.[1] as AccountProgressPayload;
    expect(payload.academyProgress?.find((node) => node.id === 2)?.status).toBe(
      "completed",
    );
    expect(readGuestProgressSnapshot()).toBeNull();
    expect(window.localStorage.getItem(GUEST_PROGRESS_SNAPSHOT_KEY)).toBeNull();
  });

  it("does not upload learner progress while an Explorer is still pending", async () => {
    seedGuestPlay("explorer");
    await finalizeRegisteredSignup(registeredChild("explorer", "PENDING_CONSENT"), {
      skipEmail: true,
    });
    saveLearnerProgressForUser.mockClear();

    await persistRegisteredProgressNow();

    expect(saveLearnerProgressForUser).not.toHaveBeenCalled();
  });

  it("merges Pathfinder and Maverick progress at sign-up", async () => {
    for (const cohort of ["pathfinder", "maverick"] as const) {
      installWindow();
      saveLearnerProgressForUser.mockClear();
      seedGuestPlay(cohort);

      await finalizeRegisteredSignup(registeredChild(cohort, "ACTIVE"), {
        skipEmail: true,
      });

      expect(saveLearnerProgressForUser).toHaveBeenCalledTimes(1);
      expect(readGuestProgressSnapshot()).toBeNull();

      window.sessionStorage.clear();
      expect(readUserSession()).toBeNull();
      expect(window.localStorage.getItem(GUEST_SESSION_STORAGE_KEY)).toBeNull();
    }
  });
});
