import { cn } from "@/lib/utils/cn";
import type { SortBucketTone } from "@/lib/academy/lessons/types/shared-blocks";

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

/** Emoji glyph inside circular lesson options. */
export const lessonIconEmojiClass =
  "text-5xl leading-none sm:text-[3.25rem]";

/** Monogram fallback when no emoji is provided. */
export const lessonIconMonogramClass =
  "font-heading text-2xl font-extrabold uppercase text-[#031F82] sm:text-3xl";

/** Standard 2-column icon grid for tap / sort pools. */
export const lessonIconGridClass = "mt-6 grid grid-cols-2 gap-6 sm:gap-8";

export const lessonIconOptionStackClass =
  "flex flex-col items-center gap-2.5 text-center";

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

/** Compact drag pool for bucket-sort — fits on mobile without scrolling off-screen. */
export const lessonSortCompactCircleClass = "size-[4.25rem] sm:size-[4.75rem]";

export const lessonSortPoolWrapClass =
  "flex flex-wrap justify-center gap-x-4 gap-y-3 sm:gap-x-5 sm:gap-y-4";

export const lessonSortBoardClass = "mt-3 flex min-h-0 flex-col gap-2.5";

export const lessonSortBucketCompactClass = "min-h-[5.25rem] sm:min-h-[5.75rem]";

/** Scrollable pool area — keeps buckets visible on short viewports. */
export const lessonSortPoolScrollClass =
  "max-h-[38vh] overflow-y-auto overscroll-contain pr-0.5";

/** Vertical stack of draggable statement cards (top pool section). */
export const lessonSortStatementListClass = "flex flex-col gap-1.5";

/** Lightweight draggable statement card — compact rounded rectangle. */
export const lessonSortStatementCardClass =
  "flex w-full cursor-grab touch-none select-none items-center gap-2 rounded-2xl border border-[#BDE9FB] bg-white px-3 py-2 text-left font-heading text-sm font-semibold leading-snug text-[#031F82] transition-all active:cursor-grabbing active:scale-[0.99] sm:py-2.5 sm:text-[0.9375rem]";

/** Compact read-only card inside a bucket after drop. */
export const lessonSortStatementPlacedClass =
  "rounded-xl border border-[#BDE9FB]/80 bg-white/90 px-2.5 py-1.5 font-heading text-[11px] font-semibold leading-snug text-[#031F82] sm:text-xs";

export type LessonSortBucketTone = SortBucketTone;

const lessonSortBucketToneSurfaceClass: Record<
  LessonSortBucketTone | "neutral",
  string
> = {
  rush: "border-[#FECACA]/90 bg-[#FEF2F2]/95",
  think: "border-[#BBF7D0]/90 bg-[#F0FDF4]/95",
  want: "border-[#FDE68A]/90 bg-[#FFFBEB]/95",
  need: "border-[#BAE6FD]/90 bg-[#F0F9FF]/95",
  short: "border-[#FED7AA]/90 bg-[#FFF7ED]/95",
  long: "border-[#A7F3D0]/90 bg-[#ECFDF5]/95",
  neutral: "border-[#BDE9FB]/80 bg-[#F7FBFF]/90",
};

const lessonSortBucketToneHeaderClass: Record<
  LessonSortBucketTone | "neutral",
  string
> = {
  rush: "text-[#BE123C]",
  think: "text-[#15803D]",
  want: "text-[#B45309]",
  need: "text-[#0369A1]",
  short: "text-[#C2410C]",
  long: "text-[#047857]",
  neutral: "text-[#031F82]",
};

const lessonSortBucketDefaultIcon: Record<
  LessonSortBucketTone | "neutral",
  string
> = {
  rush: "⚡",
  think: "🧠",
  want: "✨",
  need: "🛡️",
  short: "⏱️",
  long: "🌱",
  neutral: "📥",
};

/** Infer bucket tone from explicit field or common bucket ids. */
export function resolveSortBucketTone(
  bucketId: string,
  tone?: SortBucketTone,
): LessonSortBucketTone | "neutral" {
  if (tone) return tone;
  const id = bucketId.toLowerCase();
  if (id.includes("rush")) return "rush";
  if (id.includes("think")) return "think";
  if (id === "want" || id.includes("want")) return "want";
  if (id === "need" || id.includes("need")) return "need";
  if (id === "short" || id.includes("short")) return "short";
  if (id === "long" || id.includes("long")) return "long";
  return "neutral";
}

export function lessonSortBucketSurfaceClass(
  bucketId: string,
  tone?: SortBucketTone,
): string {
  const resolved = resolveSortBucketTone(bucketId, tone);
  return lessonSortBucketToneSurfaceClass[resolved];
}

export function lessonSortBucketHeaderClass(
  bucketId: string,
  tone?: SortBucketTone,
): string {
  const resolved = resolveSortBucketTone(bucketId, tone);
  return lessonSortBucketToneHeaderClass[resolved];
}

