import { cn } from "@/lib/utils/cn";
import type { SortBucketTone } from "@/lib/academy/lessons/types/shared-blocks";

/** Default mistake budget shown as hearts in lesson chrome. */
export const LESSON_MAX_LIVES = 3;

/** Minimum comfortable size for interactive cards, chips, and list rows. */
export const lessonInteractiveTextClass = "text-base font-medium";

/** Gentle top offset so short screens don't hug the chrome. */
export const lessonScreenContentOffsetClass = "pt-2 sm:pt-3";

/** Top instructional / prompt copy. */
export const lessonPromptClass =
  "font-sans text-base font-medium leading-relaxed text-[#1E3A5F]";

/** Short task directive — same scale as prompt. */
export const lessonInstructionClass =
  "font-heading text-base font-medium leading-snug text-[#031F82]";

/** Secondary narrative body copy beneath instructions. */
export const lessonNarrativeClass =
  "font-sans text-base font-medium leading-relaxed text-[#1E3A5F]";

/** Small section labels (Round 1 of 3, axis labels). */
export const lessonEyebrowClass =
  "font-heading text-sm font-semibold tracking-wide text-[#0CC1E0]";

/** Option / answer text inside interactive cards. */
export const lessonOptionTextClass =
  "text-center font-heading text-base font-medium leading-snug text-[#031F82]";

/** Labels beneath standalone icons. */
export const lessonIconLabelClass =
  "text-center font-sans text-base font-medium leading-snug text-[#031F82]";

/** Prompt by default; pass true for short instruction lines only. */
export function lessonIntroClass(emphasizeInstruction = false): string {
  return emphasizeInstruction ? lessonInstructionClass : lessonPromptClass;
}

export function usesNeutralChoiceFeedback(
  choiceFeedback?: "colored" | "neutral-selected",
): boolean {
  return choiceFeedback === "neutral-selected";
}

export function usesNeutralTapFeedback(
  selectionFeedback?: "neutral" | "colored",
): boolean {
  return selectionFeedback !== "colored";
}

export const lessonCircleSizeClass = "size-[4.75rem] sm:size-20";

/** Emoji glyph inside circular lesson options. */
export const lessonIconEmojiClass =
  "text-4xl leading-none sm:text-[2.75rem]";

/** Monogram fallback when no emoji is provided. */
export const lessonIconMonogramClass =
  "font-heading text-xl font-extrabold uppercase text-[#031F82] sm:text-2xl";

/** Standard 2-column icon grid for tap / sort pools. */
export const lessonIconGridClass = "mt-3 grid grid-cols-2 gap-4 sm:gap-5";

export const lessonIconOptionStackClass =
  "flex flex-col items-center gap-1.5 text-center";

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
  "flex min-h-[7rem] min-w-0 flex-col items-center justify-start gap-1.5";

export const lessonSortGridChipClass = lessonSortCircleChipClass;

export const lessonSortGridPlaceholderClass = cn(
  "shrink-0 rounded-full border-2 border-dashed border-[#BDE9FB]/45 bg-[#F7FBFF]/50",
  lessonCircleSizeClass,
);

/** Compact drag pool for bucket-sort — fits on mobile without scrolling off-screen. */
export const lessonSortCompactCircleClass = "size-[4.25rem] sm:size-[4.75rem]";

export const lessonSortPoolWrapClass =
  "flex flex-wrap justify-center gap-x-4 gap-y-3 sm:gap-x-5 sm:gap-y-4";

export const lessonSortBoardClass = "mt-2 flex min-h-0 flex-col gap-2";

export const lessonSortBucketCompactClass = "min-h-[4.5rem] sm:min-h-[5rem]";

/** Scrollable pool area — keeps buckets visible on short viewports. */
export const lessonSortPoolScrollClass =
  "max-h-[20vh] overflow-y-auto overscroll-contain pr-0.5";

/** Vertical stack of draggable statement cards (top pool section). */
export const lessonSortStatementListClass = "flex flex-col gap-1.5";

/** Lightweight draggable statement card — compact rounded rectangle. */
export const lessonSortStatementCardClass =
  "flex w-full cursor-grab touch-none select-none items-center justify-center gap-2 rounded-2xl border border-[#BDE9FB] bg-white px-3 py-2 text-center font-heading text-base font-medium leading-snug text-[#031F82] transition-all active:cursor-grabbing active:scale-[0.99]";

