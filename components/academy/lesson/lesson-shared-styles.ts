import { cn } from "@/lib/utils/cn";

/** Question / scenario copy — normal sentence case, readable body weight. */
export const lessonPromptClass =
  "font-sans text-base font-normal leading-relaxed text-[#1E3A5F] sm:text-lg";

/** Short task directive (e.g. “Pick the word that fits”) — semibold, not all-caps. */
export const lessonInstructionClass =
  "font-heading text-base font-semibold leading-snug text-[#031F82] sm:text-lg";

/** Secondary narrative body copy beneath instructions. */
export const lessonNarrativeClass =
  "font-sans text-base font-normal leading-relaxed text-[#1E3A5F] sm:text-lg";

/** Small section labels (Round 1 of 3, bucket headers). */
export const lessonEyebrowClass =
  "font-heading text-sm font-semibold text-[#0CC1E0] sm:text-base";

/** Labels beneath standalone icons — larger for mobile. */
export const lessonIconLabelClass =
  "text-center font-sans text-base font-medium leading-snug text-[#031F82] sm:text-lg";

/** Prompt by default; pass true for short instruction lines only. */
export function lessonIntroClass(emphasizeInstruction = false): string {
  return emphasizeInstruction ? lessonInstructionClass : lessonPromptClass;
}

export function usesNeutralChoiceFeedback(
  choiceFeedback?: "colored" | "neutral-selected",
): boolean {
  return choiceFeedback !== "colored";
}

export function usesNeutralTapFeedback(
  selectionFeedback?: "neutral" | "colored",
): boolean {
  return selectionFeedback !== "colored";
}

export const lessonCircleSizeClass = "size-[5.5rem] sm:size-24";

export const lessonIconTapClass = cn(
  "flex shrink-0 items-center justify-center rounded-full border-2 border-[#BDE9FB] bg-[#F7FBFF] shadow-sm transition-all hover:bg-[#EEF6FC] active:scale-[0.98]",
  lessonCircleSizeClass,
);

/** Persistent darker sunken state after tap/select. */
export const lessonIconTapSelectedClass =
  "border-[#066B7C] bg-[#099FB8]/70 shadow-[inset_0_6px_18px_rgba(3,31,130,0.4)] scale-[0.96] translate-y-0.5";

export const lessonSortCircleChipClass = cn(
  "flex shrink-0 cursor-grab items-center justify-center rounded-full border-2 border-[#BDE9FB] bg-white font-heading font-semibold text-[#031F82] shadow-sm transition-all touch-none select-none active:cursor-grabbing active:scale-[0.98]",
  lessonCircleSizeClass,
);

export const lessonSortGridCellClass =
  "flex min-h-[9rem] min-w-0 flex-col items-center justify-start gap-2.5";

export const lessonSortGridChipClass = lessonSortCircleChipClass;

export const lessonSortGridPlaceholderClass = cn(
  "shrink-0 rounded-full border-2 border-dashed border-[#BDE9FB]/45 bg-[#F7FBFF]/50",
  lessonCircleSizeClass,
);

export const lessonChoiceLayoutClass =
  "flex w-full items-center justify-center rounded-full px-5 py-4 text-center font-heading text-base font-semibold leading-snug text-[#031F82] shadow-sm transition-all sm:text-lg";

export const lessonChoiceBaseClass = cn(
  lessonChoiceLayoutClass,
  "border-2 border-[#BDE9FB] bg-white hover:bg-[#F7FBFF] active:scale-[0.99]",
);

/** @deprecated Use lessonChoiceBaseClass + lessonChoiceStateClass helpers. */
export const lessonChoiceClass = lessonChoiceBaseClass;

export type LessonChoiceVariant = "neutral" | "correct" | "wrong";

/** Darker inset fill — persists while selected. */
const lessonChoiceSelectedVariantClass: Record<LessonChoiceVariant, string> = {
  neutral:
    "border-[#066B7C] bg-[#099FB8]/75 shadow-[inset_0_6px_18px_rgba(3,31,130,0.42)] translate-y-1 scale-[0.98]",
  correct:
    "border-[#15803D] bg-[#4ADE80]/80 shadow-[inset_0_6px_16px_rgba(22,101,52,0.32)] translate-y-1 scale-[0.98]",
  wrong:
    "border-[#BE123C] bg-[#FB7185]/75 shadow-[inset_0_6px_16px_rgba(190,18,60,0.32)] translate-y-1 scale-[0.98]",
};

export const lessonChoiceLockedCorrectClass =
  "pointer-events-none cursor-default rounded-full border-2 border-[#031F82] bg-[#099FB8]/35 shadow-[inset_0_4px_12px_rgba(3,31,130,0.28)] translate-y-0.5 scale-[0.98]";

