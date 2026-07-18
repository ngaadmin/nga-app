"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
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
  children: ReactNode;
};

/** Standard sunk/depressed highlight for single-select lesson options. */
export function LessonChoiceButton({
  selected = false,
  variant = "neutral",
  locked = false,
  className,
  children,
  type = "button",
  ...props
}: LessonChoiceButtonProps) {
  const isPressed = selected || locked;

  return (
    <button
      type={type}
      aria-pressed={isPressed}
      className={cn(
        locked
          ? cn(lessonChoiceLayoutClass, lessonChoiceLockedCorrectClass)
          : cn(lessonChoiceBaseClass, lessonChoiceStateClass(isPressed, variant)),
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
