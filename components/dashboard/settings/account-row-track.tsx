"use client";

import { useState } from "react";
import Image from "next/image";
import { ModalShell } from "@/components/ui/modal-shell";
import { copyMatrix } from "@/constants/copyMatrix";
import {
  MASTERY_COHORT_ORDER,
  masteryCohortAgeRangeLabel,
  masteryCohortLabel,
  type MasteryCohort,
} from "@/lib/dashboard/mastery-cohort";
import {
  changeLinkedChildLearningTrack,
  displayAccountLearningTrack,
} from "@/lib/onboarding/change-learning-track";
import type { UserSession } from "@/lib/onboarding/guest-session";
import { cn } from "@/lib/utils/cn";

const TRACK_AVATAR_SRC: Record<MasteryCohort, string> = {
  explorer: "/assets/illustrations/website/Avatars/Avatar_Explorer.webp",
  pathfinder: "/assets/illustrations/website/Avatars/Avatar_Pathfinder.webp",
  maverick: "/assets/illustrations/website/Avatars/Avatar_Maverick.webp",
};

const confirmCtaClass =
  "rounded-nga-lg border-b-4 border-[#C88202] bg-[#FFA503] font-heading text-sm font-bold uppercase tracking-wide text-[#031F82] transition-all hover:brightness-[1.02] active:translate-y-[2px] active:border-b-2";

type AccountRowTrackProps = {
  account: UserSession;
  canChange: boolean;
};

export function AccountRowTrack({ account, canChange }: AccountRowTrackProps) {
  const copy = copyMatrix.dashboard.settings.accountSubscription;
  const trackCopy = copyMatrix.dashboard.settings.learningTrack;
  const current = displayAccountLearningTrack(account);
  const [open, setOpen] = useState(false);
  const [pendingCohort, setPendingCohort] = useState<MasteryCohort | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  function handleSelect(cohort: MasteryCohort) {
    if (!canChange || cohort === current) return;
    setError(null);
    setPendingCohort(cohort);
  }

  function closeConfirm() {
    if (isSaving) return;
    setPendingCohort(null);
  }

  async function confirmChange() {
    if (!pendingCohort || isSaving) return;
    setIsSaving(true);
    try {
      const result = await changeLinkedChildLearningTrack(
        account,
        pendingCohort,
      );
      if (!result.ok) {
        setError(
          result.reason === "unchanged"
            ? trackCopy.unchanged
            : copy.changeTrackError,
        );
        setPendingCohort(null);
        return;
      }
      setError(null);
      setPendingCohort(null);
      setOpen(false);
    } catch {
      setError(copy.changeTrackError);
      setPendingCohort(null);
    } finally {
      setIsSaving(false);
    }
  }

  const pendingLabel = pendingCohort ? masteryCohortLabel(pendingCohort) : "";

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <div className="inline-flex h-11 w-56 shrink-0 items-center gap-2.5 rounded-xl border-2 border-[#0CC1E0]/45 bg-[#BDE9FB]/20 px-3">
          <span className="relative size-8 shrink-0">
            <Image
              src={TRACK_AVATAR_SRC[current]}
              alt=""
              fill
              sizes="32px"
              className="object-contain"
              unoptimized
            />
          </span>
          <p className="whitespace-nowrap font-heading text-sm font-extrabold leading-none text-[#031F82]">
            {masteryCohortLabel(current)} · Ages{" "}
            {masteryCohortAgeRangeLabel(current)}
          </p>
        </div>
        {canChange ? (
          <button
            type="button"
            className="shrink-0 font-sans text-xs font-semibold text-[#0CC1E0] underline underline-offset-2"
            aria-expanded={open}
            onClick={() => {
              setError(null);
              setOpen((value) => !value);
            }}
          >
            {open ? copy.changeTrackClose : copy.changeTrack}
          </button>
        ) : null}
      </div>

      {open && canChange ? (
        <div className="grid grid-cols-3 gap-2">
          {MASTERY_COHORT_ORDER.map((cohort) => {
            const selected = cohort === current;
            return (
              <button
                key={cohort}
                type="button"
                aria-pressed={selected}
                onClick={() => handleSelect(cohort)}
                className={cn(
                  "flex flex-col items-center rounded-xl border-2 px-1.5 py-2 text-center transition-colors",
                  selected
                    ? "border-[#0CC1E0] bg-[#BDE9FB]/25"
                    : "border-[#BDE9FB]/70 bg-white hover:border-[#0CC1E0]/50",
                )}
              >
                <span className="relative h-12 w-12">
                  <Image
                    src={TRACK_AVATAR_SRC[cohort]}
                    alt=""
                    fill
                    sizes="48px"
                    className="object-contain"
                    unoptimized
                  />
                </span>
                <span className="mt-1 font-heading text-[11px] font-extrabold leading-tight text-[#031F82]">
                  {masteryCohortLabel(cohort)}
                </span>
                <span className="mt-0.5 font-sans text-[10px] font-semibold leading-tight text-[#1E3A5F]/80">
                  Ages {masteryCohortAgeRangeLabel(cohort)}
                </span>
                {selected ? (
                  <span className="mt-1 font-heading text-[9px] font-bold uppercase tracking-wide text-[#0CC1E0]">
                    {trackCopy.currentBadge}
                  </span>
                ) : (
                  <span className="mt-1 h-3" aria-hidden />
                )}
              </button>
            );
          })}
        </div>
      ) : null}

      {error ? (
        <p className="font-sans text-xs font-medium text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      <ModalShell
        isOpen={pendingCohort !== null}
        onClose={closeConfirm}
        role="alertdialog"
        align="center"
        labelledBy="change-track-title"
        describedBy="change-track-body"
        dismissOnBackdrop={!isSaving}
        backdropClassName="bg-[#031F82]/55"
        panelClassName="max-w-sm rounded-2xl border-0 bg-white p-5 shadow-md"
      >
        <h2
          id="change-track-title"
          className="font-heading text-lg font-extrabold text-[#031F82]"
        >
          {copy.changeTrackConfirmTitle}
        </h2>
        <div id="change-track-body" className="mt-2 space-y-2">
          <p className="font-sans text-sm leading-snug text-[#1E3A5F]">
            {copy.changeTrackConfirmSwitch
              .replace("{username}", account.username)
              .replace("{track}", pendingLabel)}
          </p>
          <p className="font-sans text-sm leading-snug text-[#1E3A5F]">
            {copy.changeTrackConfirmReset}
          </p>
          <p className="font-sans text-sm leading-snug text-[#1E3A5F]">
            {copy.changeTrackConfirmAge}
          </p>
        </div>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={closeConfirm}
            disabled={isSaving}
            className="flex-1 py-2 font-heading text-sm font-bold text-[#0CC1E0] disabled:opacity-40"
          >
            {copy.changeTrackCancelAction}
          </button>
          <button
            type="button"
            onClick={() => void confirmChange()}
            disabled={isSaving}
            className={cn("flex-1 px-3 py-2", confirmCtaClass)}
          >
            {copy.changeTrackConfirmAction}
          </button>
        </div>
      </ModalShell>
    </div>
  );
}
