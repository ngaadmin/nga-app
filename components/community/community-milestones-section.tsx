"use client";

import { useEffect, useState } from "react";
import {
  COMMUNITY_MILESTONES,
  COMMUNITY_MILESTONE_TOTAL,
  evaluateCommunityMilestones,
  type CommunityMilestoneId,
  type CommunityMilestoneRow,
} from "@/lib/community/milestones";
import { cn } from "@/lib/utils/cn";

const MILESTONE_TILE: Record<
  CommunityMilestoneId,
  { icon: string; shortLabel: string }
> = {
  "first-session": { icon: "▶️", shortLabel: "Session" },
  "first-lesson": { icon: "📖", shortLabel: "Lesson" },
  "first-savings-goal": { icon: "🎯", shortLabel: "Goal set" },
  "first-savings-deposit": { icon: "💵", shortLabel: "Deposit" },
  "first-medal": { icon: "🏅", shortLabel: "Medal" },
  "opened-launchpad": { icon: "🚀", shortLabel: "Launchpad" },
  "first-module": { icon: "📦", shortLabel: "Module" },
  "streak-3": { icon: "🔥", shortLabel: "3-day" },
  "first-bronze": { icon: "🥉", shortLabel: "Bronze" },
  "started-business": { icon: "💡", shortLabel: "Business" },
  "saved-50": { icon: "💰", shortLabel: "$50" },
  "skills-5": { icon: "⭐", shortLabel: "5 skills" },
  "streak-7": { icon: "🔥", shortLabel: "7-day" },
  "module-1": { icon: "1️⃣", shortLabel: "Module 1" },
  "launchpad-step": { icon: "👟", shortLabel: "First step" },
  "saved-100": { icon: "💰", shortLabel: "$100" },
  "saved-250": { icon: "💰", shortLabel: "$250" },
  "saved-500": { icon: "💰", shortLabel: "$500" },
  "saved-1000": { icon: "💰", shortLabel: "$1000" },
  "saved-2500": { icon: "💰", shortLabel: "$2500" },
};

function MilestoneTile({
  id,
  label,
  achieverCount,
  achieved,
}: CommunityMilestoneRow) {
  const tile = MILESTONE_TILE[id];
  const caption = `${achieverCount.toLocaleString()} people`;

  return (
    <li
      title={`${label}. ${achieverCount.toLocaleString()} people achieved this`}
      aria-label={`${label} - ${achieved ? "achieved" : "not achieved"}. ${achieverCount.toLocaleString()} people achieved this`}
      className={cn(
        "flex min-h-0 flex-col items-center justify-center rounded-xl px-1 py-1.5 text-center",
        achieved
          ? "border border-nga-secondary/40 bg-nga-panel/35"
          : "border border-dashed border-nga-panel/70 bg-nga-surface",
      )}
    >
      <span
        className={cn(
          "flex size-8 items-center justify-center rounded-full text-base leading-none",
          achieved
            ? "bg-nga-secondary/20"
            : "bg-white text-nga-primary/40 opacity-55 grayscale",
        )}
        aria-hidden
      >
        {tile.icon}
      </span>
      <p
        className={cn(
          "mt-1 line-clamp-2 font-heading text-[8px] font-bold leading-tight",
          achieved ? "text-nga-primary" : "text-nga-primary/40",
        )}
      >
        {tile.shortLabel}
      </p>
      <p
        className={cn(
          "mt-0.5 font-sans text-[7px] font-medium leading-tight",
          achieved ? "text-nga-primary/55" : "text-nga-primary/30",
        )}
      >
        {caption}
      </p>
    </li>
  );
}

/** Community milestones list. Collapsed by default. */
export function CommunityMilestonesSection() {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<CommunityMilestoneRow[] | null>(null);

  useEffect(() => {
    setRows(evaluateCommunityMilestones());
  }, [open]);

  const displayRows =
    rows ??
    COMMUNITY_MILESTONES.map((milestone) => ({
      ...milestone,
      achieved: false,
    }));
  const achievedCount = displayRows.filter((row) => row.achieved).length;

  return (
    <section aria-labelledby="community-milestones-heading" className="w-full shrink-0">
      <h2 id="community-milestones-heading" className="sr-only">
        Milestones
      </h2>
      <button
        type="button"
        aria-expanded={open}
        aria-controls="community-milestones-list"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-3 rounded-nga-lg border border-nga-panel bg-nga-surface px-3 py-2 font-heading text-xs font-bold uppercase tracking-wide text-nga-primary"
      >
        <span>Milestones</span>
        <span className="flex items-center gap-2 font-heading text-[10px] font-bold normal-case tracking-normal text-nga-slate">
          {achievedCount}/{COMMUNITY_MILESTONE_TOTAL} achieved
          <span aria-hidden className="text-nga-secondary">
            {open ? "-" : "+"}
          </span>
        </span>
      </button>
      {open ? (
        <ol
          id="community-milestones-list"
          className="mt-2 grid grid-cols-3 gap-1.5 sm:grid-cols-4"
        >
          {displayRows.map((row) => (
            <MilestoneTile key={row.id} {...row} />
          ))}
        </ol>
      ) : null}
    </section>
  );
}
