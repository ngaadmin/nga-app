"use client";

import {
  ACADEMY_MODULE_DESCRIPTIONS,
  ACADEMY_MODULE_TITLES,
  getAcademyPhaseTheme,
  isModuleSignpostLocked,
  LESSONS_PER_LEVEL,
  type AcademyLessonMilestoneNode,
  type AcademyLevelId,
} from "@/lib/dashboard/academy-state";
import {
  academyJourneyMetaClass,
  academyModuleDescriptionClass,
  academyModuleTitleClass,
} from "@/components/academy/academy-journey-styles";
import { LockIcon } from "@/lib/dashboard/icons";
import type { MasteryCohort } from "@/lib/dashboard/mastery-cohort";
import { cn } from "@/lib/utils/cn";

export const ACADEMY_MODULE_SIGNPOST_HEIGHT_PX = 118;
export const ACADEMY_MODULE_SIGNPOST_GAP_PX = 20;

type AcademyModuleSignpostProps = {
  moduleNumber: AcademyLevelId;
  milestones: readonly AcademyLessonMilestoneNode[];
  masteryCohort: MasteryCohort;
};

export function AcademyModuleSignpost({
  moduleNumber,
  milestones,
  masteryCohort,
}: AcademyModuleSignpostProps) {
  const phase = getAcademyPhaseTheme(moduleNumber);
  const title = ACADEMY_MODULE_TITLES[moduleNumber];
  const description = ACADEMY_MODULE_DESCRIPTIONS[moduleNumber];
  const isLocked = isModuleSignpostLocked(
    moduleNumber,
    milestones,
    masteryCohort,
  );

  return (
    <div
      className="relative z-raised flex w-full shrink-0 justify-center px-2"
      style={{ height: ACADEMY_MODULE_SIGNPOST_HEIGHT_PX }}
      role="region"
      aria-label={`Module ${moduleNumber}: ${title}`}
    >
      <div
        className={cn(
          "flex w-full max-w-[min(100%,22rem)] flex-col justify-center rounded-2xl border px-4 py-3",
          "bg-white/70 backdrop-blur-md",
          isLocked && "opacity-95",
        )}
        style={{
          borderColor: phase.fill,
          boxShadow: `0 2px 0 ${phase.shadow}, 0 4px 20px ${phase.ring}`,
        }}
      >
        <div className="flex items-center justify-center gap-1.5">
          {isLocked ? (
            <span style={{ color: phase.fill }} aria-hidden>
              <LockIcon className="size-4 shrink-0" />
            </span>
          ) : null}
          <p
            className={academyModuleTitleClass}
            style={{ textShadow: `0 0 12px ${phase.ring}` }}
          >
            Module {moduleNumber}: {title}
          </p>
        </div>
        <p className={cn("mt-1", academyModuleDescriptionClass)}>
          {description}
        </p>
        <p
          className={cn("mt-1 text-center", academyJourneyMetaClass)}
          style={{ color: phase.shadow }}
        >
          {LESSONS_PER_LEVEL} Lessons
        </p>
      </div>
    </div>
  );
}
