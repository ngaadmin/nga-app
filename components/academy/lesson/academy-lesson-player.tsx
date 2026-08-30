"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  DesignShellJumpSync,
  resolveDesignShellJumperIndex,
} from "@/components/academy/lesson/dev/design-shell-screen-jumper";
import { LessonRunner } from "@/components/academy/lesson/lesson-runner";
import { useDashboardWallet } from "@/lib/dashboard/dashboard-wallet-context";
import { useLessonFlow } from "@/lib/academy/lessons/hooks/use-lesson-flow";
import { useLessonDefinition } from "@/lib/academy/lessons/hooks/use-lesson-definition";
import { useLessonMasteryCohort } from "@/lib/academy/lessons/hooks/use-lesson-cohort";
import {
  canLaunchAcademyLesson,
  hasShippedLesson,
  isDesignShellLesson,
  isLessonShippedForCohort,
} from "@/lib/academy/lessons/registry";
import { readAcademyMilestones } from "@/lib/dashboard/academy-progress-storage";
import { markFirstAcademyLessonOpened, FIRST_ACADEMY_LESSON_MILESTONE_ID } from "@/lib/dashboard/academy-first-lesson-opened";
import { isDevAcademyLessonPreview } from "@/lib/dev/academy-dev-tools";
import { DASHBOARD_ACADEMY_PATH } from "@/lib/onboarding/guest-session";
import { SearchParamsBoundary } from "@/components/ui/search-params-boundary";
import { cn } from "@/lib/utils/cn";

type AcademyLessonPlayerProps = {
  milestoneId: number;
};

export function AcademyLessonPlayer({ milestoneId }: AcademyLessonPlayerProps) {
  return (
    <SearchParamsBoundary>
      <AcademyLessonPlayerGate milestoneId={milestoneId} />
    </SearchParamsBoundary>
  );
}

function AcademyLessonPlayerGate({ milestoneId }: AcademyLessonPlayerProps) {
  const cohort = useLessonMasteryCohort();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDesignShell = isDesignShellLesson(milestoneId);
  const isPreview = isDevAcademyLessonPreview(searchParams);
  const [progressChecked, setProgressChecked] = useState(
    isDesignShell || isPreview,
  );
  const [progressLocked, setProgressLocked] = useState(false);
  const isAvailable =
    progressChecked &&
    !progressLocked &&
    (isDesignShell ||
      isPreview ||
      isLessonShippedForCohort(milestoneId, cohort));

  useEffect(() => {
    if (isDesignShell || isPreview) {
      setProgressLocked(isPreview ? !hasShippedLesson(milestoneId) : false);
      setProgressChecked(true);
      return;
    }
    const node = readAcademyMilestones().find(
      (entry) => entry.id === milestoneId,
    );
    const allowed =
      node != null &&
      canLaunchAcademyLesson(milestoneId, node.status, cohort);
    setProgressLocked(!allowed);
    setProgressChecked(true);
  }, [cohort, isDesignShell, isPreview, milestoneId]);

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

  if (!isAvailable) {
    return null;
  }

  return (
    <AcademyLessonPlayerInner
      milestoneId={milestoneId}
      isPreview={isPreview}
    />
  );
}

function AcademyLessonPlayerInner({
  milestoneId,
  isPreview = false,
}: AcademyLessonPlayerProps & { isPreview?: boolean }) {
  const content = useLessonDefinition(
    milestoneId,
    isPreview ? "explorer" : undefined,
  );
  const searchParams = useSearchParams();
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
    xpReward: content.rewards.xpReward,
    perfectStreakBonus: content.rewards.perfectStreakBonus,
    isDesignShell,
    skipProgressWrites: isPreview,
    exitHref: isDesignShell ? "/dashboard/academy" : undefined,
    initialScreenIndex,
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
