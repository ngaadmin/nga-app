"use client";

import { useState } from "react";
import { AcademyModulePreviewModal } from "@/components/academy/academy-module-preview-modal";
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

/** Minimum vertical space reserved for module header tiles in journey map layout math. */
export const ACADEMY_MODULE_SIGNPOST_HEIGHT_PX = 72;
/** Vertical space between every module header tile and its first lesson node. */
export const ACADEMY_MODULE_SIGNPOST_GAP_PX = 72;

/** First lesson milestone — used for START HERE placement. */
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
  const isLocked = isModuleSignpostLocked(
    moduleNumber,
    milestones,
    masteryCohort,
  );
  const useDarkSignpostInk = moduleNumber === 3 || moduleNumber === 6;

  return (
    <>
      <div
        className="relative z-base flex w-full shrink-0 justify-center px-2"
        style={{ minHeight: ACADEMY_MODULE_SIGNPOST_HEIGHT_PX }}
      >
        <button
          type="button"
          onClick={() => setPreviewOpen(true)}
          aria-label={`Module ${moduleNumber}: ${title}. Tap to preview what you will learn.`}
          aria-haspopup="dialog"
          className="group w-full max-w-[min(100%,28rem)] rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nga-secondary"
        >
          <div
            className={cn(
              "relative flex w-full items-center justify-center rounded-2xl border-0 border-b-[4px] px-4 py-2.5 transition-all duration-75",
              "group-hover:brightness-[1.03] group-active:translate-y-[2px] group-active:border-b-[2px]",
              isLocked && "opacity-90",
            )}
            style={{
              backgroundColor: phase.fill,
              borderBottomColor: phase.shadow,
              boxShadow: `0 2px 0 ${phase.shadow}`,
            }}
          >
            <div className="relative flex w-full min-w-0 items-center justify-center px-5">
              {isLocked ? (
                <span
                  className={cn(
                    "absolute left-3 top-1/2 -translate-y-1/2",
                    useDarkSignpostInk ? "text-[#031F82]/80" : "text-white/90",
                  )}
                  aria-hidden
                >
                  <LockIcon className="size-4" />
                </span>
              ) : null}
              <p
                className={cn(
                  "text-balance text-center font-heading text-base font-bold leading-snug sm:text-lg",
                  useDarkSignpostInk
                    ? "text-[#031F82]"
                    : "text-white drop-shadow-sm",
                )}
              >
                Module {moduleNumber}: {title}
              </p>
            </div>
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
