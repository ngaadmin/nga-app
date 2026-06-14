"use client";

import { useCallback, useState } from "react";
import { ACHIEVEMENTS_HORIZONTAL_CAROUSEL_CLASS } from "@/components/achievements/achievements-carousel";
import { DashboardSectionHeading } from "@/components/dashboard/dashboard-section-heading";
import { MilestoneCongratsModal } from "@/components/achievements/milestone-congrats-modal";
import {
  ALL_MONEY_MILESTONES,
  DEMO_EARNED_MILESTONE_IDS,
  MONEY_MILESTONE_ACTIONS,
  MONEY_MILESTONE_SAVINGS,
  type MoneyMilestone,
} from "@/lib/dashboard/achievements-state";
import { cn } from "@/lib/utils/cn";

type MilestoneBadgeProps = {
  milestone: MoneyMilestone;
  earned: boolean;
  onSelect: (milestone: MoneyMilestone) => void;
};

function MilestoneBadge({ milestone, earned, onSelect }: MilestoneBadgeProps) {
  return (
    <button
      type="button"
      disabled={!earned}
      onClick={() => earned && onSelect(milestone)}
      aria-label={
        earned
          ? `${milestone.label} - earned, tap for details`
          : `${milestone.label} - locked`
      }
      className={cn(
        "flex w-[4.75rem] shrink-0 snap-center flex-col items-center px-1 py-2 text-center transition-transform sm:w-[5.25rem]",
        earned && "cursor-pointer hover:scale-[1.03] active:scale-[0.98]",
        !earned && "cursor-default opacity-70",
      )}
    >
      <span
        className={cn(
          "flex size-12 items-center justify-center rounded-full text-lg sm:size-14",
          earned
            ? "border-b-4 border-[#099FB8] bg-[#0CC1E0] text-[#031F82] shadow-[0_4px_12px_rgba(12,193,224,0.35)]"
            : "border-2 border-dashed border-[#C5D0D8] bg-white text-[#8FA3B0]",
        )}
        aria-hidden
      >
        {milestone.emoji}
      </span>
      <span
        className={cn(
          "mt-2 line-clamp-2 font-heading text-[9px] font-bold leading-tight sm:text-[10px]",
          earned ? "text-[#031F82]" : "text-[#031F82]/45",
        )}
      >
        {milestone.label}
      </span>
    </button>
  );
}

type MilestoneCarouselRowProps = {
  title: string;
  milestones: readonly MoneyMilestone[];
  earnedIds: ReadonlySet<string>;
  onSelect: (milestone: MoneyMilestone) => void;
};

function MilestoneCarouselRow({
  title,
  milestones,
  earnedIds,
  onSelect,
}: MilestoneCarouselRowProps) {
  return (
    <div>
      <h3 className="mb-2 px-1 font-heading text-[10px] font-bold uppercase tracking-wide text-[#0CC1E0]">
        {title}
      </h3>
      <div className={cn(ACHIEVEMENTS_HORIZONTAL_CAROUSEL_CLASS, "px-1")}>
        {milestones.map((milestone) => (
          <MilestoneBadge
            key={milestone.id}
            milestone={milestone}
            earned={earnedIds.has(milestone.id)}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
}

export function MoneyMilestonesSection() {
  const [earnedIds] = useState<ReadonlySet<string>>(DEMO_EARNED_MILESTONE_IDS);
  const [activeMilestone, setActiveMilestone] = useState<MoneyMilestone | null>(
    null,
  );
  const [modalOpen, setModalOpen] = useState(false);

  const handleSelect = useCallback((milestone: MoneyMilestone) => {
    setActiveMilestone(milestone);
    setModalOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setModalOpen(false);
    setActiveMilestone(null);
  }, []);

  return (
    <section aria-labelledby="money-milestones-heading" className="w-full shrink-0">
      <DashboardSectionHeading id="money-milestones-heading">
        Money Milestones
      </DashboardSectionHeading>
      <p className="mt-2 text-center font-sans text-[10px] leading-relaxed text-[#1E3A5F]/80">
        Financial wins only - tap an earned badge for the real-world story.
      </p>

      <div className="mt-4 space-y-5 rounded-2xl border-0 bg-white p-3 shadow-md sm:p-4">
        <MilestoneCarouselRow
          title="Actions"
          milestones={MONEY_MILESTONE_ACTIONS}
          earnedIds={earnedIds}
          onSelect={handleSelect}
        />
        <MilestoneCarouselRow
          title="Savings"
          milestones={MONEY_MILESTONE_SAVINGS}
          earnedIds={earnedIds}
          onSelect={handleSelect}
        />
      </div>

      <MilestoneCongratsModal
        milestone={activeMilestone}
        isOpen={modalOpen}
        onClose={handleClose}
      />

      <p className="sr-only">
        {ALL_MONEY_MILESTONES.length} total money milestones tracked.
      </p>
    </section>
  );
}
