import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  appendWalletLedgerEvent,
  currentWalletOwnerId,
  currentWalletPersonKey,
  readDashboardWalletState,
  saveDashboardWalletState,
  walletFieldsFromUnknown,
} from "@/lib/dashboard/dashboard-wallet-storage";
import {
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

function registeredSession(
  username: string,
  supabaseUserId?: string,
): UserSession {
  return {
    accessMode: "registered",
    username,
    ageTier: "explorer",
    curriculumCohort: "explorer",
    accountStatus: "ACTIVE",
    accountRole: "child",
    createdAt: "2026-10-09T00:00:00.000Z",
    convertedAt: "2026-10-09T00:00:00.000Z",
    consentApprovedAt: "2026-10-09T00:00:00.000Z",
    ...(supabaseUserId ? { supabaseUserId } : {}),
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

describe("wallet cash-in fields", () => {
  it("keeps the cents on a cash-in and the paid reset time", () => {
    const parsed = walletFieldsFromUnknown({
      totalPoints: 40,
      lifetimePointsEarned: 100,
      audSliderIndex: 2,
      xpExchangeRateSet: true,
      cashInOwedResetAt: "2026-10-04T00:00:00.000Z",
      ledger: [
        {
          id: "cash-1",
          kind: "spend",
          points: 60,
          at: "2026-10-05T00:00:00.000Z",
          audCents: 120,
        },
      ],
    });
    expect(parsed?.cashInOwedResetAt).toBe("2026-10-04T00:00:00.000Z");
    expect(parsed?.ledger?.[0]?.audCents).toBe(120);
    expect(parsed?.totalPoints).toBe(40);
  });
});

describe("dashboard wallet owner", () => {
  it("keeps coins saved as name:username after the Auth id arrives", () => {
    saveUserSession(registeredSession("delta4"));
    expect(currentWalletOwnerId()).toBe("name:delta4");
    expect(currentWalletPersonKey()).toBe("user:delta4");

    saveDashboardWalletState({
      totalPoints: 480,
      lifetimePointsEarned: 480,
      audSliderIndex: 0,
      xpExchangeRateSet: false,
    });

    const userId = "22222222-2222-2222-2222-222222222222";
    saveUserSession(registeredSession("delta4", userId));
    expect(currentWalletOwnerId()).toBe(userId);
    expect(currentWalletPersonKey()).toBe("user:delta4");

    const wallet = readDashboardWalletState();
    expect(wallet?.lifetimePointsEarned).toBe(480);
    expect(wallet?.ownerUserId).toBe("name:delta4");

    const cashedIn = appendWalletLedgerEvent(wallet!, {
      id: "lesson:1:completion",
      kind: "earn",
      points: 150,
      at: "2026-10-15T00:00:00.000Z",
    });
    expect(cashedIn?.lifetimePointsEarned).toBe(630);
    saveDashboardWalletState(cashedIn!);
    expect(readDashboardWalletState()?.lifetimePointsEarned).toBe(630);
  });

  it("hides another learner's name: wallet", () => {
    saveUserSession(registeredSession("delta4"));
    saveDashboardWalletState({
      totalPoints: 480,
      lifetimePointsEarned: 480,
      audSliderIndex: 0,
      xpExchangeRateSet: false,
    });

    saveUserSession(
      registeredSession("amber4", "33333333-3333-3333-3333-333333333333"),
    );
    expect(readDashboardWalletState()).toBeNull();
  });
});
