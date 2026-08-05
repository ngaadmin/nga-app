"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ModalShell } from "@/components/ui/modal-shell";
import {
  ONBOARDING_SIGN_UP_PATH,
  readUserSession,
} from "@/lib/onboarding/guest-session";
import { readPendingParentConsent } from "@/lib/onboarding/parent-consent-pending";
import { cn } from "@/lib/utils/cn";

type GuestModeSaveModalProps = {
  isOpen: boolean;
  onClose: () => void;
  /** Optional override - falls back to session / pending consent parent email. */
  parentEmail?: string | null;
};

const orangeCtaClass =
  "inline-flex h-touch min-h-touch w-full items-center justify-center rounded-nga-lg border-b-4 border-[#C88202] bg-[#FFA503] px-6 font-heading text-sm font-bold uppercase tracking-wide text-[#031F82] shadow-md transition-all hover:brightness-[1.02] active:translate-y-[2px] active:border-b-2";

function resolveParentEmail(override?: string | null): string | null {
  if (typeof override === "string" && override.trim()) {
    return override.trim().toLowerCase();
  }
  if (typeof window === "undefined") return null;
  const fromSession = readUserSession()?.parentEmail?.trim().toLowerCase();
  if (fromSession) return fromSession;
  const fromPending = readPendingParentConsent()?.parentEmail?.trim().toLowerCase();
  return fromPending || null;
}

export function GuestModeSaveModal({
  isOpen,
  onClose,
  parentEmail: parentEmailProp,
}: GuestModeSaveModalProps) {
  const parentEmail = useMemo(
    () => (isOpen ? resolveParentEmail(parentEmailProp) : null),
    [isOpen, parentEmailProp],
  );

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      layer="toast"
      labelledBy="guest-save-title"
      backdropClassName="bg-[#031F82]/50"
      panelClassName="rounded-2xl border-0 bg-white p-5 shadow-md sm:p-6"
    >
      <h2
        id="guest-save-title"
        className="font-heading text-xl font-extrabold leading-tight text-[#031F82] sm:text-2xl"
      >
        Don&apos;t lose your badges!
      </h2>
      <p className="mt-3 font-sans text-sm leading-relaxed text-[#1E3A5F]">
        Create your profile to save your points, streaks, and achievements.
      </p>

      <Link
        href={ONBOARDING_SIGN_UP_PATH}
        onClick={onClose}
        className={cn("mt-5", orangeCtaClass)}
      >
        Save My Progress
      </Link>

      {parentEmail ? (
        <p className="mt-4 font-sans text-xs leading-relaxed text-[#1E3A5F]">
          Playing on a new device? Remind your parent or guardian to check their
          inbox ({parentEmail}) to save your progress across multiple devices
          and unlock other app features!
        </p>
      ) : null}

      <button
        type="button"
        onClick={onClose}
        className="mt-3 w-full rounded-nga-lg px-4 py-2 font-heading text-sm font-bold text-[#0CC1E0] transition-colors hover:bg-[#BDE9FB]/40"
      >
        Keep exploring in Guest Mode
      </button>
    </ModalShell>
  );
}
