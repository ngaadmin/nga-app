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
};

/**
 * First question on learner sign-up. Teacher sign-up uses the same field
 * so both flows ask which cohort the same way.
 */
export function CohortTrackField({
  value,
  onChange,
  error,
}: CohortTrackFieldProps) {
  return (
    <fieldset className="space-y-2">
      <legend className="block font-heading text-sm font-bold text-nga-primary">
        Your learning track
      </legend>
      <p className="font-sans text-sm text-nga-slate">
        {value
          ? "This track is already chosen. You can change it."
          : "Pick a track. You can change it later."}
      </p>
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
