"use client";

import { useLayoutEffect, type ReactNode, type Ref } from "react";
import {
  StatusBannerLayout,
  TopBarRoundIcon,
} from "@/components/dashboard/status-banner-layout";
import { StatusMetricPill } from "@/components/dashboard/status-metric-pill";
import { UserHandleControl } from "@/components/dashboard/user-handle-control";
import { ProfileAvatarOrInitial } from "@/components/dashboard/profile/profile-avatar";
import { ProfileSwitcherBadge } from "@/components/dashboard/profile-switcher/profile-switcher";
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
  /** The label names a role (Parent), not a track. */
  trackLabelIsRole?: boolean;
  /** Dot on the avatar when a new medal is waiting in the profile panel. */
  profileHasAttention?: boolean;
  showCoins?: boolean;
  onProfileClick: () => void;
  onStreakClick: () => void;
  onXpClick?: () => void;
  /**
   * Profile switcher: when set, the avatar shows an arrow badge and opens the
   * switcher menu (rendered by the caller) instead of the profile panel.
   */
  profileSwitcher?: {
    open: boolean;
    buttonRef: Ref<HTMLButtonElement>;
    /** One-time tip under the avatar, or null. */
    tip: ReactNode;
  };
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
  trackLabelIsRole = false,
  profileHasAttention = false,
  showCoins = true,
  onProfileClick,
  onStreakClick,
  onXpClick,
  profileSwitcher,
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
        <div className="relative flex h-full min-w-0 max-w-full items-center">
          <button
            ref={profileSwitcher?.buttonRef}
            type="button"
            onClick={onProfileClick}
            data-top-bar-avatar
            data-profile-switcher={profileSwitcher ? "on" : undefined}
            aria-haspopup={profileSwitcher ? "dialog" : undefined}
            aria-expanded={profileSwitcher ? profileSwitcher.open : undefined}
            aria-controls={
              profileSwitcher?.open ? "profile-switcher-menu" : undefined
            }
            aria-label={[
              profileSwitcher
                ? `Profiles for ${profileName}`
                : `Open profile for ${profileName}`,
              trackLabel
                ? trackLabelIsRole
                  ? trackLabel
                  : `${trackLabel} track`
                : null,
              profileHasAttention ? "New medal earned" : null,
            ]
              .filter(Boolean)
              .join(". ")}
            className="relative z-raised flex h-full min-w-0 max-w-full items-center gap-1.5 rounded-full pr-1 transition-opacity hover:opacity-80 active:opacity-60"
          >
            <span
              className={
                profileSwitcher?.open
                  ? "relative shrink-0 rounded-full bg-[#E8F6FC] shadow-[0_0_0_2px_#031F82]"
                  : "relative shrink-0 rounded-full"
              }
            >
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
              {profileSwitcher ? (
                <ProfileSwitcherBadge open={profileSwitcher.open} />
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
          {profileSwitcher?.tip ?? null}
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
