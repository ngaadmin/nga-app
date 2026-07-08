"use client";

import { ModalShell } from "@/components/ui/modal-shell";
import { cn } from "@/lib/utils/cn";

type GhostModeSaveModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

const orangeCtaClass =
  "rounded-nga-lg border-b-4 border-[#C88202] bg-[#FFA503] font-heading text-sm font-bold uppercase tracking-wide text-[#031F82] transition-all hover:brightness-[1.02] active:translate-y-[2px] active:border-b-2";

export function GhostModeSaveModal({ isOpen, onClose }: GhostModeSaveModalProps) {
  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      layer="toast"
      labelledBy="ghost-save-title"
      backdropClassName="bg-[#031F82]/50"
      panelClassName="rounded-2xl border-0 bg-white p-5 shadow-md sm:p-6"
    >
      <p className="font-heading text-[10px] font-bold uppercase tracking-wide text-[#0CC1E0]">
        Free account - not premium
      </p>
      <h2
        id="ghost-save-title"
        className="mt-2 font-heading text-xl font-extrabold leading-tight text-[#031F82] sm:text-2xl"
      >
        Sign Up to Save Your Progress &amp; Lock in Your Streak!
      </h2>
      <p className="mt-3 font-sans text-sm leading-relaxed text-[#1E3A5F]">
        Finn says your wins are riding on a ghost session right now. Create a
        free account to keep your streak, jars, and venture roadmap safe -
        no paid upgrade required.
      </p>

      <button
        type="button"
        className={cn("mt-5 h-touch w-full px-6 shadow-md", orangeCtaClass)}
      >
        Create My Free Account
      </button>
      <button
        type="button"
        onClick={onClose}
        className="mt-3 w-full rounded-nga-lg px-4 py-2 font-heading text-sm font-bold text-[#0CC1E0] transition-colors hover:bg-[#BDE9FB]/40"
      >
        Keep exploring in Ghost Mode
      </button>
    </ModalShell>
  );
}
