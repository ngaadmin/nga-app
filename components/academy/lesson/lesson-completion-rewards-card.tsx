import { cn } from "@/lib/utils/cn";

type LessonCompletionRewardsCardProps = {
  xpReward: number;
  perfectStreakBonus: number;
  perfectStreak: boolean;
  className?: string;
};

/** Grouped XP summary for Screen 8. */
export function LessonCompletionRewardsCard({
  xpReward,
  perfectStreakBonus,
  perfectStreak,
  className,
}: LessonCompletionRewardsCardProps) {
  return (
    <div className={cn("mt-2", className)}>
      <p className="font-heading text-[22px] font-bold tabular-nums text-[#031F82]">
        +{xpReward} points
      </p>
      {perfectStreak && perfectStreakBonus > 0 ? (
        <p className="mt-2.5 font-sans text-[15px] font-bold text-[#031F82]">
          Perfect lesson: +{perfectStreakBonus}
        </p>
      ) : null}
    </div>
  );
}
