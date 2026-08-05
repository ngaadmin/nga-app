"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ModalShell } from "@/components/ui/modal-shell";
import { copyMatrix } from "@/constants/copyMatrix";
import {
  getMasteryCohortFromBirthYear,
  masteryCohortAgeRangeLabel,
  masteryCohortLabel,
} from "@/lib/dashboard/mastery-cohort";
import { useUserSession } from "@/lib/dashboard/use-user-session";
import { getYouthBirthYears } from "@/lib/onboarding/birth-years";
import { updateUserBirthYear } from "@/lib/onboarding/guest-session";
import { cn } from "@/lib/utils/cn";

const orangeCtaClass =
  "rounded-nga-lg border-b-4 border-[#C88202] bg-[#FFA503] font-heading text-sm font-bold uppercase tracking-wide text-[#031F82] transition-all hover:brightness-[1.02] active:translate-y-[2px] active:border-b-2 disabled:cursor-not-allowed disabled:opacity-40 disabled:active:translate-y-0";

const fieldClass =
  "w-full appearance-none rounded-xl border-2 border-[#BDE9FB] bg-[#F7FBFF] px-4 py-2.5 font-heading text-sm font-bold text-[#031F82] outline-none focus:border-[#0CC1E0]";

type TrackPreviewProps = {
  label: string;
  birthYear: number;
};

function TrackPreview({ label, birthYear }: TrackPreviewProps) {
  const cohort = getMasteryCohortFromBirthYear(birthYear);
  const trackLabel = masteryCohortLabel(cohort);
  const ageRange = masteryCohortAgeRangeLabel(cohort);

  return (
    <div className="rounded-xl border-2 border-[#BDE9FB]/70 bg-[#F7FBFF] px-3 py-3">
      <p className="font-heading text-[10px] font-bold uppercase tracking-wide text-[#1E3A5F]/60">
        {label}
      </p>
      <p className="mt-1 font-heading text-base font-extrabold text-[#031F82]">
        {trackLabel}
      </p>
      <p className="mt-0.5 font-sans text-xs text-[#1E3A5F]/75">
        Born {birthYear} · Ages {ageRange}
      </p>
    </div>
  );
}

type BirthYearSettingsModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function BirthYearSettingsModal({
  isOpen,
  onClose,
}: BirthYearSettingsModalProps) {
  const router = useRouter();
  const session = useUserSession();
  const copy = copyMatrix.dashboard.settings.birthYear;

  const birthYears = useMemo(() => getYouthBirthYears(), []);
  const fallbackBirthYear =
    birthYears[0] ?? new Date().getFullYear() - 12;
  const currentBirthYear = session?.birthYear ?? fallbackBirthYear;

  const [selectedYear, setSelectedYear] = useState(String(currentBirthYear));
  const [error, setError] = useState<string | null>(null);
  const [savedModalOpen, setSavedModalOpen] = useState(false);
  const [savedTrackLabel, setSavedTrackLabel] = useState("");
  const [savedAgeRange, setSavedAgeRange] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setSelectedYear(String(session?.birthYear ?? fallbackBirthYear));
    setError(null);
  }, [isOpen, session?.birthYear, fallbackBirthYear]);

  const parsedYear = Number(selectedYear);
  const hasValidSelection =
    Number.isInteger(parsedYear) && birthYears.includes(parsedYear);
  const isUnchanged = hasValidSelection && parsedYear === currentBirthYear;

  function handleClose() {
    setError(null);
    onClose();
  }

  function handleSave() {
    if (!hasValidSelection) {
      setError(copy.invalidYear);
      return;
    }
    if (parsedYear === currentBirthYear) {
      setError(copy.unchanged);
      return;
    }

    const updated = updateUserBirthYear(parsedYear);
    if (!updated) {
      setError(copy.invalidYear);
      return;
    }

    const cohort = getMasteryCohortFromBirthYear(parsedYear);
    setSavedTrackLabel(masteryCohortLabel(cohort));
    setSavedAgeRange(masteryCohortAgeRangeLabel(cohort));
    handleClose();
    setSavedModalOpen(true);
    router.refresh();
  }

  const savedBody = copy.savedBodyTemplate
    .replace("{track}", savedTrackLabel)
    .replace("{range}", savedAgeRange);

  if (!isOpen && !savedModalOpen) return null;

  return (
    <>
      <ModalShell
        isOpen={isOpen}
        onClose={handleClose}
        layer="toast"
        labelledBy="birth-year-settings-title"
        backdropClassName="bg-[#031F82]/55"
        panelClassName="rounded-2xl border-0 bg-white p-5 shadow-md"
      >
        <h2
          id="birth-year-settings-title"
          className="font-heading text-lg font-extrabold text-[#031F82]"
        >
          {copy.modalTitle}
        </h2>
        <p className="mt-2 font-sans text-sm leading-relaxed text-[#1E3A5F]">
          {copy.modalBody}
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <TrackPreview label={copy.currentTrackLabel} birthYear={currentBirthYear} />
          {hasValidSelection && !isUnchanged ? (
            <TrackPreview label={copy.newTrackLabel} birthYear={parsedYear} />
          ) : (
            <div
              className="rounded-xl border-2 border-dashed border-[#BDE9FB]/70 bg-white px-3 py-3"
              aria-hidden
            >
              <p className="font-heading text-[10px] font-bold uppercase tracking-wide text-[#1E3A5F]/40">
                {copy.newTrackLabel}
              </p>
              <p className="mt-2 font-sans text-xs text-[#1E3A5F]/50">
                Pick a new year to preview the track.
              </p>
            </div>
          )}
        </div>

        <div className="mt-4 space-y-2">
          <label
            htmlFor="settings-birth-year"
            className="block font-heading text-sm font-bold text-[#031F82]"
          >
            {copy.birthYearLabel}
          </label>
          <div className="relative">
            <select
              id="settings-birth-year"
              value={selectedYear}
              onChange={(event) => {
                setSelectedYear(event.target.value);
                setError(null);
              }}
              className={cn(fieldClass, "pr-10")}
            >
              {birthYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            <span
              className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-[#0CC1E0]"
              aria-hidden
            >
              ▾
            </span>
          </div>
          {error ? (
            <p className="font-sans text-sm font-medium text-red-600" role="alert">
              {error}
            </p>
          ) : null}
        </div>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row-reverse">
          <button
            type="button"
            onClick={handleSave}
            disabled={!hasValidSelection || isUnchanged}
            className={cn(orangeCtaClass, "px-4 py-2.5 sm:flex-1")}
          >
            {copy.save}
          </button>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-nga-lg border-2 border-[#BDE9FB] px-4 py-2.5 font-heading text-sm font-bold text-[#031F82] transition-colors hover:bg-[#BDE9FB]/20 sm:flex-1"
          >
            {copy.cancel}
          </button>
        </div>
      </ModalShell>

      <ModalShell
        isOpen={savedModalOpen}
        onClose={() => setSavedModalOpen(false)}
        layer="toast"
        labelledBy="birth-year-saved-title"
        backdropClassName="bg-[#031F82]/55"
        panelClassName="rounded-2xl border-0 bg-white p-5 shadow-md"
      >
        <h2
          id="birth-year-saved-title"
          className="font-heading text-lg font-extrabold text-[#031F82]"
        >
          {copy.savedTitle}
        </h2>
        <p className="mt-2 font-sans text-sm leading-relaxed text-[#1E3A5F]">
          {savedBody}
        </p>
        <button
          type="button"
          onClick={() => setSavedModalOpen(false)}
          className={cn(orangeCtaClass, "mt-5 w-full px-4 py-2.5")}
        >
          {copy.savedAcknowledge}
        </button>
      </ModalShell>
    </>
  );
}
