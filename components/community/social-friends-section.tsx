"use client";

import { useEffect, useState } from "react";
import { InviteFriendsControl } from "@/components/community/invite-friends-control";
import { DashboardSectionHeading } from "@/components/dashboard/dashboard-section-heading";
import {
  loadOptedInLeaderboard,
  type LeaderboardPlayer,
} from "@/lib/community/opted-in-leaderboard";
import { GoldCoinIcon } from "@/lib/dashboard/icons";
import { useDashboardUser } from "@/lib/dashboard/use-dashboard-user";
import { cn } from "@/lib/utils/cn";

type FriendRowProps = {
  rank: number;
  username: string;
  coinsEarned: number;
  highlight?: boolean;
};

function FriendRow({
  rank,
  username,
  coinsEarned,
  highlight = false,
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

      <div className="min-w-0 flex-1">
        <p className="truncate font-heading text-sm font-extrabold text-[#031F82]">
          {username}
          {highlight ? (
            <span className="ml-1 rounded bg-[#FFA503]/20 px-1 py-px font-heading text-[10px] font-bold uppercase tracking-wide text-[#031F82]">
              You
            </span>
          ) : null}
        </p>
        <span className="mt-0.5 inline-flex items-center gap-0.5">
          <GoldCoinIcon className="size-2.5 text-[#FFA503]" />
          <span className="font-heading text-[11px] font-bold text-[#031F82]">
            {coinsEarned.toLocaleString()} coins earned
          </span>
        </span>
      </div>
    </li>
  );
}

/** Community leaderboard of real opted-in players, ranked by coins earned. */
export function SocialFriendsSection() {
  const { username } = useDashboardUser();
  const [players, setPlayers] = useState<LeaderboardPlayer[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    void loadOptedInLeaderboard().then((rows) => {
      if (!cancelled) setPlayers(rows);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const you = username.trim().toLowerCase();

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
        Ranked by coins earned.
      </p>

      {players == null ? (
        <p className="mt-3 font-sans text-sm text-[#1E3A5F]">Loading the leaderboard…</p>
      ) : players.length === 0 ? (
        <p className="mt-3 font-sans text-sm text-[#1E3A5F]" role="status">
          No one on the leaderboard yet
        </p>
      ) : (
        <ol className="mt-2 space-y-1">
          {players.map((entry, index) => (
            <FriendRow
              key={entry.username}
              rank={index + 1}
              username={entry.username}
              coinsEarned={entry.coinsEarned}
              highlight={entry.username.trim().toLowerCase() === you}
            />
          ))}
        </ol>
      )}
    </section>
  );
}
