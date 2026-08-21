"use client";

import { useEffect, useState } from "react";
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
  showSkillsCupIntro?: boolean;
  onSkillsClick: () => void;
  onSkillsIntroSeen?: () => void;
  onStreakClick: () => void;
  onXpClick: () => void;
};

export function AcademyMomentumHeader({
  username,
  xp,
  dayStreak,
  skillsHasAttention = false,
  showSkillsCupIntro = false,
  onSkillsClick,
  onSkillsIntroSeen,
  onStreakClick,
  onXpClick,
}: AcademyMomentumHeaderProps) {
  const streakCopy = copyMatrix.home.streak;
  const journeyCopy = copyMatrix.dashboard.academy.journey;
  const [tipVisible, setTipVisible] = useState(false);

  useEffect(() => {
    if (!showSkillsCupIntro) {
      setTipVisible(false);
      return;
    }
    setTipVisible(true);
    const hide = window.setTimeout(() => {
      setTipVisible(false);
      onSkillsIntroSeen?.();
    }, 7000);
    return () => window.clearTimeout(hide);
  }, [showSkillsCupIntro, onSkillsIntroSeen]);

  return (
    <StatusBannerLayout
      aria-label="App stats"
      clusterGapClassName="gap-4"
      left={
        <StatusMetricPill
          interactive
          className="shrink-0"
          onClick={onXpClick}
          icon={
            <TopBarRoundIcon>
              <GoldCoinIcon className="size-5" />
            </TopBarRoundIcon>
          }
          value={xp}
          unitLabel={journeyCopy.xpLabel}
          ariaLabel={`${xp} ${journeyCopy.xpLabel}. Open coins exchange`}
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
                  ? "Open skills cabinet. New medal earned."
                  : "Open skills cabinet"
              }
              title={journeyCopy.skillsCupLabel}
              className={cn(
                TOP_BAR_ROUND_ICON_CLASS,
                "relative transition-[filter,transform] hover:brightness-[1.05] active:scale-95",
                showSkillsCupIntro && "animate-skills-cup-pulse",
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
            {tipVisible ? (
              <div
                role="status"
                className="absolute right-0 top-[calc(100%+0.4rem)] w-44 rounded-xl bg-[#031F82] px-3 py-2 text-left shadow-md"
              >
                <p className="font-heading text-xs font-bold leading-snug text-white">
                  {journeyCopy.skillsCupTip}
                </p>
              </div>
            ) : null}
          </div>
        </>
      }
    />
  );
}
