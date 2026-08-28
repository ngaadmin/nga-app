"use client";

import { useCallback, useEffect } from "react";
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
import { isDesignShellLesson, isLessonShippedForCohort } from "@/lib/academy/lessons/registry";
import { markFirstAcademyLessonOpened, FIRST_ACADEMY_LESSON_MILESTONE_ID } from "@/lib/dashboard/academy-first-lesson-opened";
import { DASHBOARD_ACADEMY_PATH } from "@/lib/onboarding/guest-session";
import { SearchParamsBoundary } from "@/components/ui/search-params-boundary";
import { cn } from "@/lib/utils/cn";

type AcademyLessonPlayerProps = {
  milestoneId: number;
};

export function AcademyLessonPlayer({ milestoneId }: AcademyLessonPlayerProps) {
  const cohort = useLessonMasteryCohort();
  const router = useRouter();
  const isDesignShell = isDesignShellLesson(milestoneId);
  const isAvailable =
    isDesignShell || isLessonShippedForCohort(milestoneId, cohort);

  useEffect(() => {
    if (!isAvailable) {
      router.replace(DASHBOARD_ACADEMY_PATH);
    }
  }, [isAvailable, router]);

  useEffect(() => {
    if (isAvailable && milestoneId === FIRST_ACADEMY_LESSON_MILESTONE_ID) {
      markFirstAcademyLessonOpened();
    }
  }, [isAvailable, milestoneId]);

  if (!isAvailable) {
    return null;
  }

  return (
    <SearchParamsBoundary>
      <AcademyLessonPlayerInner milestoneId={milestoneId} />
    </SearchParamsBoundary>
  );
}

function AcademyLessonPlayerInner({ milestoneId }: AcademyLessonPlayerProps) {
  const content = useLessonDefinition(milestoneId);
  const searchParams = useSearchParams();
  const { awardLessonXp } = useDashboardWallet();
  const isDesignShell = content.meta.isDesignShell === true;
  const initialScreenIndex = isDesignShell
    ? (resolveDesignShellJumperIndex(
        content.screens,
        searchParams.get("type"),
        searchParams.get("screen"),
      ) ?? 0)
    : 0;

  const flow = useLessonFlow({
    milestoneId,
    totalScreens: content.meta.totalScreens,
    skillSlug: content.rewards.skillSlug,
    xpReward: content.rewards.xpReward,
    perfectStreakBonus: content.rewards.perfectStreakBonus,
    isDesignShell,
    exitHref: isDesignShell ? "/dashboard/academy" : undefined,
    initialScreenIndex,
  });

  const awardBonusXp = useCallback(
    (amount: number) => {
      awardLessonXp(amount);
    },
    [awardLessonXp],
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