/** Generous draggable cards for spent-total bucket-sort layouts. */
export const lessonSpentTotalItemCardClass =
  "flex w-full min-h-[4.5rem] cursor-grab touch-none select-none flex-col items-center justify-center gap-0.5 rounded-2xl border-2 border-[#BDE9FB] bg-white px-3 py-2.5 text-center font-heading text-base font-medium leading-snug text-[#031F82] transition-all active:cursor-grabbing active:scale-[0.99] sm:min-h-[5rem] sm:gap-1 sm:py-3";

/** Compact read-only card inside a bucket after drop. */
export const lessonSortStatementPlacedClass =
  "rounded-xl border border-[#BDE9FB]/80 bg-white/90 px-2.5 py-1.5 text-center font-heading text-base font-medium leading-snug text-[#031F82]";

/** Read-only spent-total item inside the Spent column. */
export const lessonSpentTotalItemPlacedClass =
  "flex flex-col items-center justify-center gap-0.5 rounded-xl border border-[#BDE9FB]/80 bg-white px-3 py-2 text-center font-heading text-base font-medium leading-snug text-[#031F82] sm:gap-1 sm:py-2.5";

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
  "flex w-full min-h-[2.5rem] cursor-grab touch-none select-none items-center justify-center gap-2 rounded-full border border-[#BDE9FB] bg-white px-3 py-1.5 text-center font-heading text-base font-medium leading-snug text-[#031F82] transition-all active:cursor-grabbing active:scale-[0.99] sm:min-h-[2.75rem]";

/** Small emoji/icon well inside step cards. */
export const lessonSequenceStepIconClass =
  "flex size-7 shrink-0 items-center justify-center rounded-full bg-[#F0F9FF] text-base leading-none";

/** Empty drop slot — same rounded pill as pool cards. */
export const lessonSequenceSlotClass =
  "relative flex h-full w-full min-h-[2.5rem] items-center rounded-full border-2 border-dashed border-[#BDE9FB]/75 bg-[#F7FBFF]/60 px-3 py-1.5 transition-colors sm:min-h-[2.75rem]";

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
  "flex h-full w-full items-center justify-center gap-2 rounded-full px-3 py-1.5 text-center font-heading text-base font-medium leading-snug text-[#031F82]";

export const lessonSequenceStepBadgeClass =
  "absolute -left-0.5 -top-0.5 z-raised flex size-5 items-center justify-center rounded-full bg-[#031F82] font-heading text-[10px] font-bold leading-none text-white";

export const lessonSequencePoolCompleteClass =
  "col-start-1 row-start-1 flex items-center justify-center rounded-full border border-dashed border-[#BDE9FB]/60 bg-[#F7FBFF]/50";

export const lessonChoiceLayoutClass =
  "flex w-full items-center justify-center rounded-full px-4 py-3 text-center font-heading text-base font-medium leading-snug text-[#031F82] shadow-sm transition-all";

export const lessonChoiceBaseClass = cn(
  lessonChoiceLayoutClass,
  "border-2 border-[#BDE9FB] bg-white hover:bg-[#F7FBFF] active:scale-[0.99]",
);

/** @deprecated Use lessonChoiceBaseClass + lessonChoiceStateClass helpers. */
export const lessonChoiceClass = lessonChoiceBaseClass;

export type LessonChoiceVariant = "neutral" | "correct" | "wrong";

/** Darker inset fill — persists while selected. Correct/wrong use border + icon. */
const lessonChoiceSelectedVariantClass: Record<LessonChoiceVariant, string> = {
  neutral:
    "border-[#066B7C] bg-[#EEF6FC] shadow-[inset_0_4px_12px_rgba(3,31,130,0.12)] translate-y-0.5 scale-[0.99]",
  correct:
    "border-[#16A34A] bg-[#F0FDF4] shadow-sm translate-y-0 scale-100",
  wrong:
    "border-2 border-[#E11D48] bg-[#FFF1F2] shadow-sm ring-2 ring-[#E11D48]/35 translate-y-0 scale-100",
};

export const lessonChoiceLockedCorrectClass =
  "pointer-events-none cursor-default rounded-full border-2 border-[#16A34A] bg-[#F0FDF4] shadow-sm translate-y-0 scale-100";

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
  "flex min-h-[3rem] w-full cursor-grab touch-none select-none items-center justify-center rounded-full border-2 border-[#BDE9FB] bg-white px-4 py-2.5 text-center font-heading text-base font-medium leading-snug text-[#031F82] shadow-sm transition-all active:cursor-grabbing active:scale-[0.995] sm:min-h-[3.25rem]";

