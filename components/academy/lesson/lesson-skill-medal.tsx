import { SkillMedalVisual } from "@/components/academy/skill-medal-visual";
import type { MedalIllustrationId } from "@/lib/academy/illustrations/medal-registry";
import { getSkillRegistryRecord } from "@/lib/skills/skills-registry";
import {
  lessonCompletionHeroMedalClass,
} from "@/components/academy/lesson/lesson-shared-styles";
import { cn } from "@/lib/utils/cn";
import type { SkillTrophyTier } from "@/lib/dashboard/skill-trophies";

type LessonSkillMedalProps = {
  skillSlug: string;
  tier: Extract<SkillTrophyTier, "unlocked" | "bronze">;
  /** Kept for lesson configs; art is resolved from skill number + tier. */
  medalId?: MedalIllustrationId;
  label?: string;
  className?: string;
  size?: "default" | "hero";
};

/**
 * Skill medal — real webp when available, flat placeholder otherwise.
 */
export function LessonSkillMedal({
  skillSlug,
  tier,
  label,
  className,
  size = "default",
}: LessonSkillMedalProps) {
  const skill = getSkillRegistryRecord(skillSlug);
  const skillNumber = skill?.skillNumber ?? 0;
  const skillName = skill?.skillName ?? "Skill medal";

  return (
    <div
      className={cn(
        "flex flex-col items-center",
        size === "hero" && lessonCompletionHeroMedalClass,
        className,
      )}
    >
      <SkillMedalVisual
        skillNumber={skillNumber}
        skillName={skillName}
        tier={tier}
        size={size === "hero" ? "hero" : "sm"}
      />
      {label ? (
        <p className="mt-4 max-w-[14rem] font-heading text-base font-semibold text-[#031F82] sm:text-lg">
          {label}
        </p>
      ) : null}
    </div>
  );
}
