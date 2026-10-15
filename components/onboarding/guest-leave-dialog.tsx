"use client";

import Link from "next/link";
import { ModalShell } from "@/components/ui/modal-shell";
import {
  guestSavePromptHeadingClass,
  guestSavePromptPrimaryClass,
  guestSavePromptSecondaryClass,
} from "@/components/onboarding/guest-save-prompt-styles";
import {
  GUEST_LEAVE_ANYWAY_LABEL,
  GUEST_SAVE_PROGRESS_LABEL,
  GUEST_SAVE_SIGN_UP_HREF,
  guestLeavePromptCopy,
} from "@/lib/onboarding/guest-save-prompt";

type GuestLeaveDialogProps = {
  isOpen: boolean;
  xp: number;
  onLeave: () => void;
};

export function GuestLeaveDialog({ isOpen, xp, onLeave }: GuestLeaveDialogProps) {
  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onLeave}
      layer="toast"
      role="alertdialog"
      dismissOnBackdrop={false}
      labelledBy="guest-leave-title"
      backdropClassName="bg-[#031F82]/50"
      panelClassName="rounded-2xl border-0 bg-white p-5 shadow-md sm:p-6"
    >
      <div data-guest-save-prompt="leave">
        <h2 id="guest-leave-title" className={guestSavePromptHeadingClass}>
          {guestLeavePromptCopy(xp)}
        </h2>
        <div className="mt-5 flex flex-col gap-2">
          <Link href={GUEST_SAVE_SIGN_UP_HREF} className={guestSavePromptPrimaryClass}>
            {GUEST_SAVE_PROGRESS_LABEL}
          </Link>
          <button
            type="button"
            className={guestSavePromptSecondaryClass}
            onClick={onLeave}
          >
            {GUEST_LEAVE_ANYWAY_LABEL}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}
