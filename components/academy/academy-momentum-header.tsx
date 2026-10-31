"use client";

import { useLayoutEffect } from "react";
import {
  StatusBannerLayout,
  TopBarRoundIcon,
} from "@/components/dashboard/status-banner-layout";
import { StatusMetricPill } from "@/components/dashboard/status-metric-pill";
import { UserHandleControl } from "@/components/dashboard/user-handle-control";
import { ProfileAvatarOrInitial } from "@/components/dashboard/profile/profile-avatar";
import { copyMatrix } from "@/constants/copyMatrix";
import {
  COIN_COUNTER_ATTR,
  clearCoinCounterTick,
  readCoinCounterTick,
} from "@/lib/academy/lessons/coin-counter-flight";
import { coinWord } from "@/lib/copy/coin-word";
import type { ProfileAvatarId } from "@/lib/dashboard/profile-avatar";
import { FlameIcon, GoldCoinIcon } from "@/lib/dashboard/icons";

type AcademyMomentumHeaderProps = {
  username: string;
  xp: number;
  dayStreak: number;
  /** Null shows the first letter of the name instead of art (parents). */
  avatarId: ProfileAvatarId | null;
  /** Track name (Explorer, Pathfinder, Maverick). Null hides the label. */
  trackLabel: string | null;
  /** Dot on the avatar when a new medal is waiting in the profile panel. */
  profileHasAttention?: boolean;
  showCoins?: boolean;
  onProfileClick: () => void;
  onStreakClick: () => void;
  onXpClick?: () => void;
};

/**
 * Top bar: avatar and track on the left, username in the true center,
 * streak and coins on the right.
 */
export function AcademyMomentumHeader({
  username,
  xp,
  dayStreak,
  avatarId,
  trackLabel,
  profileHasAttention = false,
  showCoins = true,
  onProfileClick,
  onStreakClick,
  onXpClick,
}: AcademyMomentumHeaderProps) {
  const streakCopy = copyMatrix.home.streak;
  const coinUnit = coinWord(xp);
  const profileName = username.trim() || "your profile";

  useLayoutEffect(() => {
    if (readCoinCounterTick() > 0) clearCoinCounterTick();
  }, [xp]);

  return (
    <StatusBannerLayout
      aria-label="App stats"
      left={
        <button
          type="button"
          onClick={onProfileClick}
          data-top-bar-avatar
          aria-label={[
            `Open profile for ${profileName}`,
            trackLabel ? `${trackLabel} track` : null,
            profileHasAttention ? "New medal earned" : null,
          ]
            .filter(Boolean)
            .join(". ")}
          className="relative z-raised flex h-full min-w-0 max-w-full items-center gap-1.5 rounded-full pr-1 transition-opacity hover:opacity-80 active:opacity-60"
        >
          <span className="relative shrink-0">
            <ProfileAvatarOrInitial
              avatarId={avatarId}
              name={username}
              className="size-8 text-sm ring-2 ring-[#FFA503]"
            />
            {profileHasAttention ? (
              <span
                className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-[#031F82] ring-2 ring-white"
                aria-hidden
              />
            ) : null}
          </span>
          {trackLabel ? (
            <span
              data-top-bar-track
              className="min-w-0 truncate font-heading text-[10px] font-bold uppercase tracking-normal text-[#0288A3]"
            >
              {trackLabel}
            </span>
          ) : null}
        </button>
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
            className="shrink-0"
            icon={
              <TopBarRoundIcon>
                <FlameIcon className="size-[18px]" />
              </TopBarRoundIcon>
            }
            value={dayStreak}
            ariaLabel={`${dayStreak} ${streakCopy.label}`}
            title={streakCopy.label}
          />
          <div
            {...{ [COIN_COUNTER_ATTR]: "" }}
            data-coin-balance={xp}
            className={showCoins ? "shrink-0" : "invisible shrink-0"}
            aria-hidden={showCoins ? undefined : true}
          >
            <StatusMetricPill
              interactive={showCoins && Boolean(onXpClick)}
              className="shrink-0"
              onClick={showCoins ? onXpClick : undefined}
              icon={
                <TopBarRoundIcon>
                  <GoldCoinIcon className="size-[18px]" />
                </TopBarRoundIcon>
              }
              value={xp}
              ariaLabel={
                onXpClick ? `${xp} ${coinUnit} to cash in` : `${xp} ${coinUnit}`
              }
              title={onXpClick ? `${coinUnit} to cash in` : coinUnit}
            />
          </div>
        </>
      }
    />
  );
}
