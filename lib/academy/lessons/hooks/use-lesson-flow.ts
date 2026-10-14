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
  type SkillTrophyTier,
} from "@/lib/dashboard/skill-trophies";
import {
  lessonNumberForMilestoneId,
  levelGroupForMilestoneId,
} from "@/lib/dashboard/academy-state";
import { getMasteryCohortFromBirthYear } from "@/lib/dashboard/mastery-cohort";
import { persistRegisteredProgressNow } from "@/lib/dashboard/account-progress-sync";
import {
  LESSON_COMPLETION_XP,
  LESSON_PERFECT_STREAK_BONUS,
} from "@/lib/academy/lessons/completion-xp";
import { readGuestAccessSession } from "@/lib/onboarding/guest-session";

export type ScreenFlash = "none" | "error" | "success";

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
  | { type: "increment-mistake" }
  | { type: "flash"; kind: ScreenFlash };

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
  const { awardLessonXp } = useDashboardWallet();

  const [screenIndex, setScreenIndexState] = useState(initialScreenIndex);
  const [pathStep, setPathStep] = useState(0);
  const screenIndexRef = useRef(initialScreenIndex);
  const [screenReady, setScreenReady] = useState<boolean[]>(
    () => Array.from({ length: totalScreens }, () => false),
  );
  const [screenFlash, setScreenFlash] = useState<ScreenFlash>("none");
  const [screenMistakes, setScreenMistakes] = useState(0);
  const [lessonComplete, setLessonComplete] = useState(false);

  const perfectStreak = screenMistakes === 0;

  const flashTimeoutRef = useRef<number | null>(null);
  const pendingActionsRef = useRef<PendingFlowAction[]>([]);
  const flushTimeoutRef = useRef<number | null>(null);
  const activeMilestoneRef = useRef(milestoneId);

  /** New lesson session — restore full lives (max 4 via LESSON_MAX_LIVES). */
  useEffect(() => {
    if (activeMilestoneRef.current === milestoneId) return;
    activeMilestoneRef.current = milestoneId;
    screenIndexRef.current = 0;
    setScreenIndexState(0);
    setPathStep(0);
    setScreenReady(Array.from({ length: totalScreens }, () => false));
    setScreenFlash("none");
    setScreenMistakes(0);
    setLessonComplete(false);
    pendingActionsRef.current = [];
  }, [milestoneId, totalScreens]);

  const applyFlash = useCallback((kind: ScreenFlash) => {
    if (flashTimeoutRef.current !== null) {
      window.clearTimeout(flashTimeoutRef.current);
      flashTimeoutRef.current = null;
    }

    setScreenFlash(kind);
    if (kind !== "none") {
      flashTimeoutRef.current = window.setTimeout(() => {
        setScreenFlash("none");
        flashTimeoutRef.current = null;
      }, 450);
    }
  }, []);

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
        case "flash":
          applyFlash(action.kind);
          break;
      }
    }
  }, [applyFlash]);

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

  const incrementMistake = useCallback(() => {
    enqueueFlowAction({ type: "increment-mistake" });
  }, [enqueueFlowAction]);

  const flashScreen = useCallback(
    (kind: ScreenFlash) => {
      enqueueFlowAction({ type: "flash", kind });
    },
    [enqueueFlowAction],
  );

  useEffect(
    () => () => {
      if (flashTimeoutRef.current !== null) {
        window.clearTimeout(flashTimeoutRef.current);
      }
      if (flushTimeoutRef.current !== null) {
        window.clearTimeout(flushTimeoutRef.current);
      }
    },
    [],
  );

  const finishLessonRef = useRef<() => void>(() => {});

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

  const handleCashInPoints = useCallback(() => {
    if (lessonComplete) return;
    setLessonComplete(true);

    if (!isDesignShell && !skipProgressWrites) {
      awardLessonXp(LESSON_COMPLETION_XP);
      if (perfectStreak) {
        awardLessonXp(LESSON_PERFECT_STREAK_BONUS);
      }

      const milestones = readAcademyMilestones();
      const alreadyCompleted = milestones.some(
        (node) => node.id === milestoneId && node.status === "completed",
      );

      if (!alreadyCompleted) {
        const session = readGuestAccessSession();
        const cohort = session?.birthYear
          ? getMasteryCohortFromBirthYear(session.birthYear)
          : "explorer";
        if (skillAwardTier && skillSlug) {
          applyPayloadSkillTierProgress(skillSlug, skillAwardTier, cohort);
        } else {
          applyLessonSkillTierProgress(milestoneId, cohort);
        }
        const updated = completeAcademyMilestone(milestoneId, milestones);
        saveAcademyMilestones(updated);
      }
    }

    if (skipProgressWrites) {
      router.push(exitHref);
      return;
    }

    void persistRegisteredProgressNow().finally(() => {
      router.push(exitHref);
    });
  }, [
    awardLessonXp,
    exitHref,
    isDesignShell,
    skipProgressWrites,
    lessonComplete,
    milestoneId,
    perfectStreak,
    router,
    skillAwardTier,
    skillSlug,
  ]);
  finishLessonRef.current = handleCashInPoints;

  const flashBorderClass =
    screenFlash === "error"
      ? "ring-4 ring-[#E11D48]/70"
      : screenFlash === "success"
        ? "ring-4 ring-[#22C55E]/70"
        : "";

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
    screenFlash,
    screenMistakes,
    perfectStreak,
    lessonComplete,
    markScreenReady,
    clearScreenReady,
    incrementMistake,
    flashScreen,
    handleNext,
    handleCashInPoints,
    flashBorderClass,
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
