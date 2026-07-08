"use client";

import { forwardRef, useMemo } from "react";
import {
  getAcademyPhaseTheme,
  resolveAcademyContextBanner,
  type AcademyLessonMilestoneNode,
} from "@/lib/dashboard/academy-state";

type AcademyContextBannerProps = {
  milestones?: readonly AcademyLessonMilestoneNode[];
  topOffset?: number;
};

export const AcademyContextBanner = forwardRef<
  HTMLDivElement,
  AcademyContextBannerProps
>(function AcademyContextBanner({ milestones = [], topOffset = 0 }, ref) {
  const context = useMemo(
    () => resolveAcademyContextBanner(milestones),
    [milestones],
  );

  const phase = useMemo(
    () => getAcademyPhaseTheme(context.moduleNumber),
    [context.moduleNumber],
  );

  return (
    <div
      ref={ref}
      className="pointer-events-none fixed inset-x-0 z-sticky md:left-64"
      style={{ top: topOffset }}
    >
      <div className="pointer-events-auto mx-auto w-full max-w-md bg-white px-5 pb-2 pt-1 sm:px-6">
        <div
          className="rounded-2xl border-0 px-4 py-3 shadow-md"
          style={{
            backgroundColor: phase.fill,
            boxShadow: `0 3px 0 ${phase.shadow}`,
          }}
          aria-label="Current Academy lesson"
        >
          <p className="text-center font-heading text-xs font-bold leading-snug text-white sm:text-sm">
            {context.label}
          </p>
        </div>
      </div>
    </div>
  );
});
