import { cn } from "@/lib/utils/cn";

type OnboardingProgressProps = {
  /** 0–100 */
  value: number;
  className?: string;
};

export function OnboardingProgress({
  value,
  className,
}: OnboardingProgressProps) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div
      className={cn("h-2 w-full overflow-hidden rounded-full bg-nga-panel", className)}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Onboarding progress"
    >
      <div
        className="h-full rounded-full bg-nga-secondary transition-[width] duration-300 ease-out"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
