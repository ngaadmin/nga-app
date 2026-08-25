"use client";

import { useMemo } from "react";
import { InviteFriendsControl } from "@/components/community/invite-friends-control";
import { DashboardSectionHeading } from "@/components/dashboard/dashboard-section-heading";
import { useDashboardWallet } from "@/lib/dashboard/dashboard-wallet-context";
import { FlameIcon, GoldCoinIcon } from "@/lib/dashboard/icons";
import { useDashboardUser } from "@/lib/dashboard/use-dashboard-user";
import { DASHBOARD_HOME_PLACEHOLDER_STATE } from "@/lib/dashboard/home-state";
import { cn } from "@/lib/utils/cn";

const CURRENT_USER_RANK = 67;

type LeaderboardEntry = {
  id: string;
  avatarEmoji: string;
  username: string;
  dayStreak: number;
  lifetimePoints: number;
  isCurrentUser: boolean;
  rank: number;
};

type SeedPlayer = Omit<LeaderboardEntry, "isCurrentUser" | "rank">;

const COMMUNITY_SEED_PLAYERS: readonly SeedPlayer[] =
  [
    {
      id: "seed-1",
      username: "Pat_40$",
      avatarEmoji: "🦊",
      dayStreak: 42,
      lifetimePoints: 6100,
    },
    {
      id: "seed-2",
      username: "Hann4h",
      avatarEmoji: "🐯",
      dayStreak: 18,
      lifetimePoints: 4820,
    },
    {
      id: "seed-3",
      username: "JonnyCa$h",
      avatarEmoji: "🦁",
      dayStreak: 7,
      lifetimePoints: 3890,
    },
  ];

type FriendRowProps = {
  rank: number;
  avatarEmoji: string;
  username: string;
  dayStreak: number;
  lifetimePoints: number;
  highlight?: boolean;
  showYouMarker?: boolean;
};

function FriendRow({
  rank,
  avatarEmoji,
  username,
  dayStreak,
  lifetimePoints,
  highlight = false,
  showYouMarker = false,
}: FriendRowProps) {
  return (
    <li
      className={cn(
        "flex items-center gap-1.5 rounded-lg border border-[#031F82]/10 bg-[#FAFDFF] px-2 py-1",
        highlight && "border-[#FFA503]/50 bg-[#FFF7ED]",
      )}
    >
      <span
        className="w-7 shrink-0 text-left font-heading text-xs font-extrabold text-[#031F82]"
        aria-label={`Rank ${rank}`}
      >
        #{rank}
      </span>

      <span
        className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#BDE9FB]/35 text-sm leading-none"
        aria-hidden
      >
        {avatarEmoji}
      </span>

      <div className="min-w-0 flex-1">
        <p className="flex min-w-0 items-center gap-1">
          <span className="truncate font-heading text-sm font-extrabold text-[#031F82]">
            {username}
          </span>
          {showYouMarker ? (
            <span className="shrink-0 rounded bg-[#FFA503]/20 px-1 py-px font-heading text-[10px] font-bold uppercase tracking-wide text-[#031F82]">
              You
            </span>
          ) : null}
        </p>
        <div className="mt-0.5 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0">
          <span className="inline-flex items-center gap-0.5">
            <FlameIcon className="size-2.5 text-[#FFA503]" />
            <span className="font-heading text-[11px] font-bold text-[#031F82]">
              {dayStreak} day streak
            </span>
          </span>
          <span className="inline-flex items-center gap-0.5">
            <GoldCoinIcon className="size-2.5 text-[#FFA503]" />
            <span className="font-heading text-[11px] font-bold text-[#031F82]">
              {lifetimePoints.toLocaleString()} lifetime coins
            </span>
          </span>
        </div>
      </div>
    </li>
  );
}

/** Community leaderboard. Seed rows are sample players, not the user's friends. */
export function SocialFriendsSection() {
  const { username } = useDashboardUser();
  const { lifetimePointsEarned } = useDashboardWallet();
  const { dayStreak } = DASHBOARD_HOME_PLACEHOLDER_STATE;

  const rankedEntries = useMemo((): LeaderboardEntry[] => {
    const seeds: LeaderboardEntry[] = COMMUNITY_SEED_PLAYERS.slice(0, 3).map(
      (player, index) => ({
        ...player,
        rank: index + 1,
        isCurrentUser: false,
      }),
    );

    return [
      ...seeds,
      {
        id: "current-user",
        avatarEmoji: "⭐",
        username,
        dayStreak,
        lifetimePoints: lifetimePointsEarned,
        isCurrentUser: true,
        rank: CURRENT_USER_RANK,
      },
    ];
  }, [dayStreak, lifetimePointsEarned, username]);

  return (
    <section aria-labelledby="social-friends-heading" className="w-full shrink-0">
      <div className="flex items-start justify-between gap-3">
        <DashboardSectionHeading
          id="social-friends-heading"
          className="flex-1 text-left sm:text-left"
        >
          Community Leaderboard
        </DashboardSectionHeading>
        <InviteFriendsControl />
      </div>
      <p className="mt-1 font-sans text-[14px] leading-snug text-nga-slate/80">
        Ranked by lifetime coins.
      </p>

      <ol className="mt-2 space-y-1">
        {rankedEntries.map((entry) => (
          <FriendRow
            key={entry.id}
            rank={entry.rank}
            avatarEmoji={entry.avatarEmoji}
            username={entry.username}
            dayStreak={entry.dayStreak}
            lifetimePoints={entry.lifetimePoints}
            highlight={entry.isCurrentUser}
            showYouMarker={entry.isCurrentUser && entry.lifetimePoints > 0}
          />
        ))}
      </ol>
    </section>
  );
}
