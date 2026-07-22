import {
  formatLessonSkillUnlockLine,
} from "@/lib/dashboard/skill-trophies";
import type { SkillTrophyTier } from "@/lib/dashboard/skill-trophies";
import { getSkillRegistryRecord } from "@/lib/skills/skills-registry";
import { cn } from "@/lib/utils/cn";

type LessonCompletionPaneProps = {
  xpReward: number;
  perfectStreakBonus: number;
  perfectStreak: boolean;
  achievementSkillId: string;
  skillMedalTier: Extract<SkillTrophyTier, "unlocked" | "bronze"> | null;
};

export function LessonCompletionPane({
  xpReward,
  perfectStreakBonus,
  perfectStreak,
  achievementSkillId,
  skillMedalTier,
}: LessonCompletionPaneProps) {
  if (!skillMedalTier) {
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
      </div>
    );
  }

  const registrySkill = getSkillRegistryRecord(achievementSkillId);
  const medalEmoji = registrySkill?.medalEmoji ?? "🏅";

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

      {skillMedalTier === "bronze" ? (
        <p className="mt-10 text-4xl" aria-hidden>
          🥉
        </p>
      ) : (
        <div
          className={cn(
            "mt-10 flex size-16 items-center justify-center rounded-full",
            "border-2 border-[#031F82] bg-white shadow-[0_2px_8px_rgba(3,31,130,0.12)]",
          )}
          aria-hidden
        >
          <span className="text-3xl leading-none">{medalEmoji}</span>
        </div>
      )}

      <p className="mt-3 font-heading text-sm font-extrabold text-[#031F82]">
        {formatLessonSkillUnlockLine(achievementSkillId, skillMedalTier)}
      </p>
    </div>
  );
}
