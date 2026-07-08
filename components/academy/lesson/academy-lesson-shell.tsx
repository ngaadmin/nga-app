"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

const nextButtonClass =
  "h-touch w-full max-w-md rounded-nga-lg border-b-4 border-[#099FB8] bg-[#0CC1E0] px-6 font-heading text-sm font-bold uppercase tracking-wide text-[#031F82] shadow-md transition-all hover:brightness-[1.03] active:translate-y-[2px] active:border-b-2 disabled:cursor-not-allowed disabled:border-b-4 disabled:opacity-40 disabled:active:translate-y-0";

type AcademyLessonShellProps = {
  lessonLabel: string;
  currentScreenIndex: number;
  totalScreens: number;
  canAdvance: boolean;
  onNext: () => void;
  children: ReactNode;
  footerSlot?: ReactNode;
};

export function AcademyLessonShell({
  lessonLabel,
  currentScreenIndex,
  totalScreens,
  canAdvance,
  onNext,
  children,
  footerSlot,
}: AcademyLessonShellProps) {
  return (
    <div
      className="mx-auto flex h-full min-h-0 w-full max-w-md flex-1 flex-col bg-white"
      style={{ touchAction: "pan-y" }}
    >
      <header className="shrink-0 border-b border-[#BDE9FB]/40 px-4 py-3">
        <p className="text-center font-heading text-[10px] font-bold uppercase tracking-wide text-[#0CC1E0]">
          {lessonLabel}
        </p>
        <p className="mt-1 text-center font-heading text-xs font-extrabold text-[#031F82]">
          Screen {currentScreenIndex + 1} of {totalScreens}
        </p>
        <div className="mt-2 flex justify-center gap-1.5">
          {Array.from({ length: totalScreens }, (_, index) => (
            <span
              key={index}
              className={cn(
                "h-1.5 w-6 rounded-full transition-colors",
                index === currentScreenIndex
                  ? "bg-[#0CC1E0]"
                  : index < currentScreenIndex
                    ? "bg-[#031F82]/30"
                    : "bg-[#BDE9FB]/60",
              )}
              aria-hidden
            />
          ))}
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

      <footer className="shrink-0 border-t border-[#BDE9FB]/40 bg-white px-4 py-4 pb-6">
        {footerSlot ?? (
          <button
            type="button"
            onClick={onNext}
            disabled={!canAdvance}
            className={nextButtonClass}
          >
            Next
          </button>
        )}
      </footer>
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
      className="flex h-full w-full shrink-0 flex-col overflow-y-auto px-4 py-5"
      aria-hidden={!isActive}
      inert={isActive ? undefined : true}
    >
      {children}
    </div>
  );
}

export const lessonCardClass =
  "rounded-2xl border-0 bg-white p-4 shadow-md";

export { lessonChoiceBaseClass as lessonChoiceClass } from "@/components/academy/lesson/lesson-shared-styles";