export function lessonChoiceStateClass(
  isSelected: boolean,
  variant: LessonChoiceVariant = "neutral",
): string {
  if (!isSelected) return "";
  return lessonChoiceSelectedVariantClass[variant];
}

export function cnLessonChoice(
  isSelected: boolean,
  variant: LessonChoiceVariant = "neutral",
  className?: string,
): string {
  return cn(
    lessonChoiceBaseClass,
    lessonChoiceStateClass(isSelected, variant),
    className,
  );
}

/** Uniform-height drag/sort row — left-aligned copy. */
export const lessonSortRowClass =
  "flex min-h-[4rem] w-full cursor-grab touch-none select-none items-center rounded-2xl border-2 border-[#BDE9FB] bg-white px-4 py-3 text-left font-heading text-base font-semibold leading-snug text-[#031F82] shadow-sm transition-all active:cursor-grabbing active:scale-[0.995] sm:min-h-[4.25rem] sm:text-lg";

/** Compact uniform pool chip (word-drop). */
export const lessonSortPoolChipClass =
  "inline-flex min-h-[2.875rem] min-w-[5.75rem] cursor-grab touch-none select-none items-center justify-start rounded-2xl border-2 border-[#BDE9FB] bg-white px-4 py-2 text-left font-heading text-base font-semibold text-[#031F82] shadow-sm transition-all active:cursor-grabbing";

/** @deprecated Prefer lessonSortRowClass for full-width sort lists. */
export const lessonSortChipClass = lessonSortRowClass;

export const lessonSortBucketClass =
  "min-h-[9rem] rounded-3xl border-2 border-dashed border-[#BDE9FB]/80 bg-[#F7FBFF]/80 p-4 transition-colors";

export const lessonSortBucketActiveClass =
  "border-[#0CC1E0] bg-[#BDE9FB]/35 ring-2 ring-[#0CC1E0]/40";

export const lessonSortBucketErrorClass =
  "border-[#F59E0B] bg-[#FFFBEB]/80 ring-2 ring-[#F59E0B]/30";

export const lessonSortBucketSuccessClass =
  "border-[#16A34A] bg-[#DCFCE7]/40 ring-2 ring-[#22C55E]/35";

export const lessonGoldClaimClass =
  "flex h-touch w-full max-w-md items-center justify-center rounded-full border-2 border-[#C88202] bg-[#FFA503] px-6 py-4 text-center font-heading text-base font-extrabold uppercase tracking-wide text-[#031F82] shadow-md transition-all hover:brightness-[1.02] active:scale-[0.99] disabled:opacity-60";

export const lessonGiftTapClass = cn(
  "flex shrink-0 items-center justify-center rounded-full border-2 border-[#0CC1E0] bg-[#F7FBFF] text-4xl shadow-sm transition-all hover:bg-[#E8F4FC] active:scale-[0.97]",
  "size-20 sm:size-24",
);

export const lessonGiftTapRevealedClass =
  "border-[#22C55E] bg-[#DCFCE7] shadow-[inset_0_3px_8px_rgba(34,197,94,0.16)]";

export const lessonHoldButtonClass =
  "flex select-none items-center justify-center rounded-full border-2 border-[#099FB8] bg-[#0CC1E0] px-8 py-5 text-center font-heading text-base font-extrabold uppercase tracking-wide text-[#031F82] shadow-md transition-all active:scale-[0.99]";

export const lessonHoldButtonCompleteClass =
  "border-[#6366F1] bg-[#6366F1] text-white";

export const LESSON_CASH_IN_LABEL = "[ CASH IN YOUR POINTS ]";

export const lessonSubmitAnswerClass =
  "flex h-touch w-full max-w-xs items-center justify-center rounded-full border-2 border-[#4338CA] bg-[#6366F1] px-6 py-4 text-center font-heading text-base font-bold uppercase tracking-wide text-white shadow-md transition-all hover:brightness-[1.05] active:scale-[0.99]";

export const lessonSuccessMessageClass =
  "mt-4 rounded-xl bg-[#DCFCE7] px-4 py-3 font-sans text-base leading-relaxed text-[#031F82] sm:text-lg";

export const lessonRangeSliderClass = "lesson-range-slider w-full cursor-pointer";

export const lessonNextButtonClass =
  "mx-auto flex h-touch w-full max-w-md items-center justify-center rounded-full border-2 border-[#099FB8] bg-[#0CC1E0] px-6 py-4 text-center font-heading text-base font-bold normal-case tracking-normal text-[#031F82] shadow-md transition-all hover:brightness-[1.03] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40 sm:text-lg";