export function resolveSortBucketIcon(
  bucketId: string,
  tone?: SortBucketTone,
  icon?: string,
): string | undefined {
  if (icon) return icon;
  const resolved = resolveSortBucketTone(bucketId, tone);
  return lessonSortBucketDefaultIcon[resolved];
}

/** Step-order / sequence drag board — two-column pool + slot grid. */
export const lessonSequenceBoardClass = "flex min-h-0 flex-1 flex-col";

export const lessonSequenceGridClass =
  "grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-stretch gap-x-2.5 gap-y-2 sm:gap-x-3 sm:gap-y-2.5";

export const lessonSequenceRowClass = "flex h-full w-full min-w-0 items-stretch";

/** Draggable step pill — matches slot shape on the right. */
export const lessonSequenceStepCardClass =
  "flex w-full min-h-[2.625rem] cursor-grab touch-none select-none items-center gap-2 rounded-full border border-[#BDE9FB] bg-white px-2.5 py-2 text-left font-heading text-[11px] font-semibold leading-snug text-[#031F82] transition-all active:cursor-grabbing active:scale-[0.99] sm:min-h-[2.75rem] sm:px-3 sm:text-xs";

/** Small emoji/icon well inside step cards. */
export const lessonSequenceStepIconClass =
  "flex size-7 shrink-0 items-center justify-center rounded-full bg-[#F0F9FF] text-base leading-none sm:size-8 sm:text-lg";

/** Empty drop slot — same rounded pill as pool cards. */
export const lessonSequenceSlotClass =
  "relative flex h-full w-full min-h-[2.625rem] items-center rounded-full border-2 border-dashed border-[#BDE9FB]/75 bg-[#F7FBFF]/60 px-2.5 py-2 transition-colors sm:min-h-[2.75rem] sm:px-3";

export const lessonSequenceSlotActiveClass =
  "border-[#0CC1E0] bg-[#BDE9FB]/35 ring-2 ring-[#0CC1E0]/40";

export const lessonSequenceSlotErrorClass =
  "border-[#F59E0B] bg-[#FFFBEB]/80 ring-2 ring-[#F59E0B]/30";

export const lessonSequenceSlotLockedClass =
  "border border-[#86EFAC] bg-[#F0FDF4]/80";

export const lessonSequenceSlotFilledClass =
  "border border-[#BDE9FB] bg-white";

/** Placed step inside a slot — identical pill to the pool card. */
export const lessonSequenceStepPlacedClass =
  "flex h-full w-full items-center gap-2 rounded-full px-2.5 py-2 font-heading text-[11px] font-semibold leading-snug text-[#031F82] sm:px-3 sm:text-xs";

export const lessonSequenceStepBadgeClass =
  "absolute -left-0.5 -top-0.5 z-raised flex size-5 items-center justify-center rounded-full bg-[#031F82] font-heading text-[10px] font-bold leading-none text-white";

export const lessonSequencePoolCompleteClass =
  "col-start-1 row-start-1 flex items-center justify-center rounded-full border border-dashed border-[#BDE9FB]/60 bg-[#F7FBFF]/50";

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
  "pointer-events-none cursor-default rounded-full border-2 border-[#15803D] bg-[#4ADE80]/80 shadow-[inset_0_6px_16px_rgba(22,101,52,0.32)] translate-y-0.5 scale-[0.98]";

/** Resolve pill/radio variant: only the chosen option gets correct/wrong color. */
export function resolveChoiceVariant(
  isChosen: boolean,
  isCorrect: boolean,
): LessonChoiceVariant {
  if (!isChosen) return "neutral";
  return isCorrect ? "correct" : "wrong";
}

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

/** Uniform-height drag/sort row — pill-shaped for consistency with choice buttons. */
export const lessonSortRowClass =
  "flex min-h-[3.5rem] w-full cursor-grab touch-none select-none items-center rounded-full border-2 border-[#BDE9FB] bg-white px-5 py-3 text-left font-heading text-base font-semibold leading-snug text-[#031F82] shadow-sm transition-all active:cursor-grabbing active:scale-[0.995] sm:min-h-[3.75rem] sm:text-lg";

/** Compact pill pool chip (word-drop, drag pools). */
export const lessonSortPoolChipClass =
  "inline-flex min-h-[2.875rem] cursor-grab touch-none select-none items-center justify-center rounded-full border-2 border-[#BDE9FB] bg-white px-5 py-2.5 font-heading text-base font-semibold text-[#031F82] shadow-sm transition-all active:cursor-grabbing active:scale-[0.98]";

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

