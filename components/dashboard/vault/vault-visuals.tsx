"use client";

import type { VaultBucket } from "@/lib/dashboard/vault-buckets";
import { isSavingsBucket } from "@/lib/dashboard/vault-buckets";
import { cn } from "@/lib/utils/cn";

export type BucketTheme = {
  accent: string;
  fill: string;
  track: string;
  ring: string;
  label: string;
};

export function bucketTheme(bucket: VaultBucket): BucketTheme {
  if (isSavingsBucket(bucket) || bucket.foundationRole === "save") {
    return {
      accent: "#22C55E",
      fill: "from-[#22C55E]/80 to-[#16A34A]",
      track: "bg-[#22C55E]/20",
      ring: "#22C55E",
      label: "text-[#15803D]",
    };
  }
  if (bucket.foundationRole === "spend") {
    return {
      accent: "#FFA503",
      fill: "from-[#FFA503]/90 to-[#F59E0B]",
      track: "bg-[#FFA503]/25",
      ring: "#FFA503",
      label: "text-[#C88202]",
    };
  }
  if (bucket.foundationRole === "give") {
    return {
      accent: "#8B5CF6",
      fill: "from-[#A78BFA]/90 to-[#8B5CF6]",
      track: "bg-[#8B5CF6]/20",
      ring: "#8B5CF6",
      label: "text-[#6D28D9]",
    };
  }
  if (bucket.foundationRole === "emergencies") {
    return {
      accent: "#F43F5E",
      fill: "from-[#FB7185]/90 to-[#F43F5E]",
      track: "bg-[#F43F5E]/20",
      ring: "#F43F5E",
      label: "text-[#BE123C]",
    };
  }
  return {
    accent: "#0CC1E0",
    fill: "from-[#0CC1E0]/90 to-[#0891B2]",
    track: "bg-[#0CC1E0]/20",
    ring: "#0CC1E0",
    label: "text-[#0E7490]",
  };
}

export function BucketEmojiIcon({
  emoji,
  theme,
  size = "md",
}: {
  emoji: string;
  theme: BucketTheme;
  size?: "sm" | "md" | "lg";
}) {
  const dimensions =
    size === "lg" ? "size-16 text-4xl" : size === "md" ? "size-12 text-2xl" : "size-10 text-xl";

  return (
    <span
      className={cn("flex shrink-0 items-center justify-center rounded-2xl leading-none", dimensions)}
      style={{ backgroundColor: `${theme.accent}18` }}
      aria-hidden
    >
      {emoji}
    </span>
  );
}

type GoalProgressBarProps = {
  progress: number;
  color?: string;
  trackColor?: string;
  variant?: "default" | "goal";
};

export function GoalProgressBar({
  progress,
  color = "#DCB766",
  trackColor = "#FEF3C7",
  variant = "default",
}: GoalProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, progress));
  const isGoal = variant === "goal";

  return (
    <div
      className={cn(
        "w-full overflow-hidden",
        isGoal ? "h-3.5 rounded-md" : "h-1.5 rounded-full",
      )}
      style={{ backgroundColor: trackColor }}
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn(
          "h-full transition-all duration-500",
          isGoal ? "rounded-md" : "rounded-full",
        )}
        style={{ width: `${clamped}%`, backgroundColor: color }}
      />
    </div>
  );
}
