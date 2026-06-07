import { copyMatrix } from "@/constants/copyMatrix";
import { ShieldIcon } from "@/lib/dashboard/icons";

type SafeguardShieldCardProps = {
  streakFreezes: number;
};

export function SafeguardShieldCard({ streakFreezes }: SafeguardShieldCardProps) {
  const copy = copyMatrix.home.shield;

  return (
    <div className="rounded-nga-lg border-2 border-nga-secondary/30 border-b-4 border-b-nga-secondary-shadow bg-white p-4 shadow-nga-card">
      <div className="flex items-center gap-2">
        <ShieldIcon className="size-6 shrink-0 text-nga-secondary" />
        <span className="font-heading text-xs font-bold text-nga-slate sm:text-sm">
          {copy.label}
        </span>
      </div>
      <p className="mt-2 font-heading text-base font-extrabold leading-tight text-nga-primary sm:text-lg">
        {streakFreezes} {copy.activeLabel}
      </p>
    </div>
  );
}
