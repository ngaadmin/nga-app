"use client";

import { useMemo } from "react";
import { DashboardSectionHeading } from "@/components/dashboard/dashboard-section-heading";
import { DEMO_ACHIEVEMENT_FRIENDS } from "@/lib/dashboard/achievements-state";
import { useDashboardWallet } from "@/lib/dashboard/dashboard-wallet-context";
import { FlameIcon, GoldCoinIcon } from "@/lib/dashboard/icons";
import { useDashboardUser } from "@/lib/dashboard/use-dashboard-user";
import { DASHBOARD_HOME_PLACEHOLDER_STATE } from "@/lib/dashboard/home-state";
import { cn } from "@/lib/utils/cn";

const floatingPanelClass = "rounded-2xl border-0 bg-white shadow-md";

type LeaderboardEntry = {
  id: string;
  avatarEmoji: string;
  username: string;
  dayStreak: number;
  lifetimePoints: number;
  isCurrentUser?: boolean;
};

type FriendRowProps = {
  rank: number;
  avatarEmoji: string;
  username: string;
  dayStreak: number;
  lifetimePoints: number;
  highlight?: boolean;
};

function FriendRow({
  rank,
  avatarEmoji,
  username,
  dayStreak,
  lifetimePoints,
  highlight = false,
}: FriendRowProps) {
  return (
    <li
      className={cn(
        floatingPanelClass,
        "flex items-center gap-2 px-2 py-3 sm:gap-3 sm:px-3",
        highlight && "ring-2 ring-[#0CC1E0]/30",
      )}
    >
      <span
        className="w-8 shrink-0 text-left font-heading text-sm font-extrabold text-[#0CC1E0] sm:w-9 sm:text-base"
        aria-label={`Rank ${rank}`}
      >
        #{rank}
      </span>

      <span
        className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#BDE9FB]/35 text-lg sm:size-11 sm:text-xl"
        aria-hidden
      >
        {avatarEmoji}
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate font-heading text-sm font-extrabold text-[#031F82]">
          {username}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5 sm:gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-[#FFF7ED] px-2 py-0.5">
            <FlameIcon className="size-3 text-[#FFA503]" />
            <span className="font-heading text-[10px] font-bold text-[#031F82]">
              {dayStreak} day streak
            </span>
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-[#BDE9FB]/30 px-2 py-0.5">
            <GoldCoinIcon className="size-3 text-[#0CC1E0]" />
            <span className="font-heading text-[10px] font-bold text-[#031F82]">
              {lifetimePoints.toLocaleString()} lifetime coins
            </span>
          </span>
        </div>
      </div>
    </li>
  );
}

/** Parked for the future Community / Challenges hub. */
export function SocialFriendsSection() {
  const { username } = useDashboardUser();
  const { lifetimePointsEarned } = useDashboardWallet();
  const { dayStreak } = DASHBOARD_HOME_PLACEHOLDER_STATE;

  const rankedEntries = useMemo(() => {
    const currentUser: LeaderboardEntry = {
      id: "current-user",
      avatarEmoji: "⭐",
      username: username === "Guest" ? "You" : username,
      dayStreak,
      lifetimePoints: lifetimePointsEarned,
      isCurrentUser: true,
    };

    const friends: LeaderboardEntry[] = DEMO_ACHIEVEMENT_FRIENDS.map(
      (friend) => ({
        id: friend.id,
        avatarEmoji: friend.avatarEmoji,
        username: friend.username,
        dayStreak: friend.dayStreak,
        lifetimePoints: friend.lifetimePoints,
      }),
    );

    return [...friends, currentUser].sort(
      (a, b) => b.lifetimePoints - a.lifetimePoints,
    );
  }, [dayStreak, lifetimePointsEarned, username]);

  return (
    <section aria-labelledby="social-friends-heading" className="w-full shrink-0">
      <div className="flex items-start justify-between gap-3">
        <DashboardSectionHeading
          id="social-friends-heading"
          className="flex-1 text-left sm:text-left"
        >
          Friends Leaderboard
        </DashboardSectionHeading>
        <button
          type="button"
          className="shrink-0 rounded-nga-lg border-b-4 border-[#099FB8] bg-[#0CC1E0] px-3 py-2 font-heading text-[10px] font-bold uppercase tracking-wide text-[#031F82] shadow-sm transition-all hover:brightness-[1.03] active:translate-y-[2px] active:border-b-2 sm:text-xs"
        >
          + Invite Friends
        </button>
      </div>
      <p className="mt-2 font-sans text-[10px] leading-relaxed text-[#1E3A5F]/80">
        Ranked by lifetime coins - cash-outs don&apos;t shrink this score.
      </p>

      <ol className="mt-5 space-y-3">
        {rankedEntries.map((entry, index) => (
          <FriendRow
            key={entry.id}
            rank={index + 1}
            avatarEmoji={entry.avatarEmoji}
            username={entry.username}
            dayStreak={entry.dayStreak}
            lifetimePoints={entry.lifetimePoints}
            highlight={entry.isCurrentUser}
          />
        ))}
      </ol>
    </section>
  );
}
