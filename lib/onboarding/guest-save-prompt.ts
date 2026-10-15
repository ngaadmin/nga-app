import { readAcademyMilestones } from "@/lib/dashboard/academy-progress-storage";
import {
  isModuleCloserLessonNumber,
  LESSONS_PER_LEVEL,
} from "@/lib/dashboard/academy-state";
import { readDashboardWalletState } from "@/lib/dashboard/dashboard-wallet-storage";
import type { SkillTrophyTier } from "@/lib/dashboard/skill-trophies";
import { readVaultSkillTierOverrides } from "@/lib/dashboard/vault-skill-progress-storage";
import { GUEST_SAVE_PROMPT_FIRST_SEEN_KEY } from "@/lib/dev/guest-device-store";
import {
  isGuestSession,
  ONBOARDING_SIGN_UP_LEARNER_PATH,
  readUserSession,
} from "@/lib/onboarding/guest-session";

/** Once per browser session for later milestones. Not copied onto the device store. */
export const GUEST_SAVE_PROMPT_LATER_SEEN_KEY = "nga_guest_save_prompt_later_seen_v1";

export const GUEST_SAVE_PROMPT_COPY =
  "Nice work! Save your XP so it's waiting for you next time.";
export const GUEST_SAVE_PROGRESS_LABEL = "Save my progress";
export const GUEST_SAVE_NOT_NOW_LABEL = "Not now";
export const GUEST_LEAVE_ANYWAY_LABEL = "Leave anyway";

/** Learner sign-up. The guest session already preselects the track. */
export const GUEST_SAVE_SIGN_UP_HREF = ONBOARDING_SIGN_UP_LEARNER_PATH;

export type GuestSaveBannerMoment = "first" | "later";

const BADGE_TIERS = new Set<SkillTrophyTier>([
  "unlocked",
  "bronze",
  "silver",
  "gold",
]);

const claimedMoments = new Map<string, GuestSaveBannerMoment | null>();

export function guestLeavePromptCopy(xp: number): string {
  const earned = Math.max(0, Math.floor(xp));
  return `You've earned ${earned} XP! Save it before you go?`;
}

export function isGuestSaveBadgeTier(
  tier: SkillTrophyTier | null | undefined,
): boolean {
  return tier != null && BADGE_TIERS.has(tier);
}

export type GuestSaveBannerInput = {
  isGuest: boolean;
  /** Lessons already completed before this celebration. */
  completedLessonCountBefore: number;
  isNewBadge: boolean;
  priorBadgeCount: number;
  isModuleOrLevelFinish: boolean;
  /** This lesson was already completed. A replay is not a new milestone. */
  isReplay: boolean;
  firstSeen: boolean;
  laterSeenThisSession: boolean;
  /** Lesson completion. A badge modal has no lesson attached. */
  hasLessonContext: boolean;
  /** XP, a finished lesson, or a stored badge already on this device. */
  hasEarnedProgress: boolean;
};

/**
 * First lesson or first badge shows the banner once.
 * A later new badge or finished level/module shows it at most once per session.
 * Opening a badge before any earned progress does not spend the prompt.
 */
export function resolveGuestSaveBanner(
  input: GuestSaveBannerInput,
): GuestSaveBannerMoment | null {
  if (!input.isGuest || input.isReplay) return null;

  const isFirstLesson =
    input.hasLessonContext && input.completedLessonCountBefore === 0;
  const isFirstBadge =
    input.isNewBadge &&
    input.priorBadgeCount === 0 &&
    (input.hasLessonContext || input.hasEarnedProgress);
  if ((isFirstLesson || isFirstBadge) && !input.firstSeen) return "first";

  const isBiggerMoment = input.isNewBadge || input.isModuleOrLevelFinish;
  if (!isBiggerMoment || input.laterSeenThisSession) return null;
  if (!input.hasLessonContext && !input.hasEarnedProgress) return null;
  return "later";
}

export function hasGuestSaveFirstSeen(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(GUEST_SAVE_PROMPT_FIRST_SEEN_KEY) === "1";
}

export function markGuestSaveFirstSeen(): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(GUEST_SAVE_PROMPT_FIRST_SEEN_KEY, "1");
}

export function hasGuestSaveLaterSeen(): boolean {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(GUEST_SAVE_PROMPT_LATER_SEEN_KEY) === "1";
}

export function markGuestSaveLaterSeen(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(GUEST_SAVE_PROMPT_LATER_SEEN_KEY, "1");
}

export function resetGuestSaveBannerClaims(): void {
  claimedMoments.clear();
}

/**
 * Decide once per celebration id. A second call for the same id returns the
 * same moment so a remount does not hide the banner.
 */
export function claimGuestSaveBanner(
  claimId: string,
  input: GuestSaveBannerInput,
): GuestSaveBannerMoment | null {
  if (claimedMoments.has(claimId)) {
    return claimedMoments.get(claimId) ?? null;
  }
  const moment = resolveGuestSaveBanner(input);
  claimedMoments.set(claimId, moment);
  if (moment === "first") markGuestSaveFirstSeen();
  if (moment === "later") markGuestSaveLaterSeen();
  return moment;
}

export function dismissGuestSaveBanner(claimId: string): void {
  claimedMoments.set(claimId, null);
}

function countCompletedLessons(): number {
  return readAcademyMilestones().filter((node) => node.status === "completed")
    .length;
}

