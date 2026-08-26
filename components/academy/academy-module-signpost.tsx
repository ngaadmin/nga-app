"use client";

import { useState } from "react";
import { AcademyModulePreviewModal } from "@/components/academy/academy-module-preview-modal";
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

/** Vertical space under each module bar so the first node sits fully below it. */
export const ACADEMY_MODULE_SIGNPOST_GAP_PX = 72;

/** First lesson milestone - used for START HERE placement. */
export const ACADEMY_JOURNEY_ENTRY_MILESTONE_ID = 1;

function moduleBarInk(fill: string): "#031F82" | "#FFFFFF" {
  const hex = fill.replace("#", "");
  if (hex.length < 6) return "#031F82";
  const r = Number.parseInt(hex.slice(0, 2), 16) / 255;
  const g = Number.parseInt(hex.slice(2, 4), 16) / 255;
  const b = Number.parseInt(hex.slice(4, 6), 16) / 255;
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.45 ? "#031F82" : "#FFFFFF";
}

type AcademyModuleSignpostProps = {
  moduleNumber: AcademyLevelId;
  milestones: readonly AcademyLessonMilestoneNode[];
  masteryCohort: MasteryCohort;
};

/** Full-width coloured module bar with title and subtitle inside. */
export function AcademyModuleSignpost({
  moduleNumber,
  milestones,
  masteryCohort,
}: AcademyModuleSignpostProps) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const phase = getAcademyPhaseTheme(moduleNumber);
  const title = ACADEMY_MODULE_TITLES[moduleNumber];
  const subtitle = ACADEMY_MODULE_DESCRIPTIONS[moduleNumber];
  const ink = moduleBarInk(phase.fill);
  const isLocked = isModuleSignpostLocked(
    moduleNumber,
    milestones,
    masteryCohort,
  );

  return (
    <>
      <div className="w-full shrink-0" style={{ backgroundColor: phase.fill }}>
        <button
          type="button"
          onClick={() => setPreviewOpen(true)}
          aria-label={`Module ${moduleNumber}: ${title}. ${subtitle}. Tap to preview what you will learn.`}
          aria-haspopup="dialog"
          className="relative w-full px-10 py-2 text-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <p
            className={cn(
              "inline-flex max-w-full items-center justify-center gap-1 font-heading text-[16px] font-extrabold leading-tight",
              isLocked && "opacity-90",
            )}
            style={{ color: ink }}
          >
            {isLocked ? (
              <LockIcon className="size-3.5 shrink-0" aria-hidden />
            ) : null}
            <span className="line-clamp-1">{title}</span>
          </p>
          <p
            className={cn(
              "mt-0.5 line-clamp-1 font-sans text-[13px] font-medium leading-tight",
              isLocked && "opacity-90",
            )}
            style={{ color: ink }}
          >
            {subtitle}
          </p>
          <span
            className="pointer-events-none absolute right-3 top-1/2 flex size-5 -translate-y-1/2 items-center justify-center rounded-full border font-heading text-[10px] font-extrabold leading-none"
            style={{ borderColor: ink, color: ink }}
            aria-hidden
          >
            i
          </span>
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
