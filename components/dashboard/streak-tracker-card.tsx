import { copyMatrix } from "@/constants/copyMatrix";
import { FlameIcon } from "@/lib/dashboard/icons";

type StreakTrackerCardProps = {
  dayStreak: number;
};

export function StreakTrackerCard({ dayStreak }: StreakTrackerCardProps) {
  const copy = copyMatrix.home.streak;

  return (
    <div className="rounded-nga-lg border-2 border-nga-cta/30 border-b-4 border-b-nga-cta-shadow bg-white p-4 shadow-nga-card">
      <div className="flex items-center gap-2">
        <FlameIcon className="size-6 shrink-0 text-nga-cta" />
        <span className="font-heading text-xs font-bold text-nga-slate sm:text-sm">
          {copy.label}
        </span>
      </div>
      <p className="mt-2 font-heading text-2xl font-extrabold text-nga-primary">
        {dayStreak}
        <span className="ml-1 text-sm font-bold text-nga-slate">{copy.unit}</span>
      </p>
    </div>
  );
}
