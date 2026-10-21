import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { MASTERY_COHORT_ORDER, type MasteryCohort } from "@/lib/dashboard/mastery-cohort";
import {
  markExplorerPendingPlayAllowed,
  shouldBlockExplorerPendingPlay,
} from "@/lib/onboarding/explorer-pending-consent";
import {
  convertToRegisteredProfile,
  createGuestAccessSession,
  enforceCohortAccountState,
  hasCompletedPersonalizationGate,
  readUserSession,
  saveUserSession,
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

describe("track picker guest play", () => {
  it.each(MASTERY_COHORT_ORDER)(
    "lets a %s kid play as a guest without a parent-approval wall",
    (cohort: MasteryCohort) => {
      const created = createGuestAccessSession({
        username: "PennyGuest",
        genericProfileId: `guest-${cohort}`,
        curriculumCohort: cohort,
      });
      saveUserSession(created);

      const session = readUserSession();
      expect(session?.accessMode).toBe("guest");
      expect(session?.accountStatus).toBe("GUEST");
      expect(session?.accountRole).toBeUndefined();
      expect(session?.curriculumCohort).toBe(cohort);
      expect(session?.ageTier).toBe(cohort);
      expect(session?.parentEmail).toBeUndefined();
      expect(session).not.toHaveProperty("birthYear");
      expect(session?.parentApprovalRequired).toBeUndefined();
      expect(hasCompletedPersonalizationGate(session)).toBe(true);
      expect(shouldBlockExplorerPendingPlay(session)).toBe(false);
    },
  );

  it("starts parent approval only when an Explorer saves an account", () => {
    const explorer = convertToRegisteredProfile({
      username: "CashDragon88",
      accountRole: "child",
      curriculumCohort: "explorer",
      parentEmail: "parent@example.com",
      password: "secret1",
      supabaseUserId: "explorer-user",
    });
    expect(explorer.accountStatus).toBe("PENDING_CONSENT");
    expect(shouldBlockExplorerPendingPlay(explorer)).toBe(true);
    markExplorerPendingPlayAllowed();
    expect(shouldBlockExplorerPendingPlay(explorer)).toBe(false);

    const pathfinder = convertToRegisteredProfile({
      username: "TrailKid13",
      accountRole: "child",
      curriculumCohort: "pathfinder",
      learnerEmail: "trail@example.com",
      parentEmail: "parent@example.com",
      password: "secret1",
      supabaseUserId: "pathfinder-user",
    });
    expect(pathfinder.accountStatus).toBe("ACTIVE");
    expect(shouldBlockExplorerPendingPlay(pathfinder)).toBe(false);

    const maverick = convertToRegisteredProfile({
      username: "SkyMav16",
      accountRole: "child",
      curriculumCohort: "maverick",
      learnerEmail: "sky@example.com",
      password: "secret1",
      supabaseUserId: "maverick-user",
    });
    expect(maverick.accountStatus).toBe("ACTIVE");
    expect(maverick.parentEmail).toBeUndefined();
    expect(shouldBlockExplorerPendingPlay(maverick)).toBe(false);
  });

  it("holds a 15-year-old Maverick for parent approval and leaves the track", () => {
    const session = convertToRegisteredProfile({
      username: "YoungMav",
      accountRole: "child",
      curriculumCohort: "maverick",
      learnerEmail: "young@example.com",
      parentEmail: "parent@example.com",
      password: "secret1",
      accountStatus: "ACTIVE",
      parentApprovalRequired: true,
      marketingOptIn: true,
      supabaseUserId: "mav-15",
    });
    expect(session.curriculumCohort).toBe("maverick");
    expect(session.accountStatus).toBe("PENDING_CONSENT");
    expect(session.parentApprovalRequired).toBe(true);
    expect(session.marketingOptIn).toBe(false);
    expect(session).not.toHaveProperty("birthYear");
    expect(shouldBlockExplorerPendingPlay(session)).toBe(true);
  });

  it("lets a 16-year-old Pathfinder and a 16-year-old Explorer skip the parent step", () => {
    const pathfinder = convertToRegisteredProfile({
      username: "TrailSixteen",
      accountRole: "child",
      curriculumCohort: "pathfinder",
      learnerEmail: "trail@example.com",
      password: "secret1",
      accountStatus: "ACTIVE",
      parentApprovalRequired: false,
      marketingOptIn: true,
      supabaseUserId: "path-16",
    });
    expect(pathfinder.curriculumCohort).toBe("pathfinder");
    expect(pathfinder.accountStatus).toBe("ACTIVE");
    expect(pathfinder.parentEmail).toBeUndefined();
    expect(pathfinder.marketingOptIn).toBe(false);
    expect(shouldBlockExplorerPendingPlay(pathfinder)).toBe(false);

    const explorer = convertToRegisteredProfile({
      username: "ExplorerSixteen",
      accountRole: "child",
      curriculumCohort: "explorer",
      learnerEmail: "explorer16@example.com",
      password: "secret1",
      accountStatus: "ACTIVE",
      parentApprovalRequired: false,
      supabaseUserId: "exp-16",
    });
    expect(explorer.accountStatus).toBe("ACTIVE");
    expect(explorer.learnerEmail).toBe("explorer16@example.com");
    expect(explorer.parentEmail).toBeUndefined();
    expect(explorer.parentApprovalRequired).toBe(false);
    expect(enforceCohortAccountState(explorer).accountStatus).toBe("ACTIVE");
    expect(shouldBlockExplorerPendingPlay(explorer)).toBe(false);
  });
});
