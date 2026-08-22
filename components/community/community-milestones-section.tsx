"use client";

import { useEffect, useState } from "react";
import {
  COMMUNITY_MILESTONES,
  COMMUNITY_MILESTONE_TOTAL,
  evaluateCommunityMilestones,
  type CommunityMilestoneRow,
} from "@/lib/community/milestones";
import { cn } from "@/lib/utils/cn";

function MilestoneRow({ label, achieverCount, achieved }: CommunityMilestoneRow) {
  return (
    <li
      className={cn(
        "rounded-xl px-3 py-2",
        achieved
          ? "border border-nga-secondary/40 bg-nga-panel/35 text-nga-primary"
          : "border border-dashed border-nga-panel/70 bg-nga-surface text-nga-primary/40",
      )}
    >
      <p
        className={cn(
          "font-heading text-xs font-extrabold leading-snug",
          achieved ? "text-nga-primary" : "text-nga-primary/40",
        )}
      >
        {label}
      </p>
      <p
        className={cn(
          "mt-0.5 font-sans text-[10px] font-medium",
          achieved ? "text-nga-primary/60" : "text-nga-primary/35",
        )}
      >
        {achieverCount.toLocaleString()} people achieved this
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
        <ol id="community-milestones-list" className="mt-2 space-y-1.5">
          {displayRows.map((row) => (
            <MilestoneRow key={row.id} {...row} />
          ))}
        </ol>
      ) : null}
    </section>
  );
}
