"use client";

import Link from "next/link";
import { useRef, type ReactNode } from "react";
import {
  LESSON_MAX_LIVES,
  lessonCyanNextButtonClass,
  lessonNextButtonClass,
  lessonScreenInlinePaddingClass,
} from "@/components/academy/lesson/lesson-shared-styles";
import { pathProgressPercent } from "@/lib/academy/lessons/payload/lesson-graph";
import { cn } from "@/lib/utils/cn";

type AcademyLessonShellProps = {
  currentScreenIndex: number;
  totalScreens: number;
  mistakes: number;
  maxLives?: number;
  /** @deprecated Lesson reward XP is shown on completion; header shows lives only. */
  xpReward?: number;
  canAdvance: boolean;
  onNext: () => void;
  children: ReactNode;
  footerSlot?: ReactNode;
  /** Completion uses its own Cash in CTA — hide the lesson Next footer. */
  hideFooter?: boolean;
  /** Advances along the path the student took. Omit to use the screen index. */
  progressIndex?: number;
  /** Screens on the shortest complete path, including the screen they are on. */
  progressTotal?: number;
  /** The open screen is the lesson completion screen. */
  progressComplete?: boolean;
  /** Completion draws its own coins counter in place of hearts and progress. */
  hideHeader?: boolean;
  /** Match screen: 20px margins, gold progress, and the brand Next pill. */
  matchChrome?: boolean;
  /** Slider and paired-sort screens: light blue page and the cyan Next pill. */
  skySurface?: boolean;
  cyanFooter?: boolean;
};

function LessonLifeHeart({ filled }: { filled: boolean }) {
  return (
    <span className="text-[14px] leading-none" aria-hidden>
      {filled ? "❤️" : "🤍"}
    </span>
  );
}

export function AcademyLessonShell({
  currentScreenIndex,
  totalScreens,
  mistakes,
  maxLives = LESSON_MAX_LIVES,
  canAdvance,
  onNext,
  children,
  footerSlot,
  hideFooter = false,
  progressIndex,
  progressTotal,
  progressComplete = false,
  hideHeader = false,
  matchChrome = false,
  skySurface = false,
  cyanFooter = false,
}: AcademyLessonShellProps) {
  const livesRemaining = Math.max(0, maxLives - mistakes);
  const barIndex = progressIndex ?? currentScreenIndex;
  const barTotal = progressTotal ?? totalScreens;
  const progressPercent =
    progressIndex === undefined
      ? barTotal > 1
        ? Math.round((barIndex / (barTotal - 1)) * 100)
        : 100
      : pathProgressPercent(barIndex, barTotal, progressComplete);
  const previousIndexRef = useRef(currentScreenIndex);
  const skippedPane = Math.abs(currentScreenIndex - previousIndexRef.current) > 1;
  previousIndexRef.current = currentScreenIndex;

  return (
    <div
      className={cn(
        "mx-auto flex h-full min-h-0 w-full max-w-md flex-1 flex-col overflow-x-hidden",
        matchChrome
          ? "bg-[linear-gradient(180deg,#EEF5FF_0%,#FFFFFF_55%)]"
          : skySurface
            ? "bg-[linear-gradient(180deg,#EEF7FD_0%,#FFFFFF_55%)]"
            : "bg-white",
      )}
      style={{ touchAction: "pan-y", overscrollBehavior: "none" }}
    >
      {hideHeader ? null : (
      <header
        className={cn(
          "flex shrink-0 items-center gap-2.5",
          matchChrome ? "h-12 px-5" : "pb-1 pt-3.5",
          !matchChrome &&
            (skySurface ? "lesson-screen-inline-24" : lessonScreenInlinePaddingClass),
        )}
      >
        <Link
          href="/dashboard/academy"
          aria-label="Close lesson"
          className="grid size-8 shrink-0 place-items-center rounded-full text-[#031F82] transition-colors hover:bg-[#E8F6FC] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0CC1E0]"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            className="size-4"
            aria-hidden
          >
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </Link>
        <div
          className="flex shrink-0 items-center gap-0.5"
          aria-label={`${livesRemaining} of ${maxLives} lives remaining`}
        >
          {Array.from({ length: maxLives }, (_, index) => (
            <LessonLifeHeart key={index} filled={index < livesRemaining} />
          ))}
        </div>
        <div
          className={cn(
            "flex-1 overflow-hidden",
            matchChrome ? "h-2 rounded-[4px] bg-[#DCE6FA]" : "h-1.5 rounded-full bg-[#E8F6FC]",
          )}
          role="progressbar"
          aria-valuenow={barIndex + 1}
          aria-valuemin={1}
          aria-valuemax={barTotal}
          aria-label={`Screen ${barIndex + 1} of ${barTotal}`}
        >
          <div
            className={cn(
              "h-full transition-[width] duration-300 ease-out",
              matchChrome ? "rounded-[4px] bg-[#FFB822]" : "rounded-full bg-[#0CC1E0]",
            )}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </header>
      )}

      <div className="relative min-h-0 flex-1 overflow-hidden">
        <div
          className={cn(
            "flex h-full w-full ease-out",
            skippedPane ? "transition-none" : "transition-transform duration-300",
          )}
          style={{
            transform: `translateX(-${currentScreenIndex * 100}%)`,
          }}
        >
          {children}
        </div>
      </div>

      {hideFooter ? null : (
        <footer className="flex shrink-0 justify-center bg-transparent px-5 pb-7 pt-2">
          {footerSlot !== undefined ? (
            footerSlot
          ) : (
            <button
              type="button"
              onClick={onNext}
              disabled={!canAdvance}
              className={cyanFooter ? lessonCyanNextButtonClass : lessonNextButtonClass}
            >
              Next
            </button>
          )}
        </footer>
      )}
    </div>
  );
}

export function LessonScreenPane({
  children,
  isActive = true,
  flush = false,
}: {
  children: ReactNode;
  isActive?: boolean;
  /** Completion fills the shell, including the header band. */
  flush?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex h-full w-full shrink-0 flex-col overflow-hidden",
        flush ? "p-0" : "pb-3 pt-1",
      )}
      style={{ overscrollBehavior: "none", touchAction: "pan-y" }}
      aria-hidden={!isActive}
      inert={isActive ? undefined : true}
    >
      {children}
    </div>
  );
}

export { lessonCardClass } from "@/components/academy/lesson/lesson-shared-styles";
export { lessonChoiceBaseClass as lessonChoiceClass } from "@/components/academy/lesson/lesson-shared-styles";
