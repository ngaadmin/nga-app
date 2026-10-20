"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  completeAcademyMilestone,
  readAcademyMilestones,
  saveAcademyMilestones,
} from "@/lib/dashboard/academy-progress-storage";
import { useDashboardWallet } from "@/lib/dashboard/dashboard-wallet-context";
import {
  applyLessonSkillTierProgress,
  applyPayloadSkillTierProgress,
  resolveSkillSlugForMilestone,
  skillTierForLessonNumber,
  type EarnedSkillMedal,
  type SkillTrophyTier,
} from "@/lib/dashboard/skill-trophies";
import { recordLessonPractice } from "@/lib/dashboard/streak-practice";
import { recordUsageEvent } from "@/lib/usage/record-usage-event";
import {
  lessonNumberForMilestoneId,
  levelGroupForMilestoneId,
} from "@/lib/dashboard/academy-state";
import { persistAccountProgressCacheFromLive } from "@/lib/dashboard/account-progress-local";
import { persistRegisteredProgressNow } from "@/lib/dashboard/account-progress-sync";
import {
  lessonCashInNeedsRetry,
  type LessonCashInOutcome,
} from "@/lib/academy/lessons/lesson-coin-commit";
import { isExplorerPendingConsent } from "@/lib/onboarding/explorer-pending-consent";
import {
  applyBonusRunEvent,
  initialBonusRunState,
} from "@/lib/academy/lessons/bonus-run";
import { markCoinCounterTick } from "@/lib/academy/lessons/coin-counter-flight";
import {
  lessonAwardLedgerEvents,
  lessonCoinAward,
} from "@/lib/academy/lessons/completion-xp";
import { readDashboardWalletState } from "@/lib/dashboard/dashboard-wallet-storage";
import {
  getSessionCurriculumCohort,
  readGuestAccessSession,
} from "@/lib/onboarding/guest-session";

export type UseLessonFlowOptions = {
  milestoneId: number;
  totalScreens: number;
  skillSlug: string;
  /** Dev-only design shell — skip XP and milestone writes on Cash In. */
  isDesignShell?: boolean;
  /** Lesson QA preview — play without writing Academy progress or cash-in. */
  skipProgressWrites?: boolean;
  /** Defaults to /dashboard/academy */
  exitHref?: string;
  /** Design-shell jumper can open on a non-zero screen. */
  initialScreenIndex?: number;
  /**
   * Next from this screen index jumps here instead of index + 1.
   * Used for CONTINUE targets and for skipping a sibling branch row.
   */
  continueIndexByScreen?: readonly (number | undefined)[];
  /** Count advances along the path the student takes, instead of the row index. */
  trackPathProgress?: boolean;
  /**
   * Medal tier from a payload completion row. When set, Cash In stores this
   * tier instead of the lesson-number unlock/bronze rule.
   */
  skillAwardTier?: Exclude<SkillTrophyTier, "locked">;
};

type PendingFlowAction =
  | { type: "mark-ready"; index: number }
  | { type: "increment-mistake" };

