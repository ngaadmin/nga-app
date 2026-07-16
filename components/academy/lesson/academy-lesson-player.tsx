"use client";

import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LessonRunner } from "@/components/academy/lesson/lesson-runner";
import { useDashboardWallet } from "@/lib/dashboard/dashboard-wallet-context";
import { useLessonFlow } from "@/lib/academy/lessons/hooks/use-lesson-flow";
import { useLessonDefinition } from "@/lib/academy/lessons/hooks/use-lesson-definition";
import { useM1L2LessonExtensions } from "@/lib/academy/lessons/hooks/use-m1-l2-lesson-extensions";
import { useLessonMasteryCohort } from "@/lib/academy/lessons/hooks/use-lesson-cohort";
import { isLessonShippedForCohort } from "@/lib/academy/lessons/registry";
import { DASHBOARD_ACADEMY_PATH } from "@/lib/onboarding/ghost-session";

type AcademyLessonPlayerProps = {
  milestoneId: number;
};

export function AcademyLessonPlayer({ milestoneId }: AcademyLessonPlayerProps) {
  const cohort = useLessonMasteryCohort();
  const router = useRouter();
  const isAvailable = isLessonShippedForCohort(milestoneId, cohort);

  useEffect(() => {
    if (!isAvailable) {
      router.replace(DASHBOARD_ACADEMY_PATH);
    }
  }, [isAvailable, router]);

  if (!isAvailable) {
    return null;
  }

  return <AcademyLessonPlayerInner milestoneId={milestoneId} />;
}

function AcademyLessonPlayerInner({ milestoneId }: AcademyLessonPlayerProps) {
  const content = useLessonDefinition(milestoneId);
  const { awardLessonXp } = useDashboardWallet();

  const flow = useLessonFlow({
    milestoneId,
    totalScreens: content.meta.totalScreens,
    skillSlug: content.rewards.skillSlug,
    xpReward: content.rewards.xpReward,
    perfectStreakBonus: content.rewards.perfectStreakBonus,
  });

  const awardBonusXp = useCallback(
    (amount: number) => {
      awardLessonXp(amount);
    },
    [awardLessonXp],
  );

  const extensions = useM1L2LessonExtensions(content, flow);

  return (
    <div
      className="layer-island relative flex min-h-0 flex-1 flex-col"
      onClick={() => {
        if (extensions.persistentError) {
          extensions.dismissPersistentError?.();
        }
      }}
    >
      {extensions.persistentError ? (
        <div
          className="pointer-events-none fixed inset-x-0 bottom-20 z-sticky mx-auto max-w-md px-4"
          role="alert"
        >
          <div className="rounded-xl border border-[#E11D48]/30 bg-[#FFF7ED] px-4 py-3 shadow-lg">
            <p className="font-sans text-sm text-[#031F82]">
              {extensions.persistentError}
            </p>
            <p className="mt-2 font-heading text-[10px] font-bold uppercase tracking-wide text-[#1E3A5F]/60">
              Tap anywhere to dismiss
            </p>
          </div>
        </div>
      ) : null}

      <LessonRunner
        content={content}
        flow={flow}
        awardBonusXp={awardBonusXp}
        canAdvance={extensions.canAdvance}
        onNext={extensions.onNext}
        onPersistentError={extensions.onPersistentError}
        onDismissPersistentError={extensions.dismissPersistentError}
        renderCustomScreen={extensions.renderCustomScreen}
      />
    </div>
  );
}
