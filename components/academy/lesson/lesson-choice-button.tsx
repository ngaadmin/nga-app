"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import {
  cnLessonChoice,
  type LessonChoiceVariant,
} from "@/components/academy/lesson/lesson-shared-styles";
import { cn } from "@/lib/utils/cn";

type LessonChoiceButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  selected?: boolean;
  variant?: LessonChoiceVariant;
  children: ReactNode;
};

/** Standard sunk/depressed highlight for single-select lesson options. */
export function LessonChoiceButton({
  selected = false,
  variant = "neutral",
  className,
  children,
  type = "button",
  ...props
}: LessonChoiceButtonProps) {
  return (
    <button
      type={type}
      className={cn(cnLessonChoice(selected, variant), className)}
      {...props}
    >
      {children}
    </button>
  );
}
