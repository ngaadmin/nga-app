import { formatLessonBronzeSkillLine } from "@/lib/dashboard/skill-trophies";

type LessonCompletionPaneProps = {
  xpReward: number;
  perfectStreakBonus: number;
  perfectStreak: boolean;
  achievementSkillId: string;
};

export function LessonCompletionPane({
  xpReward,
  perfectStreakBonus,
  perfectStreak,
  achievementSkillId,
}: LessonCompletionPaneProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center text-center">
      <p className="font-heading text-xl font-extrabold uppercase tracking-wide text-[#031F82]">
        Lesson Complete!
      </p>

      <p className="mt-8 font-heading text-base font-extrabold text-[#FFA503]">
        Points Awarded: {xpReward} XP
      </p>
      {perfectStreak ? (
        <p className="mt-2 font-heading text-sm font-extrabold text-[#22C55E]">
          +{perfectStreakBonus} XP Perfect Streak Bonus
        </p>
      ) : null}

      <p className="mt-10 text-4xl" aria-hidden>
        🥉
      </p>
      <p className="mt-3 font-heading text-sm font-extrabold text-[#031F82]">
        {formatLessonBronzeSkillLine(achievementSkillId)}
      </p>
    </div>
  );
}