export const lessonNextButtonClass =
  "mx-auto flex h-touch w-full max-w-md items-center justify-center rounded-full border-2 border-[#099FB8] bg-[#0CC1E0] px-6 py-4 text-center font-heading text-base font-bold normal-case tracking-normal text-[#031F82] shadow-md transition-all hover:brightness-[1.03] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40 sm:text-lg";

// ─── Layout surfaces ─────────────────────────────────────────────────────────

export const lessonCardClass =
  "rounded-2xl border-0 bg-white p-4 shadow-md";

export const lessonGameBoardClass = "mt-5 space-y-4";

export const lessonScreenFillClass = "flex min-h-0 flex-1 flex-col";

export const lessonGameAreaClass = "mt-3 flex min-h-0 flex-1 flex-col";

export const lessonChoiceStackClass = "mt-5 space-y-3";

export const lessonTwoColumnGridClass = "grid grid-cols-2 gap-3";

// ─── Column labels & section headers ─────────────────────────────────────────

export const lessonColumnLabelClass =
  "font-heading text-[10px] font-bold uppercase tracking-wide text-[#0CC1E0]";

export const lessonColumnLabelInkClass =
  "font-heading text-[10px] font-bold uppercase tracking-wide text-[#031F82]";

export const lessonColumnLabelSuccessClass =
  "font-heading text-[10px] font-extrabold uppercase tracking-wide text-[#16A34A]";

export const lessonColumnLabelMutedClass =
  "font-heading text-[10px] font-bold uppercase tracking-wide text-[#1E3A5F]/50";

// ─── Feedback banners ────────────────────────────────────────────────────────

export const lessonSuccessMessageClass =
  "mt-4 rounded-xl bg-[#DCFCE7] px-4 py-3 font-sans text-base leading-relaxed text-[#031F82] sm:text-lg";

export const lessonErrorBannerClass =
  "mt-4 rounded-xl bg-[#FFF7ED] px-3 py-2 font-sans text-base text-[#031F82] sm:text-lg";

export const lessonInlineErrorClass = "mt-4 font-sans text-xs text-[#E11D48]";

export const lessonGameHintClass =
  "text-center font-sans text-sm text-[#1E3A5F]/80 sm:text-base";

// ─── Match / link rows ───────────────────────────────────────────────────────

export const lessonMatchColumnHeaderGridClass =
  "grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-end gap-x-2 gap-y-1 px-0.5";

export const lessonMatchRowGridClass =
  "grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-x-2";

export const lessonMatchConnectorSpacerClass = "w-4 shrink-0";

export const lessonMatchPulseClass =
  "ring-4 ring-[#22C55E]/70 border-[#16A34A] shadow-[0_0_0_4px_rgba(34,197,94,0.28)]";

export function lessonMatchConnectorClass(
  matched: boolean,
  pulsing = false,
): string {
  if (pulsing || matched) {
    return "h-px w-4 shrink-0 rounded-full bg-[#16A34A]";
  }
  return "h-px w-4 shrink-0 rounded-full bg-[#0CC1E0]";
}

// ─── Reveal buckets & placeholders ───────────────────────────────────────────

export const lessonRevealBucketClass =
  "rounded-3xl border-2 border-dashed border-[#BDE9FB]/70 bg-[#F7FBFF]/50 p-4 transition-colors";

export const lessonImagePlaceholderClass =
  "flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#BDE9FB] bg-[#F7FBFF] px-4 text-center";

export const lessonImagePlaceholderCompactClass =
  "flex aspect-square w-full max-w-[8rem] flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#BDE9FB] bg-[#F7FBFF] px-3 text-center";

// ─── Spent-total bar (L3 drag-and-drop) ──────────────────────────────────────

export const lessonSpentTotalBarClass =
  "rounded-xl bg-[#031F82] px-3 py-2.5 text-center transition-colors";

export const lessonSpentTotalBarCompleteClass =
  "rounded-xl border-2 border-[#C88202] bg-[#FFA503] px-3 py-2.5 text-center shadow-md transition-colors";

export const lessonSpentTotalLabelClass =
  "font-heading text-sm font-extrabold tabular-nums text-white";

export const lessonSpentTotalLabelCompleteClass =
  "font-heading text-sm font-extrabold tabular-nums text-[#031F82]";

// ─── Word-drop blank slots ───────────────────────────────────────────────────

export const lessonBlankSlotClass =
  "inline-flex min-h-[2.5rem] min-w-[5rem] items-center justify-center rounded-xl border-2 border-dashed border-[#BDE9FB] bg-[#F7FBFF]/80 px-3 font-heading text-base font-semibold text-[#031F82]";

export const lessonBlankSlotFilledClass =
  "inline-flex min-h-[2.5rem] min-w-[5rem] items-center justify-center rounded-xl border-2 border-[#BDE9FB] bg-white px-3 font-heading text-base font-semibold text-[#031F82] shadow-sm";

export const lessonRangeSliderClass = "lesson-range-slider w-full cursor-pointer";

