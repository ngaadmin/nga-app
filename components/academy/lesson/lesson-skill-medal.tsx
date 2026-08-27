import {
  getMedalIllustrationPath,
  type MedalIllustrationId,
} from "@/lib/academy/illustrations/medal-registry";
import { getSkillRegistryRecord } from "@/lib/skills/skills-registry";
import {
  lessonCompletionHeroMedalClass,
} from "@/components/academy/lesson/lesson-shared-styles";
import { cn } from "@/lib/utils/cn";

type LessonSkillMedalProps = {
  skillSlug: string;
  medalId: MedalIllustrationId;
  label?: string;
  className?: string;
  size?: "default" | "hero";
};

const IMAGE_CLASS = {
  default: "block size-14 object-contain object-center sm:size-16",
  hero: "block h-auto w-full max-h-[8rem] max-w-[8rem] object-contain object-center sm:max-h-[11rem] sm:max-w-[11rem]",
} as const;

function medalStatusLabel(medalId: MedalIllustrationId): string {
  if (medalId.endsWith("-bronze")) return "bronze";
  if (medalId.endsWith("-silver")) return "silver";
  if (medalId.endsWith("-gold")) return "gold";
  return "unlocked";
}

/**
 * Skill medal from the lesson payload / medal helper — never a generic placeholder.
 */
export function LessonSkillMedal({
  skillSlug,
  medalId,
  label,
  className,
  size = "default",
}: LessonSkillMedalProps) {
  const skill = getSkillRegistryRecord(skillSlug);
  const skillName = skill?.skillName ?? "Skill medal";
  const statusLabel = medalStatusLabel(medalId);

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
        src={getMedalIllustrationPath(medalId)}
        alt={`${skillName} ${statusLabel} medal`}
        className={IMAGE_CLASS[size]}
        decoding="async"
        loading={size === "hero" ? "eager" : "lazy"}
      />
      {label ? (
        <p className="mt-4 max-w-[14rem] font-heading text-base font-semibold text-[#031F82] sm:text-lg">
          {label}
        </p>
      ) : null}
    </div>
  );
}
