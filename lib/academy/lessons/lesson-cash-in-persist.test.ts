import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const saveLearnerProgressForUser = vi.hoisted(() =>
  vi.fn(async () => ({ ok: true })),
);
const loadLearnerProgressByUserId = vi.hoisted(() =>
  vi.fn(async () => null),
);

vi.mock("@/lib/onboarding/learner-progress", () => ({
  saveLearnerProgressForUser,
  loadLearnerProgressByUserId,
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getUser: async () => ({
        data: { user: { id: "11111111-1111-1111-1111-111111111111" } },
      }),
    },
  }),
}));

import { applyLessonCoinAward } from "@/lib/academy/lessons/lesson-coin-commit";
import {
  lessonAwardLedgerEvents,
  lessonCoinAward,
} from "@/lib/academy/lessons/completion-xp";
import { persistRegisteredProgressNow } from "@/lib/dashboard/account-progress-sync";
import {
  persistAccountProgressCacheFromLive,
  restoreAccountProgressForUser,
} from "@/lib/dashboard/account-progress-local";
import {
  DASHBOARD_WALLET_STORAGE_KEY,
  persistedWalletFromLiveState,
  readDashboardWalletState,
  saveDashboardWalletState,
  WALLET_SCHEMA_VERSION,
  type PersistedDashboardWallet,
} from "@/lib/dashboard/dashboard-wallet-storage";
import {
  createGuestAccessSession,
  saveUserSession,
  type UserSession,
} from "@/lib/onboarding/guest-session";

const AT = "2026-10-20T00:00:00.000Z";
const SEAT_ID = "11111111-1111-1111-1111-111111111111";

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

function freshWallet(): PersistedDashboardWallet {
  return {
    schemaVersion: WALLET_SCHEMA_VERSION,
    totalPoints: 0,
    lifetimePointsEarned: 0,
    audSliderIndex: 0,
    xpExchangeRateSet: false,
  };
}

function awardLessonOne(): PersistedDashboardWallet {
  return applyLessonCoinAward(
    freshWallet(),
    lessonAwardLedgerEvents(1, lessonCoinAward({ perfect: false, bonusCoins: 0 })),
    AT,
  ).wallet;
}

const classSeat = {
  accessMode: "registered",
  username: "amber4",
  ageTier: "pathfinder",
  curriculumCohort: "pathfinder",
  accountStatus: "ACTIVE",
  accountRole: "child",
  createdAt: "2026-10-09T00:00:00.000Z",
  convertedAt: "2026-10-09T00:00:00.000Z",
  consentApprovedAt: "2026-10-09T00:00:00.000Z",
  supabaseUserId: SEAT_ID,
} as UserSession;

beforeEach(() => {
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      localStorage: memoryStorage(),
      sessionStorage: memoryStorage(),
      dispatchEvent() {
        return true;
      },
      clearTimeout() {},
      setTimeout() {
        return 0;
      },
    },
  });
  saveLearnerProgressForUser.mockReset();
  saveLearnerProgressForUser.mockResolvedValue({ ok: true });
  loadLearnerProgressByUserId.mockReset();
  loadLearnerProgressByUserId.mockResolvedValue(null);
});

afterEach(() => {
  Reflect.deleteProperty(globalThis, "window");
});

describe("lesson cash-in persistence", () => {
  it("keeps a guest balance after the tab session is cleared", () => {
    saveUserSession(
      createGuestAccessSession({
        username: "lars",
        genericProfileId: "guest-lars",
        curriculumCohort: "explorer",
      }),
    );
    saveDashboardWalletState(awardLessonOne());

    expect(readDashboardWalletState()?.totalPoints).toBe(100);
    window.sessionStorage.clear();

    expect(readDashboardWalletState()?.totalPoints).toBe(100);
  });

  it("restores a class-seat balance from the account cache", () => {
    saveUserSession(classSeat);
    saveDashboardWalletState(awardLessonOne());
    persistAccountProgressCacheFromLive({
      userId: classSeat.supabaseUserId,
      username: classSeat.username,
    });

    window.sessionStorage.removeItem(DASHBOARD_WALLET_STORAGE_KEY);
    expect(readDashboardWalletState()).toBeNull();

    restoreAccountProgressForUser({
      userId: classSeat.supabaseUserId,
      username: classSeat.username,
    });

    expect(readDashboardWalletState()?.totalPoints).toBe(100);
  });

  it("does not let a stale on-screen total wipe saved coins", () => {
    const existing = awardLessonOne();
    const kept = persistedWalletFromLiveState(
      {
        totalPoints: 0,
        lifetimePointsEarned: 100,
        audSliderIndex: 0,
        xpExchangeRateSet: false,
        exchangeRateCentsPer100Xp: null,
      },
      existing,
    );
    expect(kept.totalPoints).toBe(100);

    const spent = persistedWalletFromLiveState(
      {
        totalPoints: 60,
        lifetimePointsEarned: 100,
        audSliderIndex: 0,
        xpExchangeRateSet: false,
        exchangeRateCentsPer100Xp: null,
      },
      { ...existing, totalPoints: 60 },
    );
    expect(spent.totalPoints).toBe(60);

    const raised = persistedWalletFromLiveState(
      {
        totalPoints: 150,
        lifetimePointsEarned: 150,
        audSliderIndex: 0,
        xpExchangeRateSet: false,
        exchangeRateCentsPer100Xp: null,
      },
      existing,
    );
    expect(raised.totalPoints).toBe(150);
  });

  it("reports a failed account save so cash-in can retry", async () => {
    saveUserSession(classSeat);
    saveDashboardWalletState(awardLessonOne());
    saveLearnerProgressForUser.mockResolvedValue({ ok: false });

    const result = await persistRegisteredProgressNow();

    expect(result.ok).toBe(false);
    expect(saveLearnerProgressForUser).toHaveBeenCalledTimes(1);
  });

  it("treats a guest save as done without an account upload", async () => {
    saveUserSession(
      createGuestAccessSession({
        username: "lars",
        genericProfileId: "guest-lars",
        curriculumCohort: "explorer",
      }),
    );
    saveDashboardWalletState(awardLessonOne());

    const result = await persistRegisteredProgressNow();

    expect(result.ok).toBe(true);
    expect(saveLearnerProgressForUser).not.toHaveBeenCalled();
  });
});
