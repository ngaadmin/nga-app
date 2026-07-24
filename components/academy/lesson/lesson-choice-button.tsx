"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { LessonChoiceIndicator } from "@/components/academy/lesson/lesson-choice-indicator";
import {
  lessonChoiceBaseClass,
  lessonChoiceLayoutClass,
  lessonChoiceLockedCorrectClass,
  lessonChoiceStateClass,
  type LessonChoiceVariant,
} from "@/components/academy/lesson/lesson-shared-styles";
import { cn } from "@/lib/utils/cn";

type LessonChoiceButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  selected?: boolean;
  variant?: LessonChoiceVariant;
  /** Persistent locked-in correct state (multi-select check screens). */
  locked?: boolean;
  /** Pill (default) or radio-row for multi-select lists. */
  layout?: "pill" | "radio-row";
  children: ReactNode;
};

/** Standard sunk/depressed highlight for single-select lesson options. */
export function LessonChoiceButton({
  selected = false,
  variant = "neutral",
  locked = false,
  layout = "pill",
  className,
  children,
  type = "button",
  ...props
}: LessonChoiceButtonProps) {
  const isPressed = selected || locked;
  const indicatorVariant: LessonChoiceVariant = locked
    ? "correct"
    : selected
      ? variant
      : "neutral";

  if (layout === "radio-row") {
    return (
      <button
        type={type}
        aria-pressed={isPressed}
        className={cn(
          "flex w-full items-center gap-3 rounded-xl py-2.5 text-left transition-colors",
          isPressed && "bg-[#EEF6FC]/80",
          className,
        )}
        {...props}
      >
        <LessonChoiceIndicator
          selected={isPressed}
          variant={indicatorVariant}
          mode="radio"
        />
        <span className="min-w-0 flex-1 font-heading text-base font-bold leading-snug text-[#031F82]">
          {children}
        </span>
      </button>
    );
  }

  return (
    <button
      type={type}
      aria-pressed={isPressed}
      className={cn(
        locked
          ? cn(
              lessonChoiceLayoutClass,
              lessonChoiceLockedCorrectClass,
              "gap-3",
            )
          : cn(
              lessonChoiceBaseClass,
              lessonChoiceStateClass(isPressed, variant),
              isPressed && "gap-3",
            ),
        className,
      )}
      {...props}
    >
      {isPressed ? (
        <LessonChoiceIndicator
          selected
          variant={indicatorVariant}
          mode="check"
        />
      ) : null}
      <span className="min-w-0 flex-1">{children}</span>
    </button>
  );
}
