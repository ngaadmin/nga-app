"use client";

import Link from "next/link";
import { ModalShell } from "@/components/ui/modal-shell";
import { BTN_PRIMARY } from "@/components/launchpad/venture-test/venture-test-ui";
import { copyMatrix } from "@/constants/copyMatrix";
import { GUEST_SAVE_SIGN_UP_HREF } from "@/lib/onboarding/guest-save-prompt";

/**
 * Shown to a guest at the end of Level 1 and when they try to enter Level 2.
 * The button goes to the existing learner sign-up. Wording is placeholder
 * copy in copyMatrix.dashboard.launchpad.guestExplore, for Storybird to replace.
 */
export function GuestExplorePrompt({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const copy = copyMatrix.dashboard.launchpad.guestExplore;
  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      layer="modal"
      align="center"
      labelledBy="launchpad-guest-explore-title"
      describedBy="launchpad-guest-explore-body"
      backdropClassName="bg-[#031F82]/45"
      panelClassName="max-w-sm rounded-nga-xl bg-white p-6 text-center"
    >
      <h2 id="launchpad-guest-explore-title" className="font-heading text-lg font-extrabold text-[#031F82]">
        {copy.heading}
      </h2>
      <p id="launchpad-guest-explore-body" className="mt-2 text-sm text-[#1E3A5F]">
        {copy.body}
      </p>
      <Link href={GUEST_SAVE_SIGN_UP_HREF} className={`${BTN_PRIMARY} mt-5`} data-guest-explore-cta="">
        {copy.cta}
      </Link>
      <button
        type="button"
        onClick={onClose}
        className="mt-3 inline-flex h-10 items-center justify-center rounded-full px-4 font-heading text-sm font-bold text-[#1E3A5F] underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nga-ink"
      >
        {copy.notNow}
      </button>
    </ModalShell>
  );
}
