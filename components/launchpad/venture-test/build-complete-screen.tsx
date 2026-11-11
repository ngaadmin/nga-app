"use client";

import { useEffect, useState } from "react";
import { LessonCompletionConfetti } from "@/components/academy/lesson/lesson-completion-confetti";
import { lessonMotionEnabled } from "@/lib/academy/lessons/coin-counter-flight";
import { FREDOKA_CLASS } from "@/components/launchpad/venture/identity/identity-fonts";
import { VentureRooftopArt } from "@/components/launchpad/venture-test/venture-rooftop-art";
import type { LaunchpadSurfaceCopy } from "@/lib/launchpad/content/surface-copy";

type BuildCompleteCopy = LaunchpadSurfaceCopy["buildComplete"];

function Sparkle() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true" className="flex-none">
      <path d="M12 1l2.6 8.4L23 12l-8.4 2.6L12 23l-2.6-8.4L1 12l8.4-2.6z" fill="#FFA503" />
    </svg>
  );
}

/**
 * Standalone business-build celebration (Option B). Not placed in the learner
 * flow. Callers pass the payload copy and the floor count. One call site can
 * show it after the rooftop finish, or instead of it, later.
 */
export function BuildCompleteScreen({
  copy,
  terraceLabel,
  levelCount,
  onWorkbook,
  onLaunchpad,
}: {
  copy: BuildCompleteCopy;
  terraceLabel: string;
  levelCount: number;
  onWorkbook: () => void;
  onLaunchpad: () => void;
}) {
  const [confetti, setConfetti] = useState(false);
  useEffect(() => {
    if (lessonMotionEnabled()) setConfetti(true);
  }, []);
  const dots = Math.max(0, Math.floor(levelCount));
  return (
    <section className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-white" data-build-complete="" aria-labelledby="lp-build-complete-title">
      {confetti ? <LessonCompletionConfetti /> : null}
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-6 pb-4 pt-6 text-center">
        <div className="mb-3.5 flex items-center justify-center gap-1.5">
          <Sparkle />
          <span className={`inline-flex flex-col items-center gap-0.5 text-[24px] font-semibold leading-[34px] tracking-[-0.4px] text-[#0CC1E0] ${FREDOKA_CLASS}`}>
            {copy.greeting}
            <svg width="180" height="8" viewBox="0 0 74 7" preserveAspectRatio="none" aria-hidden="true">
              <path d="M2 4.6C18 2 40 2.2 72 3.4" fill="none" stroke="#0CC1E0" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </span>
          <Sparkle />
        </div>
        <h1 id="lp-build-complete-title" className={`${FREDOKA_CLASS} text-[24px] font-semibold leading-[34px] tracking-[-0.4px] text-[#19347D]`}>
          {copy.headline}
        </h1>
        <p className="mt-2 font-sans text-[18px] font-normal leading-[26px] text-[#19347D]">{copy.businessLine}</p>
        <p className="mt-2 font-sans text-[18px] font-normal leading-[26px] text-[#19347D]">{copy.summary}</p>
        <div className="mt-3.5 flex items-center justify-center gap-2" aria-hidden="true" data-level-dots={dots}>
          {Array.from({ length: dots }, (_, index) => (
            <span key={index} className="size-2.5 rounded-full border-2 border-[#19347D] bg-[#19347D]" />
          ))}
        </div>
        <svg role="img" aria-label={terraceLabel} width="342" height="110" viewBox="40 -48 310 100" className="mt-7 block">
          <VentureRooftopArt />
        </svg>
      </div>
      <div className="flex shrink-0 flex-col gap-3 px-6 pb-6">
        <button
          type="button"
          onClick={onWorkbook}
          className="flex h-11 w-full items-center justify-center rounded-full bg-[#19347D] font-sans text-[16px] font-semibold leading-[1.4] text-white"
        >
          {copy.workbook}
        </button>
        <button
          type="button"
          onClick={onLaunchpad}
          className="flex h-11 w-full items-center justify-center rounded-full bg-white font-sans text-[16px] font-semibold leading-[1.4] text-[#19347D] shadow-[inset_0_0_0_2px_#BDE9FB]"
        >
          {copy.back}
        </button>
      </div>
    </section>
  );
}