/** Rank-order card only (number sits outside in its own column). */
export const lessonRankOrderCardClass =
  "flex min-h-[3rem] w-full min-w-0 flex-1 cursor-grab touch-none select-none items-center justify-center rounded-full border-2 border-[#BDE9FB] bg-white px-4 py-2.5 text-center font-heading text-base font-medium leading-snug text-[#031F82] shadow-sm transition-all active:cursor-grabbing active:scale-[0.995] sm:min-h-[3.25rem]";

export const lessonRankOrderNumberClass =
  "flex w-7 shrink-0 items-center justify-center font-heading text-base font-semibold text-[#0CC1E0]";

/** Compact pill pool chip (word-drop, drag pools). */
export const lessonSortPoolChipClass =
  "inline-flex min-h-[2.75rem] cursor-grab touch-none select-none items-center justify-center rounded-full border-2 border-[#BDE9FB] bg-white px-4 py-2 font-heading text-base font-medium text-[#031F82] shadow-sm transition-all active:cursor-grabbing active:scale-[0.98]";

/** @deprecated Prefer lessonSortRowClass for full-width sort lists. */
export const lessonSortChipClass = lessonSortRowClass;

export const lessonSortBucketClass =
  "min-h-[7rem] rounded-3xl border-2 border-dashed border-[#BDE9FB]/80 bg-[#F7FBFF]/80 p-3 transition-colors sm:min-h-[8rem]";

export const lessonSortBucketActiveClass =
  "border-[#0CC1E0] bg-[#BDE9FB]/35 ring-2 ring-[#0CC1E0]/40";

export const lessonSortBucketErrorClass =
  "border-[#F59E0B] bg-[#FFFBEB]/80 ring-2 ring-[#F59E0B]/30";

export const lessonSortBucketSuccessClass =
  "border-[#16A34A] bg-[#DCFCE7]/40 ring-2 ring-[#22C55E]/35";

export const lessonGoldClaimClass =
  "flex h-touch w-full max-w-md items-center justify-center rounded-full border-2 border-[#C88202] bg-[#FFA503] px-6 py-4 text-center font-heading text-base font-extrabold uppercase tracking-wide text-[#031F82] shadow-md transition-all hover:brightness-[1.02] active:scale-[0.99] disabled:opacity-60";

export const lessonGiftTapClass = cn(
  "flex shrink-0 items-center justify-center rounded-full border-2 border-[#0CC1E0] bg-[#F7FBFF] text-3xl shadow-sm transition-all hover:bg-[#E8F4FC] active:scale-[0.97]",
  "size-16 sm:size-[4.5rem]",
);

export const lessonGiftTapRevealedClass =
  "border-[#22C55E] bg-[#DCFCE7] shadow-[inset_0_3px_8px_rgba(34,197,94,0.16)]";

export const lessonHoldButtonClass =
  "flex h-12 w-full max-w-md select-none items-center justify-center rounded-full border-2 border-[#099FB8] bg-[#0CC1E0] px-6 py-3 text-center font-heading text-base font-semibold uppercase tracking-wide text-[#031F82] shadow-md transition-all hover:brightness-[1.03] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40";

export const lessonHoldButtonCompleteClass =
  "border-[#099FB8] bg-[#0CC1E0] text-[#031F82] opacity-90";

export const LESSON_CASH_IN_LABEL = "[ CASH IN YOUR POINTS ]";

export const lessonSubmitAnswerClass =
  "mx-auto flex h-12 w-full max-w-xs items-center justify-center rounded-full border-2 border-[#099FB8] bg-[#0CC1E0] px-6 py-3 text-center font-heading text-base font-semibold normal-case tracking-normal text-[#031F82] shadow-md transition-all hover:brightness-[1.03] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40";

export const lessonNextButtonClass =
  "mx-auto flex h-12 w-full max-w-md items-center justify-center rounded-full border-2 border-[#099FB8] bg-[#0CC1E0] px-6 py-3 text-center font-heading text-base font-semibold normal-case tracking-normal text-[#031F82] shadow-md transition-all hover:brightness-[1.03] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40";

// ─── Layout surfaces ─────────────────────────────────────────────────────────

export const lessonCardClass =
  "rounded-2xl border-0 bg-white p-3 shadow-md";

export const lessonGameBoardClass = "mt-2 space-y-2";

export const lessonScreenFillClass = "flex min-h-0 flex-1 flex-col";

export const lessonGameAreaClass = "mt-1 flex min-h-0 flex-1 flex-col";

export const lessonChoiceStackClass = "mt-3 space-y-2";

export const lessonTwoColumnGridClass = "grid grid-cols-2 gap-2.5";

// ─── Column labels & section headers ─────────────────────────────────────────

