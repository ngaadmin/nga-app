"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  completeAcademyMilestone,
  readAcademyMilestones,
  saveAcademyMilestones,
} from "@/lib/dashboard/academy-progress-storage";
import { useDashboardWallet } from "@/lib/dashboard/dashboard-wallet-context";
import { setVaultSkillTierOverride } from "@/lib/dashboard/vault-skill-progress-storage";

export type ScreenFlash = "none" | "error" | "success";

export type UseLessonFlowOptions = {
  milestoneId: number;
  totalScreens: number;
  skillSlug: string;
  xpReward: number;
  perfectStreakBonus: number;
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
    awardLessonXp(xpReward);
    if (perfectStreak && perfectStreakBonus > 0) {
      awardLessonXp(perfectStreakBonus);
    }

    const milestones = readAcademyMilestones();
    const alreadyCompleted = milestones.some(
      (node) => node.id === milestoneId && node.status === "completed",
    );

    if (!alreadyCompleted) {
      setVaultSkillTierOverride(skillSlug, "bronze");
      const updated = completeAcademyMilestone(milestoneId, milestones);
      saveAcademyMilestones(updated);
    }

    router.push(exitHref);
  }, [
    awardLessonXp,
    exitHref,
    lessonComplete,
    milestoneId,
    perfectStreak,
    perfectStreakBonus,
    router,
    skillSlug,
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
  };
}

export type LessonFlow = ReturnType<typeof useLessonFlow>;
