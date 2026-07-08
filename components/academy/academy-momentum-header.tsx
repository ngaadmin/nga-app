"use client";

import { GhostModeBadge } from "@/components/dashboard/ghost-mode-badge";
import { copyMatrix } from "@/constants/copyMatrix";
import { FlameIcon, XpStarIcon } from "@/lib/dashboard/icons";
import { TACTILE_PRESS } from "@/lib/dashboard/styles";
import { useDashboardUser } from "@/lib/dashboard/use-dashboard-user";

type AcademyMomentumHeaderProps = {
  dayStreak: number;
  xp: number;
};

export function AcademyMomentumHeader({
  dayStreak,
  xp,
}: AcademyMomentumHeaderProps) {
  const { isGhostMode, isLoading } = useDashboardUser();
  const streakCopy = copyMatrix.home.streak;
  const journeyCopy = copyMatrix.dashboard.academy.journey;

  return (
    <div className="sticky top-0 z-sticky shrink-0 bg-white px-1 py-2">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border-0 bg-white p-3 shadow-md">
          <div className="flex items-center gap-1.5">
            <FlameIcon className="size-5 shrink-0 text-nga-cta" />
            <span className="font-heading text-[10px] font-bold text-nga-slate sm:text-xs">
              {streakCopy.label}
            </span>
          </div>
          <p className="mt-1 font-heading text-lg font-extrabold leading-none text-nga-primary sm:text-xl">
            {dayStreak}
            <span className="ml-1 text-[10px] font-bold text-nga-slate sm:text-xs">
              {streakCopy.unit}
            </span>
          </p>
        </div>

        <div
          className={`flex flex-col justify-center rounded-2xl border-0 bg-white p-3 shadow-md ${TACTILE_PRESS}`}
        >
          <div className="flex items-center gap-1.5">
            <XpStarIcon className="size-4 shrink-0 text-nga-accent" />
            <span className="font-heading text-[10px] font-bold text-nga-slate sm:text-xs">
              {journeyCopy.xpLabel}
            </span>
          </div>
          <p className="mt-1 font-heading text-lg font-extrabold leading-none text-nga-primary sm:text-xl">
            {xp}
          </p>
        </div>
      </div>

      {isGhostMode && !isLoading ? (
        <GhostModeBadge className="mt-2" size="sm" />
      ) : null}
    </div>
  );
}
