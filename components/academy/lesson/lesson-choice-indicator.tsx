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

/** Visible tick / radio dot for lesson option selection states. */
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

  if (mode === "radio") {
    return (
      <span
        className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
          variant === "correct" && "border-[#16A34A] bg-[#86EFAC]",
          variant === "wrong" && "border-[#E11D48] bg-[#FDA4AF]",
          variant === "neutral" && "border-[#066B7C] bg-[#099FB8]/35",
          className,
        )}
        aria-hidden
      >
        <span
          className={cn(
            "h-2.5 w-2.5 rounded-full",
            variant === "correct" && "bg-[#16A34A]",
            variant === "wrong" && "bg-[#E11D48]",
            variant === "neutral" && "bg-[#066B7C]",
          )}
        />
      </span>
    );
  }

  return (
    <span
      className={cn(
        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-white/90 text-xs font-extrabold text-white shadow-sm",
        variant === "correct" && "bg-[#16A34A]",
        variant === "wrong" && "bg-[#BE123C]",
        variant === "neutral" && "bg-[#066B7C]",
        className,
      )}
      aria-hidden
    >
      {variant === "wrong" ? "✗" : "✓"}
    </span>
  );
}
