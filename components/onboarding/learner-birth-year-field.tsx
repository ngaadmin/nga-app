"use client";

import {
  BIRTH_YEAR_HELPER,
  BIRTH_YEAR_PROMPT,
  birthYearOptions,
} from "@/lib/onboarding/signup-age-check";
import { cn } from "@/lib/utils/cn";

export const learnerFieldClass =
  "h-[52px] w-full rounded-2xl border-0 bg-[#EDF5FF] px-4 font-sans text-base text-nga-ink outline-none placeholder:text-nga-slate/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nga-secondary";

type LearnerBirthYearFieldProps = {
  value: number | null;
  onChange: (year: number | null) => void;
  error?: string;
  fitMessage?: string | null;
};

export function LearnerBirthYearField({
  value,
  onChange,
  error,
  fitMessage,
}: LearnerBirthYearFieldProps) {
  return (
    <div className="space-y-2">
      <label
        htmlFor="signup-birth-year"
        className="block font-heading text-sm font-bold text-nga-primary"
      >
        {BIRTH_YEAR_PROMPT}
      </label>
      <p id="signup-birth-year-help" className="font-sans text-sm text-nga-slate">
        {BIRTH_YEAR_HELPER}
      </p>
      <select
        id="signup-birth-year"
        value={value ?? ""}
        required
        autoComplete="off"
        onChange={(event) => {
          const nextYear = Number(event.target.value);
          onChange(Number.isInteger(nextYear) && event.target.value !== "" ? nextYear : null);
        }}
        aria-invalid={Boolean(error)}
        aria-describedby="signup-birth-year-help"
        className={cn(learnerFieldClass, "pr-8")}
      >
        <option value="">Select a year</option>
        {birthYearOptions().map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </select>
      {fitMessage ? (
        <p className="font-sans text-sm font-medium text-[#031F82]" role="status">
          {fitMessage}
        </p>
      ) : null}
      {error ? (
        <p className="font-sans text-sm font-medium text-[#031F82]" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
