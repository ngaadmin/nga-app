import {
  getMedalIllustrationPath,
  medalIdForSkillNumber,
  type MedalIllustrationId,
} from "@/lib/academy/illustrations/medal-registry";
import { SkillMedalReliefIcon } from "@/components/academy/lesson/skill-medal-icons";
import { getSkillRegistryRecord } from "@/lib/skills/skills-registry";
import {
  lessonCompletionHeroMedalClass,
} from "@/components/academy/lesson/lesson-shared-styles";
import { cn } from "@/lib/utils/cn";
import type { SkillTrophyTier } from "@/lib/dashboard/skill-trophies";

type LessonSkillMedalProps = {
  skillSlug: string;
  tier: Extract<SkillTrophyTier, "unlocked" | "bronze">;
  medalId?: MedalIllustrationId;
  label?: string;
  className?: string;
  size?: "default" | "hero";
};

const lessonSkillMedalImageClassBySize = {
  default:
    "block h-auto max-h-[8rem] w-full max-w-[8rem] border-0 bg-transparent object-contain object-center shadow-none",
  hero: "block h-auto w-full max-w-full border-0 bg-transparent object-contain object-center shadow-none",
} as const;

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
  size = "default",
}: LessonSkillMedalProps) {
  const resolvedMedalId = resolveMedalId(skillSlug, tier, medalId);
  const medalSrc = resolvedMedalId
    ? getMedalIllustrationPath(resolvedMedalId)
    : undefined;
  const isBronze = tier === "bronze";
  const skillName = getSkillRegistryRecord(skillSlug)?.skillName ?? "Skill medal";

  if (medalSrc) {
    return (
      <div
        className={cn(
          "flex flex-col items-center",
          size === "hero" && lessonCompletionHeroMedalClass,
          className,
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={medalSrc}
          alt={`${skillName} ${isBronze ? "bronze" : "unlocked"} medal`}
          className={lessonSkillMedalImageClassBySize[size]}
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
    <div
      className={cn(
        "flex flex-col items-center",
        size === "hero" && lessonCompletionHeroMedalClass,
        className,
      )}
    >
      <div
        className={cn(
          "lesson-skill-medal__coin",
          size === "hero" && "lesson-skill-medal__coin--hero",
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
