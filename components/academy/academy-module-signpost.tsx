"use client";

import {
  ACADEMY_MODULE_TITLES,
  getAcademyPhaseTheme,
  isModuleSignpostLocked,
  type AcademyLessonMilestoneNode,
  type AcademyLevelId,
} from "@/lib/dashboard/academy-state";
import { LockIcon } from "@/lib/dashboard/icons";
import type { MasteryCohort } from "@/lib/dashboard/mastery-cohort";
import { cn } from "@/lib/utils/cn";

export const ACADEMY_MODULE_SIGNPOST_HEIGHT_PX = 56;
/** Vertical space between every module header tile and its first lesson node. */
export const ACADEMY_MODULE_SIGNPOST_GAP_PX = 72;

/** First lesson milestone — used for START HERE placement. */
export const ACADEMY_JOURNEY_ENTRY_MILESTONE_ID = 1;

type AcademyModuleSignpostProps = {
  moduleNumber: AcademyLevelId;
  milestones: readonly AcademyLessonMilestoneNode[];
  masteryCohort: MasteryCohort;
  isActive?: boolean;
  launchable?: boolean;
  onLaunch?: () => void;
};

export function AcademyModuleSignpost({
  moduleNumber,
  milestones,
  masteryCohort,
  isActive = false,
  launchable = false,
  onLaunch,
}: AcademyModuleSignpostProps) {
  const phase = getAcademyPhaseTheme(moduleNumber);
  const title = ACADEMY_MODULE_TITLES[moduleNumber];
  const isLocked = isModuleSignpostLocked(
    moduleNumber,
    milestones,
    masteryCohort,
  );
  const useDarkSignpostInk = moduleNumber === 3 || moduleNumber === 6;

  const tileBody = (
    <div
      className={cn(
        "relative flex w-full max-w-[min(100%,22rem)] items-center justify-center rounded-2xl border-0 border-b-[4px] px-4 py-2.5 transition-all duration-75",
        isLocked && "opacity-90",
        isActive && launchable && "group-active:translate-y-[2px] group-active:border-b-[2px]",
      )}
      style={{
        backgroundColor: phase.fill,
        borderBottomColor: phase.shadow,
        boxShadow: isActive
          ? `0 4px 0 ${phase.shadow}`
          : `0 2px 0 ${phase.shadow}`,
      }}
    >
      <div className="relative flex min-w-0 items-center justify-center gap-1.5">
        {isLocked ? (
          <span
            className={cn(
              "shrink-0",
              useDarkSignpostInk ? "text-[#031F82]/80" : "text-white/90",
            )}
            aria-hidden
          >
            <LockIcon className="size-4" />
          </span>
        ) : null}
        <p
          className={cn(
            "min-w-0 truncate font-heading text-lg font-bold leading-snug",
            useDarkSignpostInk
              ? "text-[#031F82]"
              : "text-white drop-shadow-sm",
          )}
        >
          Module {moduleNumber}: {title}
        </p>
      </div>
    </div>
  );

  return (
    <div
      className="relative z-base flex w-full shrink-0 justify-center px-2"
      style={{ height: ACADEMY_MODULE_SIGNPOST_HEIGHT_PX }}
      role="region"
      aria-label={`Module ${moduleNumber}: ${title}`}
    >
      {launchable && onLaunch ? (
        <button
          type="button"
          onClick={onLaunch}
          className="group w-full max-w-[min(100%,22rem)] rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nga-secondary"
        >
          {tileBody}
        </button>
      ) : (
        tileBody
      )}
    </div>
  );
}