function countEarnedBadges(): number {
  return Object.values(readVaultSkillTierOverrides()).filter(
    (tier) => tier != null && BADGE_TIERS.has(tier),
  ).length;
}

function milestoneIdForLesson(moduleNumber: number, lessonNumber: number): number {
  return (moduleNumber - 1) * LESSONS_PER_LEVEL + lessonNumber;
}

function isLessonReplay(moduleNumber?: number, lessonNumber?: number): boolean {
  if (!moduleNumber || !lessonNumber) return false;
  const id = milestoneIdForLesson(moduleNumber, lessonNumber);
  return readAcademyMilestones().some(
    (node) => node.id === id && node.status === "completed",
  );
}

export function readGuestSaveBannerInput(input: {
  isNewBadge: boolean;
  isModuleOrLevelFinish: boolean;
  moduleNumber?: number;
  lessonNumber?: number;
}): GuestSaveBannerInput {
  const hasLessonContext = Boolean(input.moduleNumber || input.lessonNumber);
  if (typeof window === "undefined") {
    return {
      isGuest: false,
      completedLessonCountBefore: 0,
      isNewBadge: input.isNewBadge,
      priorBadgeCount: 0,
      isModuleOrLevelFinish: input.isModuleOrLevelFinish,
      isReplay: false,
      firstSeen: false,
      laterSeenThisSession: false,
      hasLessonContext,
      hasEarnedProgress: false,
    };
  }

  const completedLessonCountBefore = countCompletedLessons();
  const priorBadgeCount = countEarnedBadges();
  const earnedXp = readDashboardWalletState()?.lifetimePointsEarned ?? 0;

  return {
    isGuest: isGuestSession(readUserSession()),
    completedLessonCountBefore,
    isNewBadge: input.isNewBadge,
    priorBadgeCount,
    isModuleOrLevelFinish: input.isModuleOrLevelFinish,
    isReplay: isLessonReplay(input.moduleNumber, input.lessonNumber),
    firstSeen: hasGuestSaveFirstSeen(),
    laterSeenThisSession: hasGuestSaveLaterSeen(),
    hasLessonContext,
    hasEarnedProgress:
      earnedXp > 0 || completedLessonCountBefore > 0 || priorBadgeCount > 0,
  };
}

export function guestSaveBannerForCelebration(input: {
  claimId: string;
  isNewBadge: boolean;
  isModuleOrLevelFinish: boolean;
  moduleNumber?: number;
  lessonNumber?: number;
}): GuestSaveBannerMoment | null {
  return claimGuestSaveBanner(input.claimId, readGuestSaveBannerInput(input));
}

export function isFinishedLevelOrModule(lessonNumber?: number): boolean {
  return typeof lessonNumber === "number" && isModuleCloserLessonNumber(lessonNumber);
}

/** XP still only on this device. Zero means there is nothing to warn about. */
export function readGuestUnsavedXp(): number {
  if (typeof window === "undefined") return 0;
  if (!isGuestSession(readUserSession())) return 0;
  const earned = readDashboardWalletState()?.lifetimePointsEarned ?? 0;
  return Math.max(0, Math.floor(earned));
}

export function guestHasUnsavedProgress(): boolean {
  return readGuestUnsavedXp() > 0;
}

type LeaveOpener = (proceed: () => void) => void;

let leaveOpener: LeaveOpener | null = null;
let trackedPath = "";
let trackedHistoryState: unknown = null;
let bypassGuestBack = false;
let guestBackListenerInstalled = false;

/** Remember the dashboard URL so browser Back can be confirmed first. */
export function trackGuestDashboardPath(path: string): void {
  trackedPath = path;
  if (typeof window !== "undefined") {
    trackedHistoryState = window.history.state;
  }
}

function onGuestBackPopState(event: PopStateEvent): void {
  if (bypassGuestBack) {
    bypassGuestBack = false;
    return;
  }
  const now = window.location.pathname;
  if (!leaveOpener) return;
  if (!trackedPath.startsWith("/dashboard")) return;
  if (now.startsWith("/dashboard")) return;
  if (now.startsWith("/onboarding/sign-up")) return;
  if (!guestHasUnsavedProgress()) return;

  // Capture runs before the App Router applies the back navigation.
  event.stopImmediatePropagation();
  const state =
    trackedHistoryState && typeof trackedHistoryState === "object"
      ? trackedHistoryState
      : null;
  window.history.pushState(state, "", trackedPath);
  leaveOpener(() => {
    bypassGuestBack = true;
    window.history.back();
  });
}

export function installGuestBackListener(): void {
  if (guestBackListenerInstalled || typeof window === "undefined") return;
  guestBackListenerInstalled = true;
  (
    window as Window & {
      __ngaGuestBack?: (event: PopStateEvent) => void;
    }
  ).__ngaGuestBack = onGuestBackPopState;
}

if (typeof window !== "undefined") {
  installGuestBackListener();
}

export function registerGuestLeaveOpener(opener: LeaveOpener): () => void {
  leaveOpener = opener;
  return () => {
    if (leaveOpener === opener) leaveOpener = null;
  };
}

/** Show the leave dialog when this guest still has XP. Otherwise run proceed. */
export function requestGuestLeave(proceed: () => void): void {
  if (!guestHasUnsavedProgress() || !leaveOpener) {
    proceed();
    return;
  }
  leaveOpener(proceed);
}
