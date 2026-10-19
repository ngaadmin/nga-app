import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  completeAcademyMilestone,
  defaultAcademyMilestones,
  saveAcademyMilestones,
} from "@/lib/dashboard/academy-progress-storage";
import {
  freshDashboardWalletState,
  readDashboardWalletState,
  saveDashboardWalletState,
} from "@/lib/dashboard/dashboard-wallet-storage";
import { saveVaultSkillTierOverrides } from "@/lib/dashboard/vault-skill-progress-storage";
import { GUEST_SAVE_PROMPT_FIRST_SEEN_KEY } from "@/lib/dev/guest-device-store";
import {
  createGuestAccessSession,
  saveUserSession,
} from "@/lib/onboarding/guest-session";
import {
  dismissGuestSaveBanner,
  GUEST_LEAVE_ANYWAY_LABEL,
  GUEST_SAVE_NOT_NOW_LABEL,
  GUEST_SAVE_PROGRESS_LABEL,
  GUEST_SAVE_PROMPT_COPY,
  GUEST_SAVE_PROMPT_LATER_SEEN_KEY,
  GUEST_SAVE_SIGN_UP_HREF,
  guestHasUnsavedProgress,
  guestLeavePromptCopy,
  guestSaveBannerForCelebration,
  readGuestUnsavedXp,
  registerGuestLeaveOpener,
  requestGuestLeave,
  resetGuestSaveBannerClaims,
  resolveGuestSaveBanner,
  type GuestSaveBannerInput,
} from "@/lib/onboarding/guest-save-prompt";

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

function seedGuest(): void {
  saveUserSession(
    createGuestAccessSession({
      username: "pennyguest",
      genericProfileId: "guest-penny",
      curriculumCohort: "explorer",
    }),
  );
}

function seedXp(points: number): void {
  const fresh = freshDashboardWalletState();
  saveDashboardWalletState({
    ...fresh,
    totalPoints: points,
    lifetimePointsEarned: points,
  });
}

function bannerInput(
  overrides: Partial<GuestSaveBannerInput> = {},
): GuestSaveBannerInput {
  return {
    isGuest: true,
    completedLessonCountBefore: 0,
    isNewBadge: false,
    priorBadgeCount: 0,
    isModuleOrLevelFinish: false,
    isReplay: false,
    firstSeen: false,
    laterSeenThisSession: false,
    hasLessonContext: true,
    hasEarnedProgress: false,
    ...overrides,
  };
}

beforeEach(() => {
  installWindow();
  resetGuestSaveBannerClaims();
});

afterEach(() => {
  resetGuestSaveBannerClaims();
  Reflect.deleteProperty(globalThis, "window");
});

describe("guest save prompt copy", () => {
  it("uses the approved banner and leave lines", () => {
    expect(GUEST_SAVE_PROMPT_COPY).toBe(
      "Nice work! Save your coins so it's waiting for you next time.",
    );
    expect(GUEST_SAVE_PROGRESS_LABEL).toBe("Save my progress");
    expect(GUEST_SAVE_NOT_NOW_LABEL).toBe("Not now");
    expect(GUEST_LEAVE_ANYWAY_LABEL).toBe("Leave anyway");
    expect(guestLeavePromptCopy(40)).toBe(
      "You've earned 40 coins! Save it before you go?",
    );
    expect(guestLeavePromptCopy(40.8)).toBe(
      "You've earned 40 coins! Save it before you go?",
    );
    expect(guestLeavePromptCopy(1)).toBe(
      "You've earned 1 coin! Save it before you go?",
    );
    expect(GUEST_SAVE_SIGN_UP_HREF).toBe("/onboarding/sign-up?as=learner");
  });
});

describe("resolveGuestSaveBanner", () => {
  it("shows the first banner on the first lesson", () => {
    expect(resolveGuestSaveBanner(bannerInput())).toBe("first");
  });

  it("shows the first banner on the first badge", () => {
    expect(
      resolveGuestSaveBanner(
        bannerInput({
          completedLessonCountBefore: 2,
          isNewBadge: true,
          hasEarnedProgress: true,
        }),
      ),
    ).toBe("first");
  });

  it("shows a later banner once for a new badge or a finished module", () => {
    expect(
      resolveGuestSaveBanner(
        bannerInput({
          completedLessonCountBefore: 3,
          isNewBadge: true,
          priorBadgeCount: 1,
          firstSeen: true,
          hasEarnedProgress: true,
        }),
      ),
    ).toBe("later");
    expect(
      resolveGuestSaveBanner(
        bannerInput({
          completedLessonCountBefore: 8,
          isModuleOrLevelFinish: true,
          firstSeen: true,
          hasEarnedProgress: true,
        }),
      ),
    ).toBe("later");
    expect(
      resolveGuestSaveBanner(
        bannerInput({
          completedLessonCountBefore: 8,
          isModuleOrLevelFinish: true,
          firstSeen: true,
          laterSeenThisSession: true,
          hasEarnedProgress: true,
        }),
      ),
    ).toBeNull();
  });

  it("skips replays, registered learners, and a badge opened before any progress", () => {
    expect(resolveGuestSaveBanner(bannerInput({ isReplay: true }))).toBeNull();
    expect(resolveGuestSaveBanner(bannerInput({ isGuest: false }))).toBeNull();
    expect(
      resolveGuestSaveBanner(
        bannerInput({
          hasLessonContext: false,
          isNewBadge: true,
          hasEarnedProgress: false,
        }),
      ),
    ).toBeNull();
  });
});

