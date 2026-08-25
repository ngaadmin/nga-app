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
  "first-session": { icon: "▶️", shortLabel: "First session" },
  "first-lesson": { icon: "📖", shortLabel: "First lesson" },
  "first-savings-goal": { icon: "🎯", shortLabel: "Savings goal" },
  "first-savings-deposit": { icon: "💵", shortLabel: "First deposit" },
  "first-medal": { icon: "🏅", shortLabel: "First medal" },
  "opened-launchpad": { icon: "🚀", shortLabel: "Open Launchpad" },
  "first-module": { icon: "📦", shortLabel: "First module" },
  "streak-3": { icon: "🔥", shortLabel: "3-day streak" },
  "first-bronze": { icon: "🥉", shortLabel: "First Bronze" },
  "started-business": { icon: "💡", shortLabel: "First business" },
  "saved-50": { icon: "💰", shortLabel: "Saved $50" },
  "skills-5": { icon: "⭐", shortLabel: "5 skills" },
  "streak-7": { icon: "🔥", shortLabel: "7-day streak" },
  "module-1": { icon: "1️⃣", shortLabel: "Module 1" },
  "launchpad-step": { icon: "👟", shortLabel: "First step" },
  "saved-100": { icon: "💰", shortLabel: "Saved $100" },
  "saved-250": { icon: "💰", shortLabel: "Saved $250" },
  "saved-500": { icon: "💰", shortLabel: "Saved $500" },
  "saved-1000": { icon: "💰", shortLabel: "Saved $1000" },
  "saved-2500": { icon: "💰", shortLabel: "Saved $2500" },
};

const carouselScrollerClass =
  "@container w-full min-w-0 overflow-x-auto overscroll-x-contain py-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden";

const carouselTrackClass = "flex w-max snap-x snap-mandatory gap-2";

const carouselChipClass =
  "flex w-[calc((100cqi-1.5rem)/3.3)] min-w-0 shrink-0 snap-start flex-col items-center px-1 py-1.5 text-center";

function MilestoneTile({
  id,
  label,
  achieverCount,
  achieved,
}: CommunityMilestoneRow) {
  const tile = MILESTONE_TILE[id];

  return (
    <li
      title={`${label}. ${achieverCount.toLocaleString()} people achieved this`}
      aria-label={`${label} - ${achieved ? "achieved" : "not achieved"}. ${achieverCount.toLocaleString()} people achieved this`}
      className={carouselChipClass}
    >
      <span
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-full text-lg leading-none",
          achieved
            ? "bg-gradient-to-br from-[#EEF9FF] via-nga-panel to-[#8ED4EF] text-nga-primary shadow-[inset_0_3px_5px_rgba(255,255,255,0.85),inset_0_-2px_4px_rgba(12,193,224,0.22),0_3px_8px_rgba(3,31,130,0.16)]"
            : "border-2 border-[#D1D5DB] bg-transparent text-nga-primary/35 grayscale",
        )}
        aria-hidden
      >
        {tile.icon}
      </span>
      <p
        className={cn(
          "mt-1 w-full min-w-0 truncate font-heading text-[13px] font-bold leading-tight",
          achieved ? "text-nga-primary" : "text-nga-primary/45",
        )}
      >
        {tile.shortLabel}
      </p>
      <p
        className={cn(
          "mt-0.5 font-sans text-[10px] font-medium leading-tight",
          achieved ? "text-nga-slate" : "text-nga-primary/30",
        )}
      >
        {achieverCount.toLocaleString()} people
      </p>
    </li>
  );
}

function MilestoneCarousel({
  label,
  items,
}: {
  label: string;
  items: CommunityMilestoneRow[];
}) {
  if (items.length === 0) return null;

  return (
    <div className="min-w-0">
      <p className="mb-1 font-heading text-[10px] font-bold uppercase tracking-wide text-[#0CC1E0]">
        {label}
      </p>
      <div className={carouselScrollerClass} aria-label={label}>
        <ol className={carouselTrackClass}>
          {items.map((row) => (
            <MilestoneTile key={row.id} {...row} />
          ))}
        </ol>
      </div>
    </div>
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
  const achievedRows = displayRows.filter((row) => row.achieved);
  const availableRows = displayRows.filter((row) => !row.achieved);
  const achievedCount = achievedRows.length;

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
        className="flex w-full items-center justify-between gap-3 rounded-nga-lg border border-nga-panel bg-nga-surface px-3 py-2 font-heading text-[16px] font-bold uppercase tracking-wide text-nga-primary"
      >
        <span>Milestones</span>
        <span className="flex items-center gap-2 font-heading text-[16px] font-bold normal-case tracking-normal text-nga-slate">
          {achievedCount}/{COMMUNITY_MILESTONE_TOTAL} achieved
          <span aria-hidden className="text-[#FFA503]">
            {open ? "-" : "+"}
          </span>
        </span>
      </button>
      {open ? (
        <div id="community-milestones-list" className="mt-2 space-y-2">
          <MilestoneCarousel label="Achieved" items={achievedRows} />
          <MilestoneCarousel label="Available" items={availableRows} />
        </div>
      ) : null}
    </section>
  );
}
