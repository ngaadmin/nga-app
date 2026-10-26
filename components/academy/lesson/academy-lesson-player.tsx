"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  DesignShellJumpSync,
  resolveDesignShellJumperIndex,
} from "@/components/academy/lesson/dev/design-shell-screen-jumper";
import { LessonRunner } from "@/components/academy/lesson/lesson-runner";
import { PayloadLessonPlayer } from "@/components/academy/lesson/payload-lesson-player";
import { useIntroRestoreGate } from "@/components/dashboard/hub-intro/use-intro-restore-gate";
import { useDashboardWallet } from "@/lib/dashboard/dashboard-wallet-context";
import { selectLessonPayload } from "@/lib/academy/lessons/payload/explorer-m1/select-payload";
import type { LessonPayload } from "@/lib/academy/lessons/payload/types";
import { useLessonFlow } from "@/lib/academy/lessons/hooks/use-lesson-flow";
import { useLessonDefinition } from "@/lib/academy/lessons/hooks/use-lesson-definition";
import { useLessonMasteryCohort } from "@/lib/academy/lessons/hooks/use-lesson-cohort";
import {
  canLaunchAcademyLesson,
  hasShippedLesson,
  isDesignShellLesson,
} from "@/lib/academy/lessons/registry";
import { readAcademyMilestones } from "@/lib/dashboard/academy-progress-storage";
import { lessonNumberForMilestoneId } from "@/lib/dashboard/academy-state";
import { markFirstAcademyLessonOpened, FIRST_ACADEMY_LESSON_MILESTONE_ID } from "@/lib/dashboard/academy-first-lesson-opened";
import { bindLessonAbandon } from "@/lib/usage/lesson-abandon";
import { recordUsageEvent } from "@/lib/usage/record-usage-event";
import {
  allowsDirectLessonOpen,
  isAcademyLessonPreview,
} from "@/lib/dev/academy-dev-tools";
import { DASHBOARD_ACADEMY_PATH } from "@/lib/onboarding/guest-session";
import { SearchParamsBoundary } from "@/components/ui/search-params-boundary";
import { playStoryClipFromGesture } from "@/lib/academy/lessons/story-audio/playback";
import { cn } from "@/lib/utils/cn";

type AcademyLessonPlayerProps = {
  milestoneId: number;
  /** When set, this lesson renders from the payload instead of a hard-coded file. */
  payload?: LessonPayload;
  /** Explorer Module 1. Other cohorts keep `payload` unless `maverickPayload` is set. */
  explorerPayload?: LessonPayload;
  /** Maverick Module 1 from the master workbook. */
  maverickPayload?: LessonPayload;
};

export function AcademyLessonPlayer({
  milestoneId,
  payload,
  explorerPayload,
  maverickPayload,
}: AcademyLessonPlayerProps) {
  return (
    <SearchParamsBoundary>
      <AcademyLessonPlayerGate
        milestoneId={milestoneId}
        payload={payload}
        explorerPayload={explorerPayload}
        maverickPayload={maverickPayload}
      />
    </SearchParamsBoundary>
  );
}

