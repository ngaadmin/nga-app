"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ModalShell } from "@/components/ui/modal-shell";
import { copyMatrix } from "@/constants/copyMatrix";
import {
  MASTERY_COHORT,
  MASTERY_COHORT_ORDER,
  getMasteryCohortFromBirthYear,
  masteryCohortAgeRangeLabel,
  masteryCohortLabel,
  totalSkillsToMasterForMasteryCohort,
  type MasteryCohort,
} from "@/lib/dashboard/mastery-cohort";
import { useUserSession } from "@/lib/dashboard/use-user-session";
import { changeUserLearningTrack } from "@/lib/onboarding/change-learning-track";
import {
  getYouthBirthYears,
  getYouthBirthYearsForCohort,
} from "@/lib/onboarding/birth-years";
import { cn } from "@/lib/utils/cn";

const orangeCtaClass =
  "rounded-nga-lg border-b-4 border-[#C88202] bg-[#FFA503] font-heading text-sm font-bold uppercase tracking-wide text-[#031F82] transition-all hover:brightness-[1.02] active:translate-y-[2px] active:border-b-2 disabled:cursor-not-allowed disabled:opacity-40 disabled:active:translate-y-0";

const fieldClass =
  "w-full appearance-none rounded-xl border-2 border-[#BDE9FB] bg-white px-4 py-2.5 font-heading text-sm font-bold text-[#031F82] outline-none focus:border-[#0CC1E0]";

type ParentLearningTrackPanelProps = {
  isEditable: boolean;
};

