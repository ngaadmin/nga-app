"use client";

import Link from "next/link";
import { ModalShell } from "@/components/ui/modal-shell";
import { ONBOARDING_SIGN_UP_PATH } from "@/lib/onboarding/ghost-session";
import { cn } from "@/lib/utils/cn";

type GhostModeSaveModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

const orangeCtaClass =
  "inline-flex h-touch min-h-touch w-full items-center justify-center rounded-nga-lg border-b-4 border-[#C88202] bg-[#FFA503] px-6 font-heading text-sm font-bold uppercase tracking-wide text-[#031F82] shadow-md transition-all hover:brightness-[1.02] active:translate-y-[2px] active:border-b-2";

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
        Sign up to save your progress &amp; lock in your streak!
      </h2>
      <p className="mt-3 font-sans text-sm leading-relaxed text-[#1E3A5F]">
        Create a free account to keep your streak, points and skills earned safe
        - no paid upgrade required.
      </p>

      <Link
        href={ONBOARDING_SIGN_UP_PATH}
        onClick={onClose}
        className={cn("mt-5", orangeCtaClass)}
      >
        Create My Free Account
      </Link>
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
