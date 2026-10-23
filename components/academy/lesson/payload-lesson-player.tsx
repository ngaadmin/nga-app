"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { LessonCashProvider } from "@/components/academy/lesson/lesson-cash";
import { LessonHubProgressProvider } from "@/components/academy/lesson/lesson-hub-progress";
import { LessonRunner } from "@/components/academy/lesson/lesson-runner";
import { useDashboardWallet } from "@/lib/dashboard/dashboard-wallet-context";
import { useLessonFlow } from "@/lib/academy/lessons/hooks/use-lesson-flow";
import { useLessonMasteryCohort } from "@/lib/academy/lessons/hooks/use-lesson-cohort";
import {
  hasSyncedUserSession,
  useUserSession,
} from "@/lib/dashboard/use-user-session";
import {
  fallbackNextIndex,
  lessonNeedsPathProgress,
  shortestCompletionLength,
} from "@/lib/academy/lessons/payload/lesson-graph";
import {
  payloadCompletionMedalTier,
  resolvePayloadLesson,
} from "@/lib/academy/lessons/payload/map-payload-lesson";
import type { LessonPayload } from "@/lib/academy/lessons/payload/types";
import { playStoryClipFromGesture } from "@/lib/academy/lessons/story-audio/playback";

type PayloadLessonPlayerProps = {
  payload: LessonPayload;
  milestoneId: number;
  isPreview?: boolean;
};

/**
 * One player for payload-driven lessons. Each screen row picks the existing
 * game template and receives that row's copy, settings, image, and error.
 * Cash In still awards the standard lesson XP and perfect-streak bonus.
 */
export function PayloadLessonPlayer(props: PayloadLessonPlayerProps) {
  useUserSession();
  const [cohortReady, setCohortReady] = useState(() => hasSyncedUserSession());

  useEffect(() => {
    setCohortReady(true);
  }, []);

  if (!cohortReady) return null;
  return <PayloadLessonPlayerReady {...props} />;
}

function PayloadLessonPlayerReady({
  payload,
  milestoneId,
  isPreview = false,
}: PayloadLessonPlayerProps) {
  const searchParams = useSearchParams();
  const cohort = useLessonMasteryCohort();
  const { awardLessonXp } = useDashboardWallet();
  const content = useMemo(
    () => resolvePayloadLesson(payload, cohort, milestoneId),
    [cohort, milestoneId, payload],
  );
  const labels = useMemo(
    () => content.screens.map((screen) => screen.sourceLabel ?? screen.id),
    [content.screens],
  );
  const trackPathProgress = lessonNeedsPathProgress(labels, content.screens);
  const pathTotal = trackPathProgress
    ? shortestCompletionLength(content.screens, labels)
    : undefined;
  const continueIndexByScreen = useMemo(
    () =>
      content.screens.map((screen, index) =>
        fallbackNextIndex(screen, index, labels),
      ),
    [content.screens, labels],
  );
  const previewScreenRaw = Number.parseInt(searchParams.get("screen") ?? "", 10);
  const initialScreenIndex =
    isPreview && Number.isFinite(previewScreenRaw)
      ? Math.min(content.meta.totalScreens - 1, Math.max(0, previewScreenRaw))
      : 0;

  const flow = useLessonFlow({
    milestoneId,
    totalScreens: content.meta.totalScreens,
    skillSlug: content.rewards.skillSlug,
    skillAwardTier: payloadCompletionMedalTier(content),
    skipProgressWrites: isPreview,
    initialScreenIndex,
    continueIndexByScreen,
    trackPathProgress,
    onWillShowScreen: (index) => {
      const screen = content.screens[index];
      if (screen?.type === "narrative-bonus" && screen.audio?.src) {
        playStoryClipFromGesture(screen.audio.src);
      }
    },
  });
  const [completedSkills, setCompletedSkills] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const previousIndexRef = useRef(flow.screenIndex);

  useEffect(() => {
    const from = previousIndexRef.current;
    const to = flow.screenIndex;
    previousIndexRef.current = to;
    if (from === to) return;
    const left = content.screens[from];
    const entered = content.screens[to];
    if (!left?.hubSkillKey || !entered?.skillHub) return;
    const skillKey = left.hubSkillKey;
    setCompletedSkills((current) => {
      if (current.has(skillKey)) return current;
      const next = new Set(current);
      next.add(skillKey);
      return next;
    });
  }, [content.screens, flow.screenIndex]);

  const activeScreen = content.screens[flow.screenIndex];

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div className="layer-island relative flex min-h-0 flex-1 flex-col">
        <LessonCashProvider>
          <LessonHubProgressProvider completed={completedSkills}>
            <LessonRunner
              content={content}
              flow={flow}
              awardBonusXp={isPreview ? undefined : awardLessonXp}
              progressIndex={trackPathProgress ? flow.pathStep : undefined}
              progressTotal={pathTotal}
              progressComplete={activeScreen?.type === "completion"}
            />
          </LessonHubProgressProvider>
        </LessonCashProvider>
      </div>
    </div>
  );
}
