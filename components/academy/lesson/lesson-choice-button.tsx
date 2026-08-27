"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import {
  lessonChoiceBaseClass,
  lessonChoiceLabelClass,
  lessonChoiceLockedCorrectClass,
  lessonChoiceOrbClass,
  lessonChoiceOrbSelectedClass,
  type LessonChoiceVariant,
} from "@/components/academy/lesson/lesson-shared-styles";
import { cn } from "@/lib/utils/cn";

type LessonChoiceButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  selected?: boolean;
  variant?: LessonChoiceVariant;
  /** Selected but not yet checked — cyan orb, letters stay. */
  pending?: boolean;
  /** Persistent locked-in correct state (multi-select check screens). */
  locked?: boolean;
  /** Pill (default) or radio-row for multi-select lists. */
  layout?: "pill" | "radio-row";
  /** Glyph inside the 48px orb. Defaults to a filled dot when selected. */
  orbLabel?: string;
  children: ReactNode;
};

function orbGlyph(orbLabel: string | undefined, selected: boolean): string {
  if (orbLabel) return orbLabel;
  return selected ? "•" : "";
}

/** Numbered orb + label — matches the signed-off template lab. */
export function LessonChoiceButton({
  selected = false,
  variant: _variant = "neutral",
  pending = false,
  locked = false,
  layout = "pill",
  orbLabel,
  className,
  children,
  type = "button",
  ...props
}: LessonChoiceButtonProps) {
  const isPressed = selected || pending || locked;
  const glyph = orbGlyph(orbLabel, isPressed);

  return (
    <button
      type={type}
      {...props}
      aria-pressed={isPressed}
      className={cn(
        lessonChoiceBaseClass,
        layout === "radio-row" && "py-1",
        locked && lessonChoiceLockedCorrectClass,
        className,
      )}
    >
      <span
        className={isPressed ? lessonChoiceOrbSelectedClass : lessonChoiceOrbClass}
        style={
          isPressed
            ? {
                backgroundColor: "#0CC1E0",
                color: "#FFFFFF",
                borderColor: "#031F82",
                opacity: 1,
              }
            : {
                backgroundColor: "#E8F6FC",
                color: "#031F82",
                borderColor: "transparent",
                opacity: 1,
              }
        }
        aria-hidden
      >
        {glyph}
      </span>
      <span className={lessonChoiceLabelClass} style={{ color: "#031F82", opacity: 1 }}>
        {children}
      </span>
    </button>
  );
}