export function useLessonFlow({
  milestoneId,
  totalScreens,
  skillSlug,
  isDesignShell = false,
  skipProgressWrites = false,
  exitHref = "/dashboard/academy",
  initialScreenIndex = 0,
  skillAwardTier,
  continueIndexByScreen,
  trackPathProgress = false,
}: UseLessonFlowOptions) {
  const router = useRouter();
  const { saveLessonCoinAward } = useDashboardWallet();

  const [screenIndex, setScreenIndexState] = useState(initialScreenIndex);
  const [pathStep, setPathStep] = useState(0);
  const screenIndexRef = useRef(initialScreenIndex);
  const [screenReady, setScreenReady] = useState<boolean[]>(
    () => Array.from({ length: totalScreens }, () => false),
  );
  const [screenMistakes, setScreenMistakes] = useState(0);
  const [lessonComplete, setLessonComplete] = useState(false);
  const [bonusRun, setBonusRun] = useState(initialBonusRunState);
  const bonusUnitRef = useRef<string | null>(null);
  const bonusRunRef = useRef(bonusRun);
  bonusRunRef.current = bonusRun;

  const perfectStreak = screenMistakes === 0;

  const pendingActionsRef = useRef<PendingFlowAction[]>([]);
  const flushTimeoutRef = useRef<number | null>(null);
  const cashInStartedRef = useRef(false);
  const leavingAfterCashInRef = useRef(false);
  const activeMilestoneRef = useRef(milestoneId);

  useEffect(() => {
    router.prefetch(exitHref);
  }, [exitHref, router]);

  /** New lesson session — empty the coin meter and clear the mistake count. */
  useEffect(() => {
    if (activeMilestoneRef.current === milestoneId) return;
    activeMilestoneRef.current = milestoneId;
    screenIndexRef.current = 0;
    setScreenIndexState(0);
    setPathStep(0);
    setScreenReady(Array.from({ length: totalScreens }, () => false));
    setScreenMistakes(0);
    setLessonComplete(false);
    bonusUnitRef.current = null;
    setBonusRun(initialBonusRunState());
    cashInStartedRef.current = false;
    leavingAfterCashInRef.current = false;
    pendingActionsRef.current = [];
  }, [milestoneId, totalScreens]);

  const flushPendingActions = useCallback(() => {
    flushTimeoutRef.current = null;
    const actions = pendingActionsRef.current.splice(0);

    for (const action of actions) {
      switch (action.type) {
        case "mark-ready":
          setScreenReady((current) => {
            if (current[action.index]) return current;
            const next = [...current];
            next[action.index] = true;
            return next;
          });
          break;
        case "increment-mistake":
          setScreenMistakes((count) => count + 1);
          break;
      }
    }
  }, []);

  const scheduleFlowFlush = useCallback(() => {
    if (flushTimeoutRef.current !== null) return;
    flushTimeoutRef.current = window.setTimeout(flushPendingActions, 0);
  }, [flushPendingActions]);

  const enqueueFlowAction = useCallback(
    (action: PendingFlowAction) => {
      pendingActionsRef.current.push(action);
      scheduleFlowFlush();
    },
    [scheduleFlowFlush],
  );

  const markScreenReady = useCallback(
    (index: number) => {
      enqueueFlowAction({ type: "mark-ready", index });
    },
    [enqueueFlowAction],
  );

  const clearScreenReady = useCallback((index: number) => {
    setScreenReady((current) => {
      if (!current[index]) return current;
      const next = [...current];
      next[index] = false;
      return next;
    });
  }, []);

  const setBonusRunUnit = useCallback((unitId: string | null) => {
    bonusUnitRef.current = unitId;
  }, []);

  const recordBonusRunCorrect = useCallback(() => {
    const unitId = bonusUnitRef.current;
    if (!unitId) return;
    setBonusRun((state) => applyBonusRunEvent(state, { kind: "correct", unitId }));
  }, []);

  const incrementMistake = useCallback(() => {
    const unitId = bonusUnitRef.current;
    if (unitId) {
      setBonusRun((state) => applyBonusRunEvent(state, { kind: "wrong", unitId }));
    }
    enqueueFlowAction({ type: "increment-mistake" });
  }, [enqueueFlowAction]);

  useEffect(
    () => () => {
      if (flushTimeoutRef.current !== null) {
        window.clearTimeout(flushTimeoutRef.current);
      }
    },
    [],
  );

  const finishLessonRef = useRef<() => Promise<LessonCashInOutcome>>(async () => ({
    ok: false,
  }));

  const setScreenIndex = useCallback(
    (value: number | ((current: number) => number)) => {
      const current = screenIndexRef.current;
      const next = typeof value === "function" ? value(current) : value;
      if (next === current) return;
      screenIndexRef.current = next;
      if (trackPathProgress) setPathStep((step) => step + 1);
      setScreenIndexState(next);
    },
    [trackPathProgress],
  );

  const handleNext = useCallback(
    (options?: { canAdvance?: boolean }) => {
      const canAdvance = options?.canAdvance ?? Boolean(screenReady[screenIndex]);
      if (!canAdvance) return;
      const jumped = continueIndexByScreen?.[screenIndex];
      if (typeof jumped === "number") {
        setScreenIndex(jumped);
        return;
      }
      if (screenIndex >= totalScreens - 1) {
        finishLessonRef.current();
        return;
      }
      setScreenIndex((current) => Math.min(totalScreens - 1, current + 1));
    },
    [continueIndexByScreen, screenIndex, screenReady, setScreenIndex, totalScreens],
  );

  const handleCashInPoints = useCallback(async (): Promise<LessonCashInOutcome> => {
    const balanceNow = () => readDashboardWalletState()?.totalPoints ?? 0;
    if (cashInStartedRef.current || lessonComplete) {
      return { ok: true, balance: balanceNow() };
    }
    cashInStartedRef.current = true;

    if (isDesignShell || skipProgressWrites) {
      setLessonComplete(true);
      return { ok: true, balance: balanceNow() };
    }

    const award = lessonCoinAward({
      perfect: perfectStreak,
      bonusCoins: bonusRunRef.current.bonusCoins,
    });
    const saved = saveLessonCoinAward(lessonAwardLedgerEvents(milestoneId, award));
    if (!saved.ok) {
      cashInStartedRef.current = false;
      return { ok: false };
    }
    if (saved.awarded > 0) markCoinCounterTick(saved.awarded);

    try {
      const milestones = readAcademyMilestones();
      const alreadyCompleted = milestones.some(
        (node) => node.id === milestoneId && node.status === "completed",
      );
      const lessonNumber = lessonNumberForMilestoneId(milestoneId);
      let earnedMedals: EarnedSkillMedal[] = [];

      if (!alreadyCompleted) {
        const session = readGuestAccessSession();
        const cohort = session ? getSessionCurriculumCohort(session) : "explorer";
        earnedMedals =
          skillAwardTier && skillSlug
            ? applyPayloadSkillTierProgress(skillSlug, skillAwardTier, cohort)
            : applyLessonSkillTierProgress(milestoneId, cohort);
        const updated = completeAcademyMilestone(milestoneId, milestones);
        saveAcademyMilestones(updated);
      }

      recordLessonPractice();
      recordUsageEvent("lesson_completed", { lessonNumber });
      for (const medal of earnedMedals) {
        recordUsageEvent("medal_earned", {
          lessonNumber,
          metadata: { skill: medal.slug, tier: medal.tier },
        });
      }
    } catch {
      // A medal write must not hide coins that already saved.
    }

    const session = readGuestAccessSession();
    const pendingConsent = isExplorerPendingConsent(session);
    let cloudOk = true;
    if (session?.accessMode === "registered") {
      try {
        persistAccountProgressCacheFromLive({
          userId: session.supabaseUserId,
          username: session.username,
        });
        if (!pendingConsent) {
          const cloud = await persistRegisteredProgressNow();
          cloudOk = cloud.ok;
        }
      } catch {
        cloudOk = !pendingConsent;
      }
    }

    if (
      lessonCashInNeedsRetry({
        accessMode: session?.accessMode,
        pendingConsent,
        localOk: true,
        cloudOk,
      })
    ) {
      cashInStartedRef.current = false;
      return { ok: false };
    }

    setLessonComplete(true);
    return { ok: true, balance: saved.balance };
  }, [
    isDesignShell,
    skipProgressWrites,
    lessonComplete,
    milestoneId,
    perfectStreak,
    saveLessonCoinAward,
    skillAwardTier,
    skillSlug,
  ]);

  const handleContinueAfterCashIn = useCallback(() => {
    if (!cashInStartedRef.current || leavingAfterCashInRef.current) return;
    leavingAfterCashInRef.current = true;
    try {
      router.push(exitHref);
    } catch {
      leavingAfterCashInRef.current = false;
    }
    if (!skipProgressWrites) {
      window.setTimeout(() => {
        void persistRegisteredProgressNow();
      }, 0);
    }
  }, [exitHref, router, skipProgressWrites]);
  finishLessonRef.current = handleCashInPoints;

  const isLastScreen = screenIndex === totalScreens - 1;
  const canAdvanceDefault = Boolean(screenReady[screenIndex]);

  const lessonNumber = lessonNumberForMilestoneId(milestoneId);
  const moduleNumber = levelGroupForMilestoneId(milestoneId);
  const skillMedalTier = skillAwardTier ?? skillTierForLessonNumber(lessonNumber);
  const progressSkillSlug =
    skillAwardTier && skillSlug
      ? skillSlug
      : (resolveSkillSlugForMilestone(milestoneId) ?? skillSlug);

  return {
    screenIndex,
    setScreenIndex,
    pathStep,
    screenReady,
    screenMistakes,
    perfectStreak,
    bonusStreak: bonusRun.streak,
    bonusCoins: bonusRun.bonusCoins,
    bonusRuns: bonusRun.runs,
    lessonComplete,
    setBonusRunUnit,
    recordBonusRunCorrect,
    markScreenReady,
    clearScreenReady,
    incrementMistake,
    handleNext,
    handleCashInPoints,
    handleContinueAfterCashIn,
    isLastScreen,
    canAdvanceDefault,
    totalScreens,
    lessonNumber,
    moduleNumber,
    skillMedalTier,
    progressSkillSlug,
  };
}

export type LessonFlow = ReturnType<typeof useLessonFlow>;
