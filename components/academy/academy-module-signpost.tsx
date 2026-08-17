"use client";

import { useState } from "react";
import { AcademyModulePreviewModal } from "@/components/academy/academy-module-preview-modal";
import {
  academyModuleDescriptionClass,
  academyModuleTitleClass,
} from "@/components/academy/academy-journey-styles";
import {
  ACADEMY_MODULE_DESCRIPTIONS,
  ACADEMY_MODULE_TITLES,
  getAcademyPhaseTheme,
  isModuleSignpostLocked,
  type AcademyLessonMilestoneNode,
  type AcademyLevelId,
} from "@/lib/dashboard/academy-state";
import { LockIcon } from "@/lib/dashboard/icons";
import type { MasteryCohort } from "@/lib/dashboard/mastery-cohort";
import { cn } from "@/lib/utils/cn";

/** Fixed vertical space reserved for module headers in journey map layout math. */
export const ACADEMY_MODULE_SIGNPOST_HEIGHT_PX = 120;
/** Vertical space between every module header and its first lesson node. */
export const ACADEMY_MODULE_SIGNPOST_GAP_PX = 72;

/** First lesson milestone - used for START HERE placement. */
export const ACADEMY_JOURNEY_ENTRY_MILESTONE_ID = 1;

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
  const [previewOpen, setPreviewOpen] = useState(false);
  const phase = getAcademyPhaseTheme(moduleNumber);
  const title = ACADEMY_MODULE_TITLES[moduleNumber];
  const subtitle = ACADEMY_MODULE_DESCRIPTIONS[moduleNumber];
  const isLocked = isModuleSignpostLocked(
    moduleNumber,
    milestones,
    masteryCohort,
  );
  const useDarkOnFill = moduleNumber === 3 || moduleNumber === 6;

  return (
    <>
      <div
        className="relative z-base flex w-full shrink-0 justify-center px-2"
        style={{ height: ACADEMY_MODULE_SIGNPOST_HEIGHT_PX }}
      >
        <button
          type="button"
          onClick={() => setPreviewOpen(true)}
          aria-label={`Module ${moduleNumber}: ${title}. ${subtitle}. Tap to preview what you will learn.`}
          aria-haspopup="dialog"
          className="group h-full w-full max-w-[20.5rem] rounded-[1.75rem] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nga-secondary"
        >
          <div
            className={cn(
              "relative flex h-full w-full flex-col items-center justify-center rounded-[1.75rem] px-5 py-3",
              "shadow-md transition-transform duration-75",
              "group-hover:-translate-y-0.5 group-active:translate-y-0",
              isLocked && "opacity-80",
            )}
            style={{
              backgroundColor: `color-mix(in srgb, ${phase.fill} 16%, white)`,
              boxShadow: `0 8px 20px ${phase.ring}`,
            }}
          >
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-heading text-[10px] font-extrabold uppercase tracking-wider",
                useDarkOnFill ? "text-[#031F82]" : "text-white",
              )}
              style={{ backgroundColor: phase.fill }}
            >
              {isLocked ? <LockIcon className="size-3" /> : null}
              Module {moduleNumber}
            </span>
            <p className={cn("mt-1.5 line-clamp-2", academyModuleTitleClass)}>
              {title}
            </p>
            <p className={cn("mt-1 line-clamp-2", academyModuleDescriptionClass)}>
              {subtitle}
            </p>
          </div>
        </button>
      </div>

      <AcademyModulePreviewModal
        moduleNumber={moduleNumber}
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
      />
    </>
  );
}
