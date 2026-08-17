import { getMedalIllustrationPathForSkill } from "@/lib/academy/illustrations/medal-registry";
import type { SkillTrophyTier } from "@/lib/dashboard/skill-trophies";
import { cn } from "@/lib/utils/cn";

type SkillMedalVisualProps = {
  skillNumber: number;
  skillName: string;
  tier: SkillTrophyTier;
  size?: "sm" | "md" | "hero";
  className?: string;
};

const IMAGE_CLASS = {
  sm: "block size-14 object-contain object-center sm:size-16",
  md: "block size-[4.75rem] object-contain object-center sm:size-[5.25rem] md:size-24",
  hero: "block h-auto w-full max-h-[8rem] max-w-[8rem] object-contain object-center sm:max-h-[11rem] sm:max-w-[11rem]",
} as const;

/** Real medal art when the file exists; otherwise the shared placeholder image. */
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
