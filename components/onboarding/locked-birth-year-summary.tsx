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
};

export function LockedBirthYearSummary({
  birthYear,
  ageTier,
  className,
}: LockedBirthYearSummaryProps) {
  const tier = ageTier ?? getMasteryCohortFromBirthYear(birthYear);
  const tierLabel = masteryCohortLabel(tier);

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
