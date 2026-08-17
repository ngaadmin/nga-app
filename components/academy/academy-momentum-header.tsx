"use client";

import {
  STATUS_BANNER_ITEM_CLASS,
  StatusBannerLayout,
} from "@/components/dashboard/status-banner-layout";
import { StatusMetricPill } from "@/components/dashboard/status-metric-pill";
import { UserHandleControl } from "@/components/dashboard/user-handle-control";
import { copyMatrix } from "@/constants/copyMatrix";
import { AchievementsIcon, FlameIcon, XpStarIcon } from "@/lib/dashboard/icons";
import { cn } from "@/lib/utils/cn";

type AcademyMomentumHeaderProps = {
  username: string;
  xp: number;
  dayStreak: number;
  skillsHasAttention?: boolean;
  onSkillsClick: () => void;
  onStreakClick: () => void;
  onXpClick: () => void;
};

export function AcademyMomentumHeader({
  username,
  xp,
  dayStreak,
  skillsHasAttention = false,
  onSkillsClick,
  onStreakClick,
  onXpClick,
}: AcademyMomentumHeaderProps) {
  const streakCopy = copyMatrix.home.streak;
  const journeyCopy = copyMatrix.dashboard.academy.journey;

  return (
    <StatusBannerLayout
      aria-label="Academy stats"
      clusterGapClassName="gap-4"
      left={
        <StatusMetricPill
          interactive
          onClick={onXpClick}
          icon={
            <XpStarIcon className="size-5 shrink-0 text-nga-accent" />
          }
          value={xp}
          unitLabel={journeyCopy.xpLabel}
          ariaLabel={`${xp} ${journeyCopy.xpLabel}. Open XP exchange`}
          title={journeyCopy.xpLabel}
        />
      }
      center={
        <UserHandleControl
          username={username}
          size="sm"
          className="min-w-0 max-w-full"
        />
      }
      right={
        <>
          <StatusMetricPill
            interactive
            onClick={onStreakClick}
            icon={
              <FlameIcon className="size-5 shrink-0 text-nga-cta" />
            }
            value={dayStreak}
            ariaLabel={`${dayStreak} ${streakCopy.label}`}
            title={streakCopy.label}
          />
          <button
            type="button"
            onClick={onSkillsClick}
            aria-label={
              skillsHasAttention
                ? "Open skills — new medal earned"
                : "Open skills"
            }
            className={cn(
              STATUS_BANNER_ITEM_CLASS,
              "relative transition-opacity hover:opacity-70 active:opacity-55",
              skillsHasAttention &&
                "text-[#FFA503] drop-shadow-[0_0_6px_rgba(255,165,3,0.95)]",
            )}
          >
            <AchievementsIcon
              className={cn(
                "size-5 shrink-0",
                skillsHasAttention ? "text-[#FFA503]" : "text-[#031F82]",
              )}
            />
            {skillsHasAttention ? (
              <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-[#FFA503] ring-2 ring-white" />
            ) : null}
          </button>
        </>
      }
    />
  );
}
