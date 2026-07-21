import { cn } from "@/lib/utils/cn";
import {
  getMasteryCohortFromBirthYear,
  masteryCohortLabel,
  type MasteryCohort,
} from "@/lib/dashboard/mastery-cohort";

type LockedBirthYearSummaryProps = {
  birthYear: number;
  ageTier?: MasteryCohort;
  className?: string;
};

export function LockedBirthYearSummary({
  birthYear,
  ageTier,
  className,
}: LockedBirthYearSummaryProps) {
  const tier = ageTier ?? getMasteryCohortFromBirthYear(birthYear);
  const tierLabel = masteryCohortLabel(tier);

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
