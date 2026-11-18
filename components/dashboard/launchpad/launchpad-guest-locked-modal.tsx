"use client";

import Link from "next/link";
import { ModalShell } from "@/components/ui/modal-shell";
import { copyMatrix } from "@/constants/copyMatrix";
import { GUEST_SAVE_SIGN_UP_HREF } from "@/lib/onboarding/guest-save-prompt";
import { cn } from "@/lib/utils/cn";

const orangeCtaClass =
  "inline-flex h-touch min-h-touch w-full items-center justify-center rounded-nga-lg border-b-4 border-[#C88202] bg-[#FFA503] px-6 font-heading text-sm font-bold uppercase tracking-wide text-[#031F82] shadow-md transition-all hover:brightness-[1.02] active:translate-y-[2px] active:border-b-2";

type LaunchpadGuestLockedModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

/**
 * Guest lock message for Launchpad. The tab stays visible, but this dialog
 * is the only thing a guest can open; the Launchpad route is not reached.
 */
export function LaunchpadGuestLockedModal({
  isOpen,
  onClose,
}: LaunchpadGuestLockedModalProps) {
  const copy = copyMatrix.dashboard.launchpad;

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      layer="modal"
      labelledBy="launchpad-guest-locked-title"
      describedBy="launchpad-guest-locked-body"
      backdropClassName="bg-[#031F82]/45"
      panelClassName="max-w-sm rounded-nga-xl bg-white p-5"
    >
      <h2
        id="launchpad-guest-locked-title"
        className="font-heading text-lg font-extrabold text-[#031F82]"
      >
        {copy.title}
      </h2>
      <p
        id="launchpad-guest-locked-body"
        className="mt-2 text-sm text-[#1E3A5F]"
      >
        {copy.guestLocked.body}
      </p>
      <Link
        href={GUEST_SAVE_SIGN_UP_HREF}
        onClick={onClose}
        className={cn("mt-4", orangeCtaClass)}
      >
        {copy.guestLocked.cta}
      </Link>
    </ModalShell>
  );
}
