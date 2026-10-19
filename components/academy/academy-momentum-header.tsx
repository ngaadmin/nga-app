"use client";

import { useLayoutEffect, useState } from "react";
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
  lessonMotionEnabled,
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
  const [shownXp, setShownXp] = useState(xp);
  const coinUnit = coinWord(shownXp);

  useLayoutEffect(() => {
    const pending = readCoinCounterTick();
    const motion = lessonMotionEnabled();
    if (pending <= 0 || !motion) {
      if (pending > 0 && xp > 0) clearCoinCounterTick();
      setShownXp(xp);
      return;
    }
    if (xp <= 0) {
      setShownXp(xp);
      return;
    }
    const from = Math.max(0, xp - pending);
    if (xp <= from) {
      clearCoinCounterTick();
      setShownXp(xp);
      return;
    }

    setShownXp(from);
    const started = performance.now();
    let frame = 0;
    const step = (now: number) => {
      const progress = Math.min(1, (now - started) / 520);
      setShownXp(Math.round(from + (xp - from) * progress));
      if (progress < 1) {
        frame = requestAnimationFrame(step);
        return;
      }
      clearCoinCounterTick();
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [xp]);

  return (
    <StatusBannerLayout
      aria-label="App stats"
      clusterGapClassName="gap-4"
      left={
        <div {...{ [COIN_COUNTER_ATTR]: "" }} className="min-w-0">
          <StatusMetricPill
            interactive={Boolean(onXpClick)}
            className="shrink-0"
            onClick={onXpClick}
            icon={
              <TopBarRoundIcon>
                <GoldCoinIcon className="size-5" />
              </TopBarRoundIcon>
            }
            value={shownXp}
            unitLabel={coinUnit}
            ariaLabel={
              onXpClick
                ? `${shownXp} ${coinUnit} to cash in`
                : `${shownXp} ${coinUnit}`
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