function AcademyLessonPlayerGate({
  milestoneId,
  payload,
  explorerPayload,
  maverickPayload,
}: AcademyLessonPlayerProps) {
  const cohort = useLessonMasteryCohort();
  const { ready: progressReady } = useIntroRestoreGate();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDesignShell = isDesignShellLesson(milestoneId);
  const isPreview = isAcademyLessonPreview(searchParams);
  const directOpen = allowsDirectLessonOpen({ preview: isPreview });
  const [progressChecked, setProgressChecked] = useState(
    isDesignShell || directOpen,
  );
  const [progressLocked, setProgressLocked] = useState(false);
  const isAvailable =
    progressChecked &&
    !progressLocked &&
    (isDesignShell || directOpen || hasShippedLesson(milestoneId));

  useEffect(() => {
    if (!progressReady && !isDesignShell && !directOpen) return;
    if (isDesignShell || directOpen) {
      setProgressLocked(false);
      setProgressChecked(true);
      return;
    }
    const node = readAcademyMilestones().find(
      (entry) => entry.id === milestoneId,
    );
    // Preview and development deploys may open a locked Explorer lesson.
    // Production still requires the previous lesson to be finished.
    const allowed =
      node != null &&
      canLaunchAcademyLesson(milestoneId, node.status, cohort);
    setProgressLocked(!allowed);
    setProgressChecked(true);
  }, [cohort, directOpen, isDesignShell, milestoneId, progressReady]);

  useEffect(() => {
    if (!progressChecked) return;
    if (!isAvailable) {
      router.replace(DASHBOARD_ACADEMY_PATH);
    }
  }, [isAvailable, progressChecked, router]);

  useEffect(() => {
    if (
      isAvailable &&
      !isPreview &&
      milestoneId === FIRST_ACADEMY_LESSON_MILESTONE_ID
    ) {
      markFirstAcademyLessonOpened();
    }
  }, [isAvailable, isPreview, milestoneId]);

  useEffect(() => {
    if (!isAvailable || isPreview || isDesignShell) return;
    const lessonNumber = lessonNumberForMilestoneId(milestoneId);
    recordUsageEvent("lesson_started", { lessonNumber });
    return bindLessonAbandon(lessonNumber);
  }, [isAvailable, isDesignShell, isPreview, milestoneId]);

  if (!isAvailable) {
    return null;
  }

  return (
    <AcademyLessonPlayerInner
      milestoneId={milestoneId}
      isPreview={isPreview}
      payload={selectLessonPayload(cohort, payload, explorerPayload, maverickPayload)}
    />
  );
}

function AcademyLessonPlayerInner({
  milestoneId,
  isPreview = false,
  payload,
}: AcademyLessonPlayerProps & { isPreview?: boolean }) {
  if (payload) {
    return (
      <PayloadLessonPlayer
        payload={payload}
        milestoneId={milestoneId}
        isPreview={isPreview}
      />
    );
  }

  return (
    <RegistryLessonPlayer milestoneId={milestoneId} isPreview={isPreview} />
  );
}

function RegistryLessonPlayer({
  milestoneId,
  isPreview = false,
}: {
  milestoneId: number;
  isPreview?: boolean;
}) {
  const searchParams = useSearchParams();
  const content = useLessonDefinition(milestoneId);
  const { awardLessonXp } = useDashboardWallet();
  const isDesignShell = content.meta.isDesignShell === true;
  const previewScreenRaw = Number.parseInt(
    searchParams.get("screen") ?? "",
    10,
  );
  const initialScreenIndex = isDesignShell
    ? (resolveDesignShellJumperIndex(
        content.screens,
        searchParams.get("type"),
        searchParams.get("screen"),
      ) ?? 0)
    : isPreview && Number.isFinite(previewScreenRaw)
      ? Math.min(
          content.meta.totalScreens - 1,
          Math.max(0, previewScreenRaw),
        )
      : 0;

  const flow = useLessonFlow({
    milestoneId,
    totalScreens: content.meta.totalScreens,
    skillSlug: content.rewards.skillSlug,
    isDesignShell,
    skipProgressWrites: isPreview,
    exitHref: isDesignShell ? "/dashboard/academy" : undefined,
    initialScreenIndex,
    onWillShowScreen: (index) => {
      const screen = content.screens[index];
      if (screen?.type === "narrative-bonus" && screen.audio?.src) {
        playStoryClipFromGesture(screen.audio.src);
      }
    },
  });

  const awardBonusXp = useCallback(
    (amount: number) => {
      if (isPreview) return;
      awardLessonXp(amount);
    },
    [awardLessonXp, isPreview],
  );

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      {isDesignShell ? (
        <SearchParamsBoundary>
          <DesignShellJumpSync
            screens={content.screens}
            currentIndex={flow.screenIndex}
            onJump={flow.setScreenIndex}
          />
        </SearchParamsBoundary>
      ) : null}
      <div
        className={cn(
          "layer-island relative flex min-h-0 flex-1 flex-col",
          isDesignShell && "mx-auto w-full max-w-md",
        )}
      >
        <LessonRunner
          content={content}
          flow={flow}
          awardBonusXp={awardBonusXp}
        />
      </div>
    </div>
  );
}