describe("guestSaveBannerForCelebration", () => {
  it("marks the first lesson once and keeps the same claim on remount", () => {
    seedGuest();

    const first = guestSaveBannerForCelebration({
      claimId: "lesson:1:1",
      isNewBadge: true,
      isModuleOrLevelFinish: false,
      moduleNumber: 1,
      lessonNumber: 1,
    });
    const remount = guestSaveBannerForCelebration({
      claimId: "lesson:1:1",
      isNewBadge: true,
      isModuleOrLevelFinish: false,
      moduleNumber: 1,
      lessonNumber: 1,
    });

    expect(first).toBe("first");
    expect(remount).toBe("first");
    expect(window.localStorage.getItem(GUEST_SAVE_PROMPT_FIRST_SEEN_KEY)).toBe(
      "1",
    );
  });

  it("hides a replay and a later lesson that is not a bigger moment", () => {
    seedGuest();
    saveAcademyMilestones(
      completeAcademyMilestone(1, defaultAcademyMilestones()),
    );
    window.localStorage.setItem(GUEST_SAVE_PROMPT_FIRST_SEEN_KEY, "1");

    expect(
      guestSaveBannerForCelebration({
        claimId: "lesson:1:1",
        isNewBadge: true,
        isModuleOrLevelFinish: false,
        moduleNumber: 1,
        lessonNumber: 1,
      }),
    ).toBeNull();

    expect(
      guestSaveBannerForCelebration({
        claimId: "lesson:1:2",
        isNewBadge: false,
        isModuleOrLevelFinish: false,
        moduleNumber: 1,
        lessonNumber: 2,
      }),
    ).toBeNull();
  });

  it("shows one later banner for a finished module, then stays quiet", () => {
    seedGuest();
    saveAcademyMilestones(
      completeAcademyMilestone(1, defaultAcademyMilestones()),
    );
    window.localStorage.setItem(GUEST_SAVE_PROMPT_FIRST_SEEN_KEY, "1");

    expect(
      guestSaveBannerForCelebration({
        claimId: "lesson:1:9",
        isNewBadge: false,
        isModuleOrLevelFinish: true,
        moduleNumber: 1,
        lessonNumber: 9,
      }),
    ).toBe("later");
    expect(window.sessionStorage.getItem(GUEST_SAVE_PROMPT_LATER_SEEN_KEY)).toBe(
      "1",
    );

    expect(
      guestSaveBannerForCelebration({
        claimId: "lesson:2:9",
        isNewBadge: false,
        isModuleOrLevelFinish: true,
        moduleNumber: 2,
        lessonNumber: 18,
      }),
    ).toBeNull();
  });

  it("does not clear wallet or session when the banner is dismissed", () => {
    seedGuest();
    seedXp(40);
    saveVaultSkillTierOverrides({ "spot-a-need": "bronze" });

    guestSaveBannerForCelebration({
      claimId: "lesson:1:1",
      isNewBadge: false,
      isModuleOrLevelFinish: false,
      moduleNumber: 1,
      lessonNumber: 1,
    });
    dismissGuestSaveBanner("lesson:1:1");

    expect(readGuestUnsavedXp()).toBe(40);
    expect(guestHasUnsavedProgress()).toBe(true);
    expect(readDashboardWalletState()?.lifetimePointsEarned).toBe(40);
    expect(window.localStorage.getItem("nga_guest_session")).toContain(
      "pennyguest",
    );
  });
});

describe("requestGuestLeave", () => {
  it("leaves immediately when the guest has no XP", () => {
    seedGuest();
    let proceeded = false;
    requestGuestLeave(() => {
      proceeded = true;
    });
    expect(proceeded).toBe(true);
  });

  it("asks before leaving unsaved XP and does not wipe progress", () => {
    seedGuest();
    seedXp(25);
    let proceeded = false;
    let asked = false;
    const unregister = registerGuestLeaveOpener((proceed) => {
      asked = true;
      expect(readGuestUnsavedXp()).toBe(25);
      proceed();
    });

    requestGuestLeave(() => {
      proceeded = true;
    });

    expect(asked).toBe(true);
    expect(proceeded).toBe(true);
    expect(readDashboardWalletState()?.lifetimePointsEarned).toBe(25);
    unregister();
  });

  it("does not ask a registered learner", () => {
    let proceeded = false;
    requestGuestLeave(() => {
      proceeded = true;
    });
    expect(proceeded).toBe(true);
    expect(readGuestUnsavedXp()).toBe(0);
  });
});
