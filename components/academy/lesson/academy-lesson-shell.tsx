"use client";

import type { ReactNode } from "react";
import {
  LESSON_MAX_LIVES,
  lessonNextButtonClass,
} from "@/components/academy/lesson/lesson-shared-styles";
import {
  STATUS_BANNER_ICON_CLASS,
  STATUS_BANNER_ITEM_CLASS,
  StatusBannerLayout,
  TopBarRoundIcon,
} from "@/components/dashboard/status-banner-layout";
import { StatusMetricPill } from "@/components/dashboard/status-metric-pill";
import { UserHandleControl } from "@/components/dashboard/user-handle-control";
import { copyMatrix } from "@/constants/copyMatrix";
import { useDashboardWallet } from "@/lib/dashboard/dashboard-wallet-context";
import { GoldCoinIcon } from "@/lib/dashboard/icons";
import { cn } from "@/lib/utils/cn";

type AcademyLessonShellProps = {
  currentScreenIndex: number;
  totalScreens: number;
  mistakes: number;
  maxLives?: number;
  /** @deprecated Lesson reward XP is shown on completion; header shows lifetime XP. */
  xpReward?: number;
  canAdvance: boolean;
  onNext: () => void;
  children: ReactNode;
  footerSlot?: ReactNode;
};

function LessonLifeHeart({ filled }: { filled: boolean }) {
  return (
    <span
      className={cn(
        STATUS_BANNER_ICON_CLASS,
        "inline-flex items-center justify-center text-[14px] leading-tight",
        filled ? "text-[#E11D48]" : "text-[#BDE9FB]",
      )}
      aria-hidden
    >
      {filled ? "♥" : "♡"}
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
}: AcademyLessonShellProps) {
  const livesRemaining = Math.max(0, maxLives - mistakes);
  const { lifetimePointsEarned } = useDashboardWallet();
  const journeyCopy = copyMatrix.dashboard.academy.journey;
  const progressPercent =
    totalScreens > 1
      ? Math.round((currentScreenIndex / (totalScreens - 1)) * 100)
      : 100;

  return (
    <div
      className="mx-auto flex h-full min-h-0 w-full max-w-md flex-1 flex-col bg-white"
      style={{ touchAction: "pan-y" }}
    >
      <header className="shrink-0 pt-6 sm:pt-8">
        <StatusBannerLayout
          className="border-b-0 bg-transparent"
          insetClassName="px-3"
          clusterGapClassName="gap-2"
          aria-label="Lesson stats"
          left={
            <>
              <div
                className={cn(STATUS_BANNER_ITEM_CLASS, "gap-0.5")}
                aria-label={`${livesRemaining} of ${maxLives} lives remaining`}
              >
                {Array.from({ length: maxLives }, (_, index) => (
                  <LessonLifeHeart
                    key={index}
                    filled={index < livesRemaining}
                  />
                ))}
              </div>

              <StatusMetricPill
                interactive={false}
                icon={
                  <TopBarRoundIcon>
                    <GoldCoinIcon className="size-5" />
                  </TopBarRoundIcon>
                }
                value={lifetimePointsEarned}
                unitLabel={journeyCopy.xpLabel}
                ariaLabel={`${lifetimePointsEarned} ${journeyCopy.xpLabel}`}
              />
            </>
          }
          center={
            <UserHandleControl
              size="sm"
              interactive={false}
              className="min-w-0 max-w-full"
            />
          }
        />

        <div className="border-b border-[#BDE9FB]/40 px-3 pb-2 pt-1.5">
          <div
            className="h-1 overflow-hidden rounded-full bg-[#BDE9FB]/50"
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

      <footer className="flex shrink-0 justify-center border-t border-[#BDE9FB]/40 bg-white px-3 py-3 pb-4">
        {footerSlot ?? (
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
      className="flex h-full w-full shrink-0 flex-col overflow-hidden px-3 py-3"
      aria-hidden={!isActive}
      inert={isActive ? undefined : true}
    >
      {children}
    </div>
  );
}

export { lessonCardClass } from "@/components/academy/lesson/lesson-shared-styles";
export { lessonChoiceBaseClass as lessonChoiceClass } from "@/components/academy/lesson/lesson-shared-styles";
