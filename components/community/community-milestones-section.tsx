"use client";

import { useEffect, useState } from "react";
import {
  COMMUNITY_MILESTONES,
  COMMUNITY_MILESTONE_TOTAL,
  evaluateCommunityMilestones,
  type CommunityMilestoneId,
  type CommunityMilestoneRow,
} from "@/lib/community/milestones";
import { DashboardSectionHeading } from "@/components/dashboard/dashboard-section-heading";
import {
  pickableCarouselItemClass,
  pickableCarouselScrollerClass,
  pickableCarouselTrackClass,
  pickableCircleActiveClass,
  pickableCircleClass,
  pickableCircleMutedClass,
  pickableLabelActiveClass,
  pickableLabelClass,
  pickableLabelMutedClass,
  pickableMetaActiveClass,
  pickableMetaClass,
  pickableMetaMutedClass,
} from "@/components/ui/pickable-circle";
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
      className={pickableCarouselItemClass}
    >
      <span
        className={cn(
          pickableCircleClass,
          achieved ? pickableCircleActiveClass : pickableCircleMutedClass,
        )}
        aria-hidden
      >
        {tile.icon}
      </span>
      <p
        className={cn(
          pickableLabelClass,
          achieved ? pickableLabelActiveClass : pickableLabelMutedClass,
        )}
      >
        {tile.shortLabel}
      </p>
      <p
        className={cn(
          pickableMetaClass,
          achieved ? pickableMetaActiveClass : pickableMetaMutedClass,
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
      <div className={pickableCarouselScrollerClass} aria-label={label}>
        <ol className={pickableCarouselTrackClass}>
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
      <div className="flex items-center justify-between gap-3">
        <DashboardSectionHeading
          id="community-milestones-heading"
          className="flex-1 text-left sm:text-left"
        >
          Milestones
        </DashboardSectionHeading>
        <button
          type="button"
          aria-expanded={open}
          aria-controls="community-milestones-list"
          onClick={() => setOpen((value) => !value)}
          className="flex shrink-0 items-center gap-2 bg-transparent py-1 font-heading text-[16px] font-bold text-nga-slate"
        >
          {achievedCount}/{COMMUNITY_MILESTONE_TOTAL} achieved
          <span aria-hidden className="text-[#FFA503]">
            {open ? "-" : "+"}
          </span>
        </button>
      </div>
      {open ? (
        <div id="community-milestones-list" className="mt-2 space-y-2">
          <MilestoneCarousel label="Achieved" items={achievedRows} />
          <MilestoneCarousel label="Available" items={availableRows} />
        </div>
      ) : null}
    </section>
  );
}
