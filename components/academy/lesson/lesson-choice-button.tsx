"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { LessonAnswerTick } from "@/components/academy/lesson/lesson-ui";
import {
  lessonTileSelection,
  lessonTileShowsTick,
} from "@/lib/academy/lessons/lesson-tile-feedback";
import { cn } from "@/lib/utils/cn";

type LessonChoiceButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  selected?: boolean;
  /** Selected but not yet checked. */
  pending?: boolean;
  /** This pick was wrong. The card shakes. */
  wrong?: boolean;
  /** Persistent locked-in correct state (multi-select check screens). */
  locked?: boolean;
  /** Kept so older call sites compile. Letter orbs are not rendered. */
  layout?: "pill" | "radio-row";
  /** Emoji shown in the button, beside the answer text. */
  emoji?: string;
  /** @deprecated Letter orbs are not rendered. */
  orbLabel?: string;
  /** @deprecated Letter orbs are not rendered. */
  orb?: ReactNode;
  children: ReactNode;
};

/** Answer text is the button. An emoji sits beside the words. No letter circle. */
export function LessonChoiceButton({
  selected = false,
  pending = false,
  locked = false,
  wrong = false,
  layout = "pill",
  emoji,
  orbLabel,
  orb,
  className,
  children,
  type = "button",
  ...props
}: LessonChoiceButtonProps) {
  void layout;
  void orbLabel;
  void orb;
  const isPressed = selected || pending || locked;
  const selection = lessonTileSelection({
    selected: locked || ((selected || pending) && !wrong),
    variant: locked ? "correct" : "neutral",
  });

  return (
    <button
      type={type}
      {...props}
      aria-pressed={isPressed}
      data-selection={selection === "idle" ? undefined : selection}
      className={cn(
        "lesson-choice-tile relative flex w-full min-h-[60px] items-center gap-3.5 rounded-full bg-transparent px-3.5 py-2 text-left font-sans text-[18px] font-semibold leading-[1.25] text-[#14213D] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-45",
        wrong && "lesson-tile-shake",
        className,
      )}
    >
      {emoji ? (
        <span
          className="grid w-9 shrink-0 place-items-center text-[30px] leading-none"
          aria-hidden
        >
          {emoji}
        </span>
      ) : null}
      <span className="min-w-0 flex-1">{children}</span>
      {lessonTileShowsTick(selection) ? <LessonAnswerTick /> : null}
    </button>
  );
}
