import { LessonSkillMedal } from "@/components/academy/lesson/lesson-skill-medal";
import {
  formatLessonSkillUnlockLine,
} from "@/lib/dashboard/skill-trophies";
import type { MedalIllustrationId } from "@/lib/academy/illustrations/medal-registry";
import type { SkillTrophyTier } from "@/lib/dashboard/skill-trophies";

type LessonCompletionPaneProps = {
  xpReward: number;
  perfectStreakBonus: number;
  perfectStreak: boolean;
  achievementSkillId: string;
  skillMedalTier: Extract<SkillTrophyTier, "unlocked" | "bronze"> | null;
  medalId?: MedalIllustrationId;
};

export function LessonCompletionPane({
  xpReward,
  perfectStreakBonus,
  perfectStreak,
  achievementSkillId,
  skillMedalTier,
  medalId,
}: LessonCompletionPaneProps) {
  if (!skillMedalTier) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <p className="font-heading text-xl font-semibold uppercase tracking-wide text-[#031F82]">
          Lesson Complete!
        </p>
        <p className="mt-8 font-heading text-base font-extrabold text-[#FFA503]">
          Points Awarded: {xpReward} XP
        </p>
        {perfectStreak ? (
          <p className="mt-2 font-heading text-base font-extrabold text-[#22C55E]">
            +{perfectStreakBonus} XP Perfect Streak Bonus
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center text-center">
      <p className="font-heading text-xl font-extrabold uppercase tracking-wide text-[#031F82]">
        Lesson Complete!
      </p>

      <p className="mt-8 font-heading text-base font-extrabold text-[#FFA503]">
        Points Awarded: {xpReward} XP
      </p>
      {perfectStreak ? (
        <p className="mt-2 font-heading text-base font-extrabold text-[#22C55E]">
          +{perfectStreakBonus} XP Perfect Streak Bonus
        </p>
      ) : null}

      <div className="mt-10">
        <LessonSkillMedal
          skillSlug={achievementSkillId}
          tier={skillMedalTier}
          medalId={medalId}
        />
      </div>

      <p className="mt-4 font-heading text-base font-extrabold text-[#031F82]">
        {formatLessonSkillUnlockLine(achievementSkillId, skillMedalTier)}
      </p>
    </div>
  );
}
