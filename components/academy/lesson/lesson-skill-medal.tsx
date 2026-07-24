import { SkillMedalReliefIcon } from "@/components/academy/lesson/skill-medal-icons";
import { cn } from "@/lib/utils/cn";
import type { SkillTrophyTier } from "@/lib/dashboard/skill-trophies";

type LessonSkillMedalProps = {
  skillSlug: string;
  tier: Extract<SkillTrophyTier, "unlocked" | "bronze">;
  label?: string;
  className?: string;
};

/**
 * Coin-style skill medal with embossed vector relief icon.
 */
export function LessonSkillMedal({
  skillSlug,
  tier,
  label,
  className,
}: LessonSkillMedalProps) {
  const isBronze = tier === "bronze";

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div
        className={cn(
          "lesson-skill-medal__coin",
          isBronze
            ? "lesson-skill-medal__coin--bronze"
            : "lesson-skill-medal__coin--unlocked",
        )}
        aria-hidden
      >
        <div className="lesson-skill-medal__rim" />
        <div className="lesson-skill-medal__field" />
        <div className="lesson-skill-medal__relief">
          <SkillMedalReliefIcon skillSlug={skillSlug} tier={tier} />
        </div>
      </div>
      {label ? (
        <p className="mt-4 max-w-[14rem] font-heading text-base font-semibold text-[#031F82] sm:text-lg">
          {label}
        </p>
      ) : null}
    </div>
  );
}
