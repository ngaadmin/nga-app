import {
  getMedalIllustrationPathForSkill,
} from "@/lib/academy/illustrations/medal-registry";
import type { SkillTrophyTier } from "@/lib/dashboard/skill-trophies";
import { cn } from "@/lib/utils/cn";

type SkillMedalVisualProps = {
  skillNumber: number;
  skillName: string;
  tier: SkillTrophyTier;
  size?: "sm" | "hero";
  className?: string;
};

const SIZE_CLASS = {
  sm: "size-14 sm:size-16",
  hero: "h-auto w-full max-h-[8rem] max-w-[8rem] sm:max-h-[11rem] sm:max-w-[11rem]",
} as const;

const IMAGE_CLASS = {
  sm: "block size-14 object-contain object-center sm:size-16",
  hero: "block h-auto w-full max-h-[8rem] max-w-[8rem] object-contain object-center sm:max-h-[11rem] sm:max-w-[11rem]",
} as const;

function placeholderTone(tier: SkillTrophyTier): string {
  switch (tier) {
    case "gold":
      return "border-[#C88202] bg-[#FFA503]";
    case "silver":
      return "border-[#8FA3B0] bg-[#D5DEE4]";
    case "bronze":
      return "border-[#8B5A2B] bg-[#CD7F32]";
    case "unlocked":
      return "border-[#031F82] bg-white";
    case "locked":
      return "border-gray-300 bg-gray-100";
  }
}

/** Real medal art when the file exists; otherwise a flat circle placeholder. */
export function SkillMedalVisual({
  skillNumber,
  skillName,
  tier,
  size = "sm",
  className,
}: SkillMedalVisualProps) {
  const medalSrc = getMedalIllustrationPathForSkill(skillNumber, tier);
  const statusLabel =
    tier === "unlocked" ? "unlocked" : tier === "locked" ? "locked" : tier;

  if (medalSrc) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={medalSrc}
        alt={`${skillName} ${statusLabel} medal`}
        className={cn(IMAGE_CLASS[size], className)}
        decoding="async"
        loading={size === "hero" ? "eager" : "lazy"}
      />
    );
  }

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full border-2",
        SIZE_CLASS[size],
        placeholderTone(tier),
        tier === "locked" && "opacity-60",
        className,
      )}
      aria-hidden
    />
  );
}
