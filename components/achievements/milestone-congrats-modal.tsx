"use client";

import type { MoneyMilestone } from "@/lib/dashboard/achievements-state";
import { ModalShell } from "@/components/ui/modal-shell";
import { cn } from "@/lib/utils/cn";

const orangeCtaClass =
  "rounded-nga-lg border-b-4 border-[#C88202] bg-[#FFA503] font-heading text-xs font-bold uppercase tracking-wide text-[#031F82] transition-all hover:brightness-[1.02] active:translate-y-[2px] active:border-b-2 sm:text-sm";

type MilestoneCongratsModalProps = {
  milestone: MoneyMilestone | null;
  isOpen: boolean;
  onClose: () => void;
};

export function MilestoneCongratsModal({
  milestone,
  isOpen,
  onClose,
}: MilestoneCongratsModalProps) {
  if (!milestone) return null;

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      layer="toast"
      labelledBy="milestone-congrats-title"
      backdropClassName="bg-[#031F82]/55"
      panelClassName="rounded-2xl border-0 bg-white p-5 shadow-md sm:p-6"
    >
      <p className="text-center text-4xl" aria-hidden>
        {milestone.emoji}
      </p>
      <p className="mt-2 text-center font-heading text-xs font-bold uppercase tracking-wide text-[#0CC1E0]">
        Congratulations!
      </p>
      <h2
        id="milestone-congrats-title"
        className="mt-2 text-center font-heading text-xl font-extrabold leading-tight text-[#031F82] sm:text-2xl"
      >
        {milestone.label}
      </h2>
      <p className="mt-4 font-sans text-sm leading-relaxed text-[#1E3A5F]">
        {milestone.funFact}
      </p>
      <button
        type="button"
        onClick={onClose}
        className={cn("mt-5 h-touch w-full px-6 shadow-md", orangeCtaClass)}
      >
        Keep stacking wins
      </button>
    </ModalShell>
  );
}