export const lessonColumnLabelClass =
  "font-heading text-sm font-semibold uppercase tracking-wide text-[#0CC1E0]";

export const lessonColumnLabelInkClass =
  "font-heading text-sm font-semibold uppercase tracking-wide text-[#031F82]";

export const lessonColumnLabelSuccessClass =
  "font-heading text-sm font-semibold uppercase tracking-wide text-[#16A34A]";

export const lessonColumnLabelMutedClass =
  "font-heading text-sm font-semibold uppercase tracking-wide text-[#1E3A5F]/50";

// ─── Feedback banners ────────────────────────────────────────────────────────

export const lessonSuccessMessageClass =
  "mt-2 shrink-0 rounded-xl bg-[#DCFCE7] px-3 py-2 font-sans text-sm font-medium leading-relaxed text-[#031F82]";

export const lessonErrorBannerClass =
  "mt-2 shrink-0 rounded-xl bg-[#FFF7ED] px-3 py-2 font-sans text-sm font-medium text-[#031F82]";

export const lessonInlineErrorClass = "mt-3 font-sans text-sm font-medium text-[#E11D48]";

export const lessonGameHintClass =
  "text-center font-sans text-sm font-medium text-[#1E3A5F]/80";

// ─── Match / link rows ───────────────────────────────────────────────────────

/** Incorrect icon-chip selection — global red treatment, no success tick. */
export const lessonWrongSelectionChipClass =
  "border-2 border-[#E11D48] bg-[#FFF1F2] shadow-none ring-2 ring-[#E11D48]/35";

/** Neutral bucket surface for statement-sort (no rush/think red/green tints). */
export const lessonSortBucketNeutralSurfaceClass =
  "border-[#BDE9FB]/80 bg-[#F7FBFF]/90";

export const lessonMatchColumnHeaderGridClass =
  "grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-end gap-x-2 gap-y-1 px-0.5";

export const lessonMatchConnectorSpacerClass = "w-4 shrink-0";

// ─── Reveal buckets & placeholders ───────────────────────────────────────────

export const lessonRevealBucketClass =
  "rounded-3xl border-2 border-dashed border-[#BDE9FB]/70 bg-[#F7FBFF]/50 p-4 transition-colors";

export const lessonImagePlaceholderClass =
  "flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#BDE9FB] bg-[#F7FBFF] px-4 text-center";

/** Modest scene slot below lesson chrome — fixed height for layout stability. */
export const lessonIllustrationSlotClass =
  "mx-auto flex h-[3rem] w-full max-w-[10rem] flex-col items-center justify-center rounded-xl border border-[#BDE9FB]/80 bg-[#F7FBFF]/90 px-2 text-center shadow-sm sm:h-[3.25rem] sm:max-w-[11rem]";

export const lessonIllustrationEmojiClass = "text-2xl leading-none sm:text-[1.75rem]";

export const lessonIllustrationLabelClass =
  "mt-0.5 font-heading text-sm font-medium text-[#1E3A5F]/70";

export const lessonImagePlaceholderCompactClass =
  "flex aspect-square w-full max-w-[8rem] flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#BDE9FB] bg-[#F7FBFF] px-3 text-center";

// ─── Spent-total bar (L3 drag-and-drop) ──────────────────────────────────────

export const lessonSpentTotalBarClass = "py-2 text-center";

export const lessonSpentTotalBarCompleteClass = "py-2 text-center";

export const lessonSpentTotalCaptionClass =
  "font-heading text-sm font-medium text-[#1E3A5F]/70";

export const lessonSpentTotalAmountClass =
  "font-heading text-2xl font-semibold tabular-nums text-[#031F82] sm:text-3xl";

export const lessonSpentTotalLabelClass =
  "font-heading text-sm font-semibold tabular-nums text-white";

export const lessonSpentTotalLabelCompleteClass =
  "font-heading text-sm font-semibold tabular-nums text-[#031F82]";

// ─── Word-drop blank slots ───────────────────────────────────────────────────

export const lessonBlankSlotClass =
  "inline-flex min-h-[2.25rem] min-w-[4.5rem] items-center justify-center rounded-xl border-2 border-dashed border-[#BDE9FB] bg-[#F7FBFF]/80 px-2.5 font-heading text-base font-medium text-[#031F82]";

export const lessonBlankSlotFilledClass =
  "inline-flex min-h-[2.25rem] min-w-[4.5rem] items-center justify-center rounded-xl border-2 border-[#BDE9FB] bg-white px-2.5 font-heading text-base font-medium text-[#031F82] shadow-sm";

export const lessonRangeSliderClass = "lesson-range-slider w-full cursor-pointer";

