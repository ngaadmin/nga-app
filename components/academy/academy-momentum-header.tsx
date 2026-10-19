"use client";

import {
  StatusBannerLayout,
  TOP_BAR_ROUND_ICON_CLASS,
  TopBarRoundIcon,
} from "@/components/dashboard/status-banner-layout";
import { StatusMetricPill } from "@/components/dashboard/status-metric-pill";
import { UserHandleControl } from "@/components/dashboard/user-handle-control";
import { copyMatrix } from "@/constants/copyMatrix";
import { AchievementsIcon, FlameIcon, GoldCoinIcon } from "@/lib/dashboard/icons";
import { cn } from "@/lib/utils/cn";

type AcademyMomentumHeaderProps = {
  username: string;
  xp: number;
  dayStreak: number;
  skillsHasAttention?: boolean;
  onSkillsClick: () => void;
  onStreakClick: () => void;
  onXpClick?: () => void;
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
      aria-label="App stats"
      clusterGapClassName="gap-4"
      left={
        <StatusMetricPill
          interactive={Boolean(onXpClick)}
          className="shrink-0"
          onClick={onXpClick}
          icon={
            <TopBarRoundIcon>
              <GoldCoinIcon className="size-5" />
            </TopBarRoundIcon>
          }
          value={xp}
          unitLabel={journeyCopy.xpLabel}
          ariaLabel={
            onXpClick
              ? `${xp} ${journeyCopy.xpLabel} to cash in`
              : `${xp} ${journeyCopy.xpLabel}`
          }
          title={onXpClick ? `${journeyCopy.xpLabel} to cash in` : journeyCopy.xpLabel}
        />
      }
      center={
        <UserHandleControl
          username={username}
          size="sm"
          className="min-w-0 max-w-full"
          showGuestHandle={false}
        />
      }
      right={
        <>
          <StatusMetricPill
            interactive
            onClick={onStreakClick}
            icon={
              <TopBarRoundIcon>
                <FlameIcon className="size-5" />
              </TopBarRoundIcon>
            }
            value={dayStreak}
            ariaLabel={`${dayStreak} ${streakCopy.label}`}
            title={streakCopy.label}
          />
          <div className="relative z-raised flex h-full items-center">
            <button
              type="button"
              onClick={onSkillsClick}
              aria-label={
                skillsHasAttention
                  ? "Open medals. New medal earned."
                  : "Open medals"
              }
              title={journeyCopy.skillsCupLabel}
              className={cn(
                TOP_BAR_ROUND_ICON_CLASS,
                "relative transition-[filter,transform] hover:brightness-[1.05] active:scale-95",
              )}
            >
              <AchievementsIcon className="size-5" />
              {skillsHasAttention ? (
                <span
                  className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-[#031F82] ring-2 ring-white"
                  aria-hidden
                />
              ) : null}
            </button>
          </div>
        </>
      }
    />
  );
}
