import { cn } from "@/lib/utils/cn";
import {
  getMasteryCohortFromBirthYear,
  masteryCohortAgeRangeLabel,
  masteryCohortLabel,
  type MasteryCohort,
} from "@/lib/dashboard/mastery-cohort";

type LockedBirthYearSummaryProps = {
  birthYear: number;
  ageTier?: MasteryCohort;
  className?: string;
  /** Signup - cohort track summary for the learner. */
  signup?: boolean;
  /** Parent consent - cohort track summary for the parent/guardian. */
  parentConsent?: boolean;
};

export function LockedBirthYearSummary({
  birthYear,
  ageTier,
  className,
  signup = false,
  parentConsent = false,
}: LockedBirthYearSummaryProps) {
  const tier = ageTier ?? getMasteryCohortFromBirthYear(birthYear);
  const tierLabel = masteryCohortLabel(tier);
  const cohortBoxClass = cn(
    "rounded-nga-lg border-2 border-nga-panel bg-nga-mist/40 px-4 py-4",
    className,
  );
  const cohortTitleClass =
    "text-center font-heading text-lg font-bold text-nga-primary sm:text-xl";

  if (parentConsent) {
    return (
      <div className={cohortBoxClass}>
        <p className={cohortTitleClass}>{tierLabel}</p>
        <p className="mt-3 font-sans text-sm leading-relaxed text-nga-slate">
          Your child has been entered into the track for kids aged{" "}
          {masteryCohortAgeRangeLabel(tier)}. You can change this in the
          Settings section of the app.
        </p>
      </div>
    );
  }

  if (signup) {
    return (
      <div className={cn("text-center", className)}>
        <p className="font-heading text-xl font-bold text-nga-primary sm:text-2xl">
          {tierLabel}
        </p>
        <p className="mt-2 font-sans text-base leading-relaxed text-nga-slate sm:text-lg">
          {tier === "explorer"
            ? "For learners aged 12 and under"
            : `For learners aged ${masteryCohortAgeRangeLabel(tier)}`}
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-nga-lg border-2 border-nga-panel bg-nga-mist/40 px-4 py-3",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="font-heading text-sm font-bold text-nga-primary">
            Birth year
          </p>
          <p className="font-sans text-base font-semibold text-nga-ink">
            {birthYear}
          </p>
          <p className="font-sans text-sm text-nga-slate">
            You&apos;re on the{" "}
            <span className="font-semibold text-nga-primary">{tierLabel}</span>{" "}
            track. Finn locked this in to keep your experience safe and
            age-matched.
          </p>
        </div>
        <span
          className="shrink-0 rounded-full bg-white px-2.5 py-1 font-heading text-[10px] font-bold uppercase tracking-wide text-nga-secondary"
          aria-hidden
        >
          Locked
        </span>
      </div>
    </div>
  );
}
