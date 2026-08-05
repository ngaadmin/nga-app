import { cn } from "@/lib/utils/cn";
import { lessonCompletionRewardsCardClass } from "@/components/academy/lesson/lesson-shared-styles";

type LessonCompletionRewardsCardProps = {
  xpReward: number;
  perfectStreakBonus: number;
  perfectStreak: boolean;
  className?: string;
};

/** Grouped XP summary card for Screen 8. */
export function LessonCompletionRewardsCard({
  xpReward,
  perfectStreakBonus,
  perfectStreak,
  className,
}: LessonCompletionRewardsCardProps) {
  return (
    <div className={cn(lessonCompletionRewardsCardClass, className)}>
      <p className="font-heading text-[10px] font-bold uppercase tracking-[0.14em] text-[#0CC1E0] sm:text-xs">
        Points Earned
      </p>
      <p className="mt-1 font-heading text-2xl font-extrabold tabular-nums leading-none text-[#FFA503] sm:text-3xl">
        {xpReward} XP
      </p>
      {perfectStreak ? (
        <div className="mt-3 inline-flex items-center justify-center rounded-full bg-[#DCFCE7] px-3 py-1.5">
          <span className="font-heading text-sm font-extrabold tabular-nums text-[#15803D]">
            +{perfectStreakBonus} XP Perfect Streak
          </span>
        </div>
      ) : null}
    </div>
  );
}
