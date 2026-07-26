"use client";

import type { LessonChoiceVariant } from "@/components/academy/lesson/lesson-shared-styles";
import { cn } from "@/lib/utils/cn";

type LessonChoiceIndicatorProps = {
  selected?: boolean;
  variant?: LessonChoiceVariant;
  /** Radio-style dot (multi-select lists) vs check badge (pill buttons). */
  mode?: "check" | "radio";
  className?: string;
};

const indicatorSurfaceClass: Record<LessonChoiceVariant, string> = {
  correct: "border-[#16A34A] bg-[#DCFCE7]",
  wrong: "border-[#E11D48] bg-[#FFE4E6]",
  neutral: "border-[#066B7C] bg-[#EEF6FC]",
};

/** Visible tick / cross badge for lesson option selection states. */
export function LessonChoiceIndicator({
  selected = false,
  variant = "neutral",
  mode = "check",
  className,
}: LessonChoiceIndicatorProps) {
  if (!selected) {
    if (mode === "radio") {
      return (
        <span
          className={cn(
            "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-[#BDE9FB] bg-white",
            className,
          )}
          aria-hidden
        />
      );
    }
    return null;
  }

  const glyph = variant === "wrong" ? "✕" : "✓";
  const glyphColor =
    variant === "wrong"
      ? "text-[#E11D48]"
      : variant === "correct"
        ? "text-[#16A34A]"
        : "text-[#066B7C]";

  if (mode === "radio") {
    return (
      <span
        className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-xs font-extrabold",
          indicatorSurfaceClass[variant],
          glyphColor,
          className,
        )}
        aria-hidden
      >
        {glyph}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-xs font-extrabold",
        indicatorSurfaceClass[variant],
        glyphColor,
        className,
      )}
      aria-hidden
    >
      {glyph}
    </span>
  );
}
