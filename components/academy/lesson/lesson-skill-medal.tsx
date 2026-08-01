import {
  getMedalIllustrationPath,
  medalIdForSkillNumber,
  type MedalIllustrationId,
} from "@/lib/academy/illustrations/medal-registry";
import { SkillMedalReliefIcon } from "@/components/academy/lesson/skill-medal-icons";
import { getSkillRegistryRecord } from "@/lib/skills/skills-registry";
import { cn } from "@/lib/utils/cn";
import type { SkillTrophyTier } from "@/lib/dashboard/skill-trophies";

type LessonSkillMedalProps = {
  skillSlug: string;
  tier: Extract<SkillTrophyTier, "unlocked" | "bronze">;
  medalId?: MedalIllustrationId;
  label?: string;
  className?: string;
};

const lessonSkillMedalImageClass =
  "block h-auto max-h-[8rem] w-full max-w-[8rem] border-0 bg-transparent object-contain object-center shadow-none";

function resolveMedalId(
  skillSlug: string,
  tier: Extract<SkillTrophyTier, "unlocked" | "bronze">,
  medalId?: MedalIllustrationId,
): MedalIllustrationId | undefined {
  if (medalId) {
    return medalId;
  }

  const skillNumber = getSkillRegistryRecord(skillSlug)?.skillNumber;
  if (!skillNumber) {
    return undefined;
  }

  return medalIdForSkillNumber(skillNumber, tier);
}

/**
 * Skill medal — registry webp when available, vector coin fallback otherwise.
 */
export function LessonSkillMedal({
  skillSlug,
  tier,
  medalId,
  label,
  className,
}: LessonSkillMedalProps) {
  const resolvedMedalId = resolveMedalId(skillSlug, tier, medalId);
  const medalSrc = resolvedMedalId
    ? getMedalIllustrationPath(resolvedMedalId)
    : undefined;
  const isBronze = tier === "bronze";
  const skillName = getSkillRegistryRecord(skillSlug)?.skillName ?? "Skill medal";

  if (medalSrc) {
    return (
      <div className={cn("flex flex-col items-center", className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={medalSrc}
          alt={`${skillName} ${isBronze ? "bronze" : "unlocked"} medal`}
          className={lessonSkillMedalImageClass}
          decoding="async"
          loading="eager"
        />
        {label ? (
          <p className="mt-4 max-w-[14rem] font-heading text-base font-semibold text-[#031F82] sm:text-lg">
            {label}
          </p>
        ) : null}
      </div>
    );
  }

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
