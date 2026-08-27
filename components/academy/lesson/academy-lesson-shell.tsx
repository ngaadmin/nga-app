"use client";

import type { ReactNode } from "react";
import {
  LESSON_MAX_LIVES,
  lessonNextButtonClass,
} from "@/components/academy/lesson/lesson-shared-styles";
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
}: AcademyLessonShellProps) {
  const livesRemaining = Math.max(0, maxLives - mistakes);
  const progressPercent =
    totalScreens > 1
      ? Math.round((currentScreenIndex / (totalScreens - 1)) * 100)
      : 100;

  return (
    <div
      className="mx-auto flex h-full min-h-0 w-full max-w-md flex-1 flex-col bg-white"
      style={{ touchAction: "pan-y" }}
    >
      <header className="flex shrink-0 items-center gap-2.5 px-4 pb-1 pt-3.5">
        <div
          className="flex shrink-0 items-center gap-0.5"
          aria-label={`${livesRemaining} of ${maxLives} lives remaining`}
        >
          {Array.from({ length: maxLives }, (_, index) => (
            <LessonLifeHeart key={index} filled={index < livesRemaining} />
          ))}
        </div>
        <div
          className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#E8F6FC]"
          role="progressbar"
          aria-valuenow={currentScreenIndex + 1}
          aria-valuemin={1}
          aria-valuemax={totalScreens}
          aria-label={`Screen ${currentScreenIndex + 1} of ${totalScreens}`}
        >
          <div
            className="h-full rounded-full bg-[#0CC1E0] transition-[width] duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </header>

      <div className="relative min-h-0 flex-1 overflow-hidden">
        <div
          className="flex h-full w-full transition-transform duration-300 ease-out"
          style={{
            transform: `translateX(-${currentScreenIndex * 100}%)`,
          }}
        >
          {children}
        </div>
      </div>

      {hideFooter ? null : (
        <footer className="flex shrink-0 justify-center bg-white px-4 pb-4 pt-2">
          {footerSlot !== undefined ? (
            footerSlot
          ) : (
            <button
              type="button"
              onClick={onNext}
              disabled={!canAdvance}
              className={lessonNextButtonClass}
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
}: {
  children: ReactNode;
  isActive?: boolean;
}) {
  return (
    <div
      className="flex h-full w-full shrink-0 flex-col overflow-hidden px-5 pb-3 pt-8"
      aria-hidden={!isActive}
      inert={isActive ? undefined : true}
    >
      {children}
    </div>
  );
}

export { lessonCardClass } from "@/components/academy/lesson/lesson-shared-styles";
export { lessonChoiceBaseClass as lessonChoiceClass } from "@/components/academy/lesson/lesson-shared-styles";
