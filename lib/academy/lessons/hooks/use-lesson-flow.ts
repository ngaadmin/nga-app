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
  resolveSkillSlugForMilestone,
  skillTierForLessonNumber,
} from "@/lib/dashboard/skill-trophies";
import { lessonNumberForMilestoneId } from "@/lib/dashboard/academy-state";
import { getMasteryCohortFromBirthYear } from "@/lib/dashboard/mastery-cohort";
import { readGuestAccessSession } from "@/lib/onboarding/guest-session";

export type ScreenFlash = "none" | "error" | "success";

export type UseLessonFlowOptions = {
  milestoneId: number;
  totalScreens: number;
  skillSlug: string;
  xpReward: number;
  perfectStreakBonus: number;
  /** Dev-only design shell — skip XP and milestone writes on Cash In. */
  isDesignShell?: boolean;
  /** Defaults to /dashboard/academy */
  exitHref?: string;
};

type PendingFlowAction =
  | { type: "mark-ready"; index: number }
  | { type: "increment-mistake" }
  | { type: "flash"; kind: ScreenFlash };

export function useLessonFlow({
  milestoneId,
  totalScreens,
  skillSlug,
  xpReward,
  perfectStreakBonus,
  isDesignShell = false,
  exitHref = "/dashboard/academy",
}: UseLessonFlowOptions) {
  const router = useRouter();
  const { awardLessonXp } = useDashboardWallet();

  const [screenIndex, setScreenIndex] = useState(0);
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
    setScreenIndex(0);
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

  const handleNext = useCallback(
    (options?: { canAdvance?: boolean }) => {
      const canAdvance = options?.canAdvance ?? Boolean(screenReady[screenIndex]);
      if (!canAdvance) return;
      setScreenIndex((current) => Math.min(totalScreens - 1, current + 1));
    },
    [screenIndex, screenReady, totalScreens],
  );

  const handleCashInPoints = useCallback(() => {
    if (lessonComplete) return;
    setLessonComplete(true);

    if (!isDesignShell) {
      awardLessonXp(xpReward);
      if (perfectStreak && perfectStreakBonus > 0) {
        awardLessonXp(perfectStreakBonus);
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
        applyLessonSkillTierProgress(milestoneId, cohort);
        const updated = completeAcademyMilestone(milestoneId, milestones);
        saveAcademyMilestones(updated);
      }
    }

    router.push(exitHref);
  }, [
    awardLessonXp,
    exitHref,
    isDesignShell,
    lessonComplete,
    milestoneId,
    perfectStreak,
    perfectStreakBonus,
    router,
    xpReward,
  ]);

  const flashBorderClass =
    screenFlash === "error"
      ? "ring-4 ring-[#E11D48]/70"
      : screenFlash === "success"
        ? "ring-4 ring-[#22C55E]/70"
        : "";

  const isLastScreen = screenIndex === totalScreens - 1;
  const canAdvanceDefault =
    Boolean(screenReady[screenIndex]) && !isLastScreen;

  const lessonNumber = lessonNumberForMilestoneId(milestoneId);
  const skillMedalTier = skillTierForLessonNumber(lessonNumber);
  const progressSkillSlug =
    resolveSkillSlugForMilestone(milestoneId) ?? skillSlug;

  return {
    screenIndex,
    setScreenIndex,
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
    skillMedalTier,
    progressSkillSlug,
  };
}

export type LessonFlow = ReturnType<typeof useLessonFlow>;
