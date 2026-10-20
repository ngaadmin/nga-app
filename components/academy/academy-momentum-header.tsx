"use client";

import { useLayoutEffect } from "react";
import {
  StatusBannerLayout,
  TOP_BAR_ROUND_ICON_CLASS,
  TopBarRoundIcon,
} from "@/components/dashboard/status-banner-layout";
import { StatusMetricPill } from "@/components/dashboard/status-metric-pill";
import { UserHandleControl } from "@/components/dashboard/user-handle-control";
import { copyMatrix } from "@/constants/copyMatrix";
import {
  COIN_COUNTER_ATTR,
  clearCoinCounterTick,
  readCoinCounterTick,
} from "@/lib/academy/lessons/coin-counter-flight";
import { coinWord } from "@/lib/copy/coin-word";
import { AchievementsIcon, FlameIcon, GoldCoinIcon } from "@/lib/dashboard/icons";
import { cn } from "@/lib/utils/cn";

type AcademyMomentumHeaderProps = {
  username: string;
  xp: number;
  dayStreak: number;
  skillsHasAttention?: boolean;
  showCoins?: boolean;
  onSkillsClick: () => void;
  onStreakClick: () => void;
  onXpClick?: () => void;
};

export function AcademyMomentumHeader({
  username,
  xp,
  dayStreak,
  skillsHasAttention = false,
  showCoins = true,
  onSkillsClick,
  onStreakClick,
  onXpClick,
}: AcademyMomentumHeaderProps) {
  const streakCopy = copyMatrix.home.streak;
  const journeyCopy = copyMatrix.dashboard.academy.journey;
  const coinUnit = coinWord(xp);

  useLayoutEffect(() => {
    if (readCoinCounterTick() > 0) clearCoinCounterTick();
  }, [xp]);

  return (
    <StatusBannerLayout
      aria-label="App stats"
      clusterGapClassName="gap-4"
      left={
        <div
          {...{ [COIN_COUNTER_ATTR]: "" }}
          data-coin-balance={xp}
          className={showCoins ? "min-w-0" : "invisible min-w-0"}
          aria-hidden={showCoins ? undefined : true}
        >
          <StatusMetricPill
            interactive={showCoins && Boolean(onXpClick)}
            className="shrink-0"
            onClick={showCoins ? onXpClick : undefined}
            icon={
              <TopBarRoundIcon>
                <GoldCoinIcon className="size-5" />
              </TopBarRoundIcon>
            }
            value={xp}
            unitLabel={coinUnit}
            ariaLabel={
              onXpClick ? `${xp} ${coinUnit} to cash in` : `${xp} ${coinUnit}`
            }
            title={onXpClick ? `${coinUnit} to cash in` : coinUnit}
          />
        </div>
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
