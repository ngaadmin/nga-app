"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { LessonCashProvider } from "@/components/academy/lesson/lesson-cash";
import { LessonRunner } from "@/components/academy/lesson/lesson-runner";
import { useDashboardWallet } from "@/lib/dashboard/dashboard-wallet-context";
import { useLessonFlow } from "@/lib/academy/lessons/hooks/use-lesson-flow";
import { useLessonMasteryCohort } from "@/lib/academy/lessons/hooks/use-lesson-cohort";
import {
  payloadCompletionMedalTier,
  resolvePayloadLesson,
} from "@/lib/academy/lessons/payload/map-payload-lesson";
import type { LessonPayload } from "@/lib/academy/lessons/payload/types";

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
export function PayloadLessonPlayer({
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
  });

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div className="layer-island relative flex min-h-0 flex-1 flex-col">
        <LessonCashProvider>
          <LessonRunner
            content={content}
            flow={flow}
            awardBonusXp={isPreview ? undefined : awardLessonXp}
          />
        </LessonCashProvider>
      </div>
    </div>
  );
}