function TrackCard({
  cohort,
  isCurrent,
  isSelected,
  onSelect,
  disabled,
}: {
  cohort: MasteryCohort;
  isCurrent: boolean;
  isSelected: boolean;
  onSelect: () => void;
  disabled: boolean;
}) {
  const copy = copyMatrix.dashboard.settings.learningTrack;
  const meta = MASTERY_COHORT[cohort];
  const skillCount = totalSkillsToMasterForMasteryCohort(cohort);

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      aria-pressed={isSelected}
      className={cn(
        "rounded-xl border-2 px-3 py-3 text-left transition-all",
        isSelected
          ? "border-[#0CC1E0] bg-[#BDE9FB]/25 shadow-sm"
          : "border-[#BDE9FB]/70 bg-white hover:border-[#0CC1E0]/50",
        disabled && "cursor-default opacity-70",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-heading text-sm font-extrabold text-[#031F82]">{meta.label}</p>
        {isCurrent ? (
          <span className="shrink-0 rounded-full bg-[#22C55E]/15 px-2 py-0.5 font-heading text-[10px] font-bold uppercase tracking-wide text-[#15803D]">
            {copy.currentBadge}
          </span>
        ) : null}
      </div>
      <p className="mt-1 font-sans text-xs text-[#1E3A5F]/80">
        {copy.agesTemplate.replace("{range}", masteryCohortAgeRangeLabel(cohort))}
      </p>
      <p className="mt-0.5 font-sans text-xs font-semibold text-[#0CC1E0]">
        {copy.skillsTemplate.replace("{count}", String(skillCount))}
      </p>
    </button>
  );
}

export function ParentLearningTrackPanel({ isEditable }: ParentLearningTrackPanelProps) {
  const router = useRouter();
  const session = useUserSession();
  const copy = copyMatrix.dashboard.settings.learningTrack;

  const birthYears = useMemo(() => getYouthBirthYears(), []);
  const fallbackBirthYear = birthYears[0] ?? new Date().getFullYear() - 12;
  const currentBirthYear = session?.birthYear ?? fallbackBirthYear;
  const currentCohort = getMasteryCohortFromBirthYear(currentBirthYear);

  const [selectedYear, setSelectedYear] = useState(String(currentBirthYear));
  const [focusedCohort, setFocusedCohort] = useState<MasteryCohort>(currentCohort);
  const [error, setError] = useState<string | null>(null);
  const [savedModalOpen, setSavedModalOpen] = useState(false);
  const [savedTrackLabel, setSavedTrackLabel] = useState("");
  const [savedAgeRange, setSavedAgeRange] = useState("");
  const [savedProgressReset, setSavedProgressReset] = useState(false);

  useEffect(() => {
    setSelectedYear(String(session?.birthYear ?? fallbackBirthYear));
    setFocusedCohort(getMasteryCohortFromBirthYear(session?.birthYear ?? fallbackBirthYear));
    setError(null);
  }, [session?.birthYear, fallbackBirthYear]);

  const parsedYear = Number(selectedYear);
  const hasValidSelection =
    Number.isInteger(parsedYear) && birthYears.includes(parsedYear);
  const selectedCohort = hasValidSelection
    ? getMasteryCohortFromBirthYear(parsedYear)
    : currentCohort;
  const isUnchanged = hasValidSelection && parsedYear === currentBirthYear;
  const cohortWouldChange = hasValidSelection && selectedCohort !== currentCohort;

  const cohortBirthYears = useMemo(
    () => getYouthBirthYearsForCohort(focusedCohort),
    [focusedCohort],
  );

  function handleSelectCohort(cohort: MasteryCohort) {
    if (!isEditable) return;
    setFocusedCohort(cohort);
    setError(null);
    const yearsForCohort = getYouthBirthYearsForCohort(cohort);
    const preferredYear =
      cohort === currentCohort && yearsForCohort.includes(currentBirthYear)
        ? currentBirthYear
        : yearsForCohort[0];
    if (preferredYear) setSelectedYear(String(preferredYear));
  }

  function handleSave() {
    if (!hasValidSelection) {
      setError(copy.invalidYear);
      return;
    }

    const result = changeUserLearningTrack(parsedYear);
    if (!result.ok) {
      if (result.reason === "unchanged") setError(copy.unchanged);
      else setError(copy.invalidYear);
      return;
    }

    setSavedTrackLabel(result.trackLabel);
    setSavedAgeRange(result.ageRange);
    setSavedProgressReset(result.cohortChanged);
    setError(null);
    setSavedModalOpen(true);
    router.refresh();
  }

  const savedBody = copy.savedBodyTemplate
    .replace("{track}", savedTrackLabel)
    .replace("{range}", savedAgeRange);

  if (!isEditable) {
    return (
      <div className="min-w-0 space-y-3">
        <p className="font-sans text-xs leading-relaxed text-[#1E3A5F]">{copy.lockedHint}</p>
        <div className="grid gap-2">
          {MASTERY_COHORT_ORDER.map((cohort) => (
            <TrackCard
              key={cohort}
              cohort={cohort}
              isCurrent={cohort === currentCohort}
              isSelected={cohort === currentCohort}
              onSelect={() => {}}
              disabled
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-w-0 space-y-4">
        <p className="font-sans text-xs leading-relaxed text-[#1E3A5F]">{copy.intro}</p>
        <p className="font-sans text-xs leading-relaxed text-[#1E3A5F]">{copy.tierUpdateNote}</p>

        <div className="grid gap-2 sm:grid-cols-3">
          {MASTERY_COHORT_ORDER.map((cohort) => (
            <TrackCard
              key={cohort}
              cohort={cohort}
              isCurrent={cohort === currentCohort}
              isSelected={cohort === selectedCohort}
              onSelect={() => handleSelectCohort(cohort)}
              disabled={false}
            />
          ))}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="parent-hub-birth-year"
            className="block font-heading text-sm font-bold text-[#031F82]"
          >
            {copy.birthYearLabel}
          </label>
          <div className="relative">
            <select
              id="parent-hub-birth-year"
              value={selectedYear}
              onChange={(event) => {
                const nextYear = Number(event.target.value);
                setSelectedYear(event.target.value);
                setFocusedCohort(getMasteryCohortFromBirthYear(nextYear));
                setError(null);
              }}
              className={cn(fieldClass, "pr-10")}
            >
              {(cohortBirthYears.length > 0 ? cohortBirthYears : birthYears).map((year) => (
                <option key={year} value={year}>
                  {year} · {masteryCohortLabel(getMasteryCohortFromBirthYear(year))}
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

        {cohortWouldChange ? (
          <div
            className="rounded-xl border-2 border-[#F59E0B]/40 bg-[#FFFBEB] px-3 py-3"
            role="alert"
          >
            <p className="font-heading text-xs font-extrabold text-[#B45309]">
              {copy.progressResetWarningTitle}
            </p>
            <p className="mt-1 font-sans text-xs leading-relaxed text-[#92400E]">
              {copy.progressResetWarning}
            </p>
          </div>
        ) : null}

        <button
          type="button"
          onClick={handleSave}
          disabled={!hasValidSelection || isUnchanged}
          className={cn(orangeCtaClass, "w-full px-4 py-2.5")}
        >
          {copy.save}
        </button>
      </div>

      <ModalShell
        isOpen={savedModalOpen}
        onClose={() => setSavedModalOpen(false)}
        layer="toast"
        labelledBy="learning-track-saved-title"
        backdropClassName="bg-[#031F82]/55"
        panelClassName="rounded-2xl border-0 bg-white p-5 shadow-md"
      >
        <h2
          id="learning-track-saved-title"
          className="font-heading text-lg font-extrabold text-[#031F82]"
        >
          {copy.savedTitle}
        </h2>
        <p className="mt-2 font-sans text-sm leading-relaxed text-[#1E3A5F]">{savedBody}</p>
        {savedProgressReset ? (
          <p className="mt-2 font-sans text-xs leading-relaxed text-[#92400E]">
            {copy.progressResetConfirmed}
          </p>
        ) : null}
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
