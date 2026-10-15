"use client";

import {
  MASTERY_COHORT_ORDER,
  masteryCohortAgeRangeLabel,
  masteryCohortLabel,
  type MasteryCohort,
} from "@/lib/dashboard/mastery-cohort";
import { cn } from "@/lib/utils/cn";

type CohortTrackFieldProps = {
  value: MasteryCohort | null;
  onChange: (cohort: MasteryCohort) => void;
  error?: string;
  /** Defaults to the learner sign-up label. */
  legend?: string;
  /** When set, replaces the learner helper for both empty and chosen states. */
  hint?: string;
};

/**
 * Shared cohort choices. Learner sign-up keeps the default label and helper.
 * Teacher sign-up passes its own class copy.
 */
export function CohortTrackField({
  value,
  onChange,
  error,
  legend = "Your learning track",
  hint,
}: CohortTrackFieldProps) {
  const helper =
    hint ??
    (value
      ? "This track is already chosen. You can change it."
      : "Pick a track. You can change it later.");

  return (
    <fieldset className="space-y-2">
      <legend className="block font-heading text-sm font-bold text-nga-primary">
        {legend}
      </legend>
      <p className="font-sans text-sm text-nga-slate">{helper}</p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {MASTERY_COHORT_ORDER.map((track) => {
          const selected = value === track;
          return (
            <button
              key={track}
              type="button"
              onClick={() => onChange(track)}
              aria-pressed={selected}
              className={cn(
                "rounded-nga-lg border-2 px-3 py-3 text-center transition-colors",
                selected
                  ? "border-nga-secondary bg-nga-mist/60"
                  : "border-[#E5E5E5] bg-[#F7F7F7] hover:border-nga-secondary/50",
              )}
            >
              <span className="block font-heading text-sm font-extrabold text-nga-primary">
                {masteryCohortLabel(track)}
              </span>
              <span className="mt-0.5 block font-sans text-xs font-semibold text-nga-slate">
                Ages {masteryCohortAgeRangeLabel(track)}
              </span>
            </button>
          );
        })}
      </div>
      {error ? (
        <p className="font-sans text-sm font-medium text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
