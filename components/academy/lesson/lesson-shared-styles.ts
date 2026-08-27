import { cn } from "@/lib/utils/cn";
import type { SortBucketTone } from "@/lib/academy/lessons/types/shared-blocks";
import { resolveChoiceSelectionVariant } from "@/lib/academy/lessons/choice-evaluation";

/** Default mistake budget shown as hearts in lesson chrome. */
export const LESSON_MAX_LIVES = 4;

/** Minimum comfortable size for interactive cards, chips, and list rows. */
export const lessonInteractiveTextClass = "text-lg font-medium";

/** Gentle top offset so short screens don't hug the chrome. */
export const lessonScreenContentOffsetClass = "pt-0";

/** Top instructional / prompt copy. */
export const lessonPromptClass =
  "font-heading text-[17px] font-semibold leading-[1.35] text-[#031F82]";

/** Short task directive — same scale as prompt. */
export const lessonInstructionClass =
  "font-heading text-[17px] font-semibold leading-[1.35] text-[#031F82]";

/** Bold call-to-action under intro copy. */
export const lessonCtaClass =
  "font-heading text-[17px] font-bold leading-snug text-[#031F82]";

/** Secondary narrative body copy beneath instructions. */
export const lessonNarrativeClass =
  "font-heading text-[17px] font-semibold leading-[2.15] text-[#031F82]";

/** Small section labels (Round 1 of 3, axis labels). */
export const lessonEyebrowClass =
  "font-heading text-base font-bold text-[#031F82]";

/** Option / answer text inside interactive cards — never larger than prompt. */
export const lessonOptionTextClass =
  "text-left font-sans text-[15px] font-medium leading-[1.3] text-[#031F82]";

/** Labels beneath standalone icon options (tap-reveal, spotlight). */
export const lessonIconLabelClass =
  "text-center font-sans text-[15px] font-semibold leading-[1.3] text-[#031F82]";

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

export const lessonCircleSizeClass = "size-12";

/** Emoji glyph inside circular lesson options. */
export const lessonIconEmojiClass =
  "text-[1.25rem] leading-none";

/** Inline emoji in sort statement cards, placed items, and step pills. */
export const lessonSortItemEmojiClass =
  "shrink-0 text-[1.25rem] leading-none";

/** Monogram fallback when no emoji is provided. */
export const lessonIconMonogramClass =
  "font-heading text-base font-bold uppercase text-[#031F82]";

export const lessonItemChipClass =
  "flex items-center gap-3 border-0 bg-transparent p-0 text-left font-sans text-sm font-medium text-[#031F82]";

export const lessonItemOrbClass =
  "grid size-12 shrink-0 place-items-center rounded-full bg-[#E8F6FC] text-base font-bold text-[#031F82] shadow-[0_4px_10px_rgba(3,31,130,0.08)]";

/** Standard 2-column icon grid for tap / sort pools. */
export const lessonIconGridClass = "mt-3 grid grid-cols-2 gap-4 sm:gap-5";

export const lessonIconOptionStackClass =
  "flex flex-col items-center gap-2.5 text-center";

export const lessonIconTapClass = cn(
  "flex shrink-0 items-center justify-center rounded-full bg-[#E8F6FC] shadow-[0_4px_10px_rgba(3,31,130,0.08)] transition-all active:scale-[0.98]",
  lessonCircleSizeClass,
);

/** Persistent darker sunken state after tap/select. */
export const lessonIconTapSelectedClass =
  "bg-[#16A34A] text-white";

export const lessonSortCircleChipClass = cn(
  "flex shrink-0 cursor-grab items-center justify-center rounded-full border-2 border-[#BDE9FB] bg-white font-heading font-semibold text-[#031F82] shadow-sm transition-all touch-none select-none active:cursor-grabbing active:scale-[0.98]",
  lessonCircleSizeClass,
);

export const lessonSortGridCellClass =
  "flex min-h-[7rem] min-w-0 flex-col items-center justify-start gap-1.5";

export const lessonSortGridChipClass = lessonSortCircleChipClass;

export const lessonSortGridPlaceholderClass = cn(
  "shrink-0 rounded-full border-2 border-transparent bg-[#F7FBFF]/70",
  lessonCircleSizeClass,
);

/** Compact drag pool — same touch target as default (no undersized icons). */
export const lessonSortCompactCircleClass = lessonCircleSizeClass;

export const lessonSortPoolWrapClass =
  "flex flex-wrap justify-center gap-x-4 gap-y-3 sm:gap-x-5 sm:gap-y-4";

export const lessonSortBoardClass = "mt-2 flex min-h-0 flex-1 flex-col gap-2";

export const lessonSortBucketCompactClass = "min-h-[8.5rem]";

/** Statement-sort pool tray — reserved height, items do not collapse the page. */
export const lessonSortPoolStaticClass =
  "shrink-0 bg-transparent px-0 py-2";

/** @deprecated Statement-sort pools must not scroll — use lessonSortPoolStaticClass. */
export const lessonSortPoolScrollClass = lessonSortPoolStaticClass;

/** Two-column pool — equal cells so chips stay put while dragging/dropping. */
export const lessonSortStatementListClass =
  "grid auto-rows-[4.5rem] grid-cols-2 content-start gap-x-6 gap-y-5 [&>*]:min-w-0";

/** Empty grid cell that holds pool height after an item is placed. */
export const lessonSortPoolSlotPlaceholderClass = "min-h-[3rem] w-full";

/** Compact emoji inside statement-sort pool/placed cards. */
export const lessonSortStatementEmojiClass =
  "shrink-0 text-[1.25rem] leading-none";

/** Draggable pool chip — full grid cell, large enough for kids to grab. */
export const lessonSortStatementCardClass =
  "flex min-h-12 w-full cursor-grab touch-none select-none items-center justify-start gap-3 border-0 bg-transparent p-0 text-left font-sans text-sm font-medium leading-snug text-[#031F82] transition-transform active:cursor-grabbing";

/** Horizontal row inside priced sort cards — icon left, text column right. */
export const lessonPricedItemRowClass =
  "flex w-full min-w-0 items-center gap-3";

/** Label + price stack beside the icon in priced sort cards. */
export const lessonPricedItemTextClass =
  "flex min-w-0 flex-1 flex-col items-start justify-center gap-0.5 text-left";

/** Price line under the item name in priced sort cards. */
export const lessonPricedItemPriceClass =
  "font-heading text-base font-extrabold tabular-nums leading-none text-[#0CC1E0]";

/** Draggable priced item card (spent-total bucket-sort) — icon beside text, not stacked. */
export const lessonSpentTotalItemCardClass =
  "flex w-full min-h-[3.25rem] cursor-grab touch-none select-none items-center rounded-2xl border-2 border-[#BDE9FB] bg-white px-3 py-2.5 font-heading text-base font-medium leading-snug text-[#031F82] transition-all active:cursor-grabbing active:scale-[0.99] sm:min-h-[3.5rem]";

/** Read-only spent-total item inside the Spent column. */
export const lessonSpentTotalItemPlacedClass =
  "flex min-h-[3rem] items-center rounded-xl border border-[#BDE9FB]/80 bg-white px-3 py-2 font-heading text-base font-medium leading-snug text-[#031F82] sm:min-h-[3.25rem] sm:py-2.5";

/** Compact read-only card inside a bucket after drop — no nested outline. */
export const lessonSortStatementPlacedClass =
  "flex min-h-12 w-full items-center justify-start gap-3 bg-transparent p-0 text-left font-sans text-sm font-medium leading-snug text-[#031F82]";

export type LessonSortBucketTone = SortBucketTone;

const lessonSortBucketToneSurfaceClass: Record<
  LessonSortBucketTone | "neutral",
  string
> = {
  rush: "bg-[#FEE2E2]",
  think: "bg-[#DCFCE7]",
  want: "bg-[#FEF3C7]",
  need: "bg-[#E0F2FE]",
  short: "bg-[#FFEDD5]",
  long: "bg-[#D1FAE5]",
  neutral: "bg-[#DCEFF9]",
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

/** Step-order / sequence drag board — vertical pool + numbered slots. */
export const lessonSequenceBoardClass =
  "flex min-h-0 flex-1 flex-col touch-none select-none";

/** Outer shell for steps-row ordering screens — no extra board box. */
export const lessonSequenceShellClass =
  "flex min-h-0 flex-1 flex-col gap-2 sm:gap-2.5";

/** Shuffled source pool — top section, collapses when empty. */
export const lessonSequencePoolSectionClass =
  "shrink-0 space-y-1.5 overflow-visible";

/** Numbered drop targets — bottom section, shifts up as pool shrinks. */
export const lessonSequenceDestinationSectionClass = "shrink-0 space-y-1.5";

/** @deprecated Two-column grid removed — use vertical pool + destination layout. */
export const lessonSequenceGridClass =
  "flex min-h-0 flex-1 flex-col gap-1.5";

/** @deprecated */
export const lessonSequenceRowClass = "flex w-full min-w-0";

/** Draggable step card — text only; full-width rounded rectangle for wrapping. */
export const lessonSequenceStepCardClass =
  "flex w-full min-h-[2.75rem] cursor-grab touch-none select-none items-center rounded-2xl border border-[#BDE9FB] bg-white px-3 py-2.5 text-left font-heading text-base font-medium leading-snug text-[#031F82] shadow-sm transition-all active:cursor-grabbing active:scale-[0.99]";

/** Empty drop slot — soft well, no dashed frame around later chips. */
export const lessonSequenceSlotClass =
  "relative flex w-full min-h-[2.75rem] flex-1 items-center rounded-2xl border-2 border-transparent bg-[#F7FBFF]/70 px-3 py-2 transition-colors";

export const lessonSequenceSlotActiveClass =
  "border-[#0CC1E0] bg-[#BDE9FB]/35 ring-2 ring-[#0CC1E0]/40";

export const lessonSequenceSlotErrorClass =
  "border-[#F59E0B] bg-[#FFFBEB]/80 ring-2 ring-[#F59E0B]/30";

export const lessonSequenceSlotLockedClass =
  "border-2 border-[#86EFAC] bg-[#F0FDF4]/80";

export const lessonSequenceSlotFilledClass =
  "border-2 border-[#BDE9FB] bg-white";

/** Placed step inside a slot — text only, matches pool card shape. */
export const lessonSequenceStepPlacedClass =
  "flex h-full w-full items-center rounded-2xl px-3 py-2 text-left font-heading text-base font-medium leading-snug text-[#031F82]";

/** Rank / step index shown outside cards (left column). */
export const lessonSequenceNumberClass =
  "flex w-8 shrink-0 items-center justify-center font-heading text-base font-semibold text-[#0CC1E0]";

/** Row wrapper: number outside + card/slot flex-1. */
export const lessonSequenceNumberedRowClass =
  "flex w-full min-w-0 items-center gap-2.5";

export const lessonChoiceOrbClass =
  "grid size-12 shrink-0 place-items-center rounded-full border-[3px] border-solid border-transparent bg-[#E8F6FC] font-heading text-lg font-bold text-[#031F82]";

/** Complete selected orb — never stacked with lessonChoiceOrbClass (Tailwind bg/text conflicts). */
export const lessonChoiceOrbSelectedClass =
  "grid size-12 shrink-0 place-items-center rounded-full border-[3px] border-solid border-[#031F82] bg-[#0CC1E0] font-heading text-lg font-bold text-white";

export const lessonChoiceOrbCorrectClass =
  "bg-[#16A34A] text-white";

export const lessonChoiceOrbWrongClass =
  "bg-[#E11D48] text-white";

export const lessonChoiceLayoutClass =
  "flex w-full items-center gap-3 border-0 bg-transparent p-0 text-left font-sans text-[15px] font-medium leading-[1.3] text-[#031F82]";

export const lessonChoiceLabelClass =
  "min-w-0 flex-1 font-sans text-[15px] font-medium leading-[1.3] text-[#031F82]";

export const lessonChoiceBaseClass = cn(
  lessonChoiceLayoutClass,
  "cursor-pointer",
);

/** @deprecated Use lessonChoiceBaseClass + lessonChoiceStateClass helpers. */
export const lessonChoiceClass = lessonChoiceBaseClass;

export type LessonChoiceVariant = "neutral" | "correct" | "wrong";

/** Darker inset fill — persists while selected. Correct/wrong use border + icon. */
const lessonChoiceSelectedVariantClass: Record<LessonChoiceVariant, string> = {
  neutral: "",
  correct: "",
  wrong: "",
};

export const lessonChoiceLockedCorrectClass =
  "pointer-events-none cursor-default";

/** Resolve pill/radio variant: only the chosen option gets correct/wrong color. */
export function resolveChoiceVariant(
  isChosen: boolean,
  isCorrect: boolean,
  useNeutralFeedback = false,
): LessonChoiceVariant {
  return resolveChoiceSelectionVariant({
    isSelected: isChosen,
    isCorrect,
    useNeutralFeedback,
  });
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
  "grid w-full min-w-0 grid-cols-[28px_1fr] cursor-grab touch-none select-none items-center gap-2.5 rounded-2xl bg-[#E8F6FC] px-3 py-3.5 font-sans text-[15px] font-medium text-[#031F82] active:cursor-grabbing";

export const lessonRankOrderNumberClass = lessonSequenceNumberClass;

/** Compact pill pool chip (word-drop, drag pools). */
export const lessonSortPoolChipClass =
  "inline-flex min-h-8 cursor-grab touch-none select-none items-center justify-center rounded-full border-0 bg-[#E8F6FC] px-3.5 py-2 font-sans text-[15px] font-semibold text-[#031F82] active:cursor-grabbing";

/** @deprecated Prefer lessonSortRowClass for full-width sort lists. */
export const lessonSortChipClass = lessonSortRowClass;

export const lessonSortBucketClass =
  "min-h-[7rem] rounded-3xl border-2 border-transparent bg-[#F7FBFF]/70 p-3 transition-colors sm:min-h-[8rem]";

export const lessonSortBucketActiveClass =
  "border-[#0CC1E0] bg-[#BDE9FB]/35 ring-2 ring-[#0CC1E0]/40";

export const lessonSortBucketErrorClass =
  "border-[#F59E0B] bg-[#FFFBEB]/80 ring-2 ring-[#F59E0B]/30";

export const lessonSortBucketSuccessClass =
  "border-[#16A34A] bg-[#DCFCE7]/40 ring-2 ring-[#22C55E]/35";

export const lessonGoldClaimClass =
  "mx-auto flex w-1/2 items-center justify-center rounded-2xl border-0 bg-[#FFA503] px-2 py-3 text-center font-heading text-[15px] font-extrabold text-white shadow-[0_5px_0_#C88202] transition-all active:translate-y-0.5 active:shadow-none disabled:opacity-60";

/** Screen 8 completion shell — centred celebration column. */
export const lessonCompletionShellClass =
  "flex min-h-0 w-full flex-1 flex-col items-center justify-start gap-2 px-2 pt-1 text-center";

export const lessonCompletionHeaderClass =
  "font-heading text-xl font-bold text-[#031F82]";

export const lessonCompletionEyebrowClass =
  "font-sans text-[15px] font-normal text-[#031F82]";

export const lessonCompletionSkillLineClass =
  "max-w-[18rem] font-heading text-xl font-bold leading-snug text-[#031F82]";

export const lessonCompletionRewardsCardClass =
  "mt-2 w-full max-w-xs bg-transparent px-0 py-0 shadow-none";

export const lessonCompletionHeroMedalClass =
  "max-h-[11rem] w-full max-w-[11rem] sm:max-h-[14rem] sm:max-w-[14rem]";

export const lessonHoldButtonClass =
  "relative min-w-[148px] h-12 select-none overflow-hidden rounded-full border-0 bg-[#0CC1E0] px-6 text-center font-heading text-base font-bold text-white shadow-[0_5px_0_#099FB8] disabled:cursor-not-allowed disabled:opacity-40";

export const lessonHoldButtonCompleteClass =
  "bg-[#0CC1E0] text-white opacity-90";

export const LESSON_CASH_IN_LABEL = "Cash in your points";

const LESSON_PRIMARY_ACTION_CLASS =
  "mx-auto flex w-1/2 items-center justify-center rounded-2xl border-0 bg-[#0CC1E0] px-3 py-3 text-center font-heading text-lg font-extrabold text-white shadow-[0_5px_0_#099FB8] transition-all active:translate-y-0.5 active:shadow-none disabled:cursor-not-allowed disabled:opacity-35 disabled:shadow-none";

export const lessonNextButtonClass = LESSON_PRIMARY_ACTION_CLASS;

/** Rank-order submit matches the pinned Next control in the lesson footer. */
export const lessonSubmitAnswerClass =
  "mx-auto mt-2.5 flex w-1/2 items-center justify-center rounded-2xl border-0 bg-[#031F82] px-3 py-2.5 text-center font-heading text-[15px] font-extrabold text-white";

// ─── Layout surfaces ─────────────────────────────────────────────────────────

export const lessonCardClass =
  "rounded-2xl border-0 bg-white p-3 shadow-md";

export const lessonGameBoardClass = "mt-2 space-y-2";

export const lessonScreenFillClass = "flex h-full min-h-full flex-1 flex-col";

export const lessonGameAreaClass = "mt-1 flex min-h-0 flex-1 flex-col";

export const lessonChoiceStackClass = "mt-1 flex flex-col gap-4";

export const lessonTwoColumnGridClass = "grid grid-cols-2 gap-2.5";

// ─── Column labels & section headers ─────────────────────────────────────────

export const lessonColumnLabelClass =
  "font-heading text-base font-bold text-[#031F82]";

export const lessonColumnLabelInkClass =
  "font-heading text-base font-bold text-[#031F82]";

export const lessonColumnLabelSuccessClass =
  "font-heading text-base font-semibold uppercase tracking-wide text-[#16A34A]";

export const lessonColumnLabelMutedClass =
  "font-heading text-base font-semibold uppercase tracking-wide text-[#1E3A5F]/50";

// ─── Feedback banners ────────────────────────────────────────────────────────

export const lessonSuccessMessageClass =
  "mt-2 flex shrink-0 items-start gap-2.5 rounded-2xl bg-[#DCFCE7] px-3 py-3 font-sans text-[15px] font-medium leading-relaxed text-[#166534]";

export const lessonErrorBannerClass =
  "mt-2 flex shrink-0 items-start gap-2.5 rounded-2xl bg-[#FFF1F2] px-3 py-3 font-sans text-[15px] font-medium text-[#9F1239]";

export const lessonInlineErrorClass =
  "mt-2 flex items-start gap-2.5 font-sans text-[15px] font-medium text-[#9F1239]";

export const lessonGameHintClass =
  "text-center font-sans text-base font-medium text-[#1E3A5F]/80";

// ─── Match / link rows ───────────────────────────────────────────────────────

/** Incorrect icon-chip selection — global red treatment, no success tick. */
export const lessonWrongSelectionChipClass =
  "border-2 border-[#E11D48] bg-[#FFF1F2] shadow-none ring-2 ring-[#E11D48]/35";

/** Neutral bucket surface for statement-sort (no rush/think red/green tints). */
export const lessonSortBucketNeutralSurfaceClass = "bg-[#EEF6FC]";

/** Destination bucket well — visible tinted drop zone, no dashed nested frame. */
export const lessonSortBucketWellClass =
  "min-h-[9.5rem] rounded-2xl px-2 py-2 ring-1 ring-black/[0.06]";

/** Two equal destination columns — long labels wrap inside, never stretch the grid. */
export const lessonSortBucketRowClass =
  "grid min-h-0 min-w-0 flex-1 grid-cols-2 items-stretch gap-4 [&>*]:min-h-0 [&>*]:min-w-0";

/** Soft drop column / well — fill + label, no dashed outer box. */
export const lessonDropWellClass =
  "rounded-2xl border-2 border-transparent bg-[#F7FBFF]/60 transition-colors";

export const lessonMatchColumnHeaderGridClass =
  "grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-end gap-x-2 gap-y-1 px-0.5";

export const lessonMatchConnectorSpacerClass = "w-4 shrink-0";

// ─── Reveal buckets & placeholders ───────────────────────────────────────────

export const lessonRevealBucketClass =
  "min-h-[9rem] min-w-0 rounded-2xl bg-[#DCEFF9] px-3 py-3 ring-1 ring-black/[0.06] transition-colors";

/**
 * Viewport-capped scene height so illustration + options + footer fit on phones.
 * ~40% of the old 220px cap on a 390×844 screen; shrinks further on short viewports.
 */
export const LESSON_ILLUSTRATION_MAX_HEIGHT_CLASS =
  "max-h-24";

/** Shared layout for top-of-screen lesson media. */
export const lessonIllustrationMediaFrameClass =
  "mb-5 h-24 w-full min-w-0 shrink-0 overflow-hidden rounded-[18px] bg-gradient-to-b from-[#BDE9FB] to-[#E8F6FC]";

/** Modest scene slot below lesson chrome. */
export const lessonIllustrationSlotClass = cn(
  lessonIllustrationMediaFrameClass,
  "grid place-items-center text-center font-heading text-[13px] font-semibold text-[#031F82]",
);

/** Registry image — contained inside the 96px lab slot. */
export const lessonIllustrationImageClass = cn(
  lessonIllustrationMediaFrameClass,
  "block object-contain object-center",
);

/** @deprecated Use `lessonIllustrationImageClass` — wrapper removed; kept for imports. */
export const lessonIllustrationImageSlotClass = lessonIllustrationImageClass;

export const lessonIllustrationEmojiClass = "text-2xl leading-none sm:text-[1.75rem]";

export const lessonIllustrationLabelClass =
  "mt-0.5 max-w-full font-heading text-base font-medium text-[#1E3A5F]/70";

export const lessonImagePlaceholderClass =
  "flex w-full min-w-0 max-w-full min-h-[5rem] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#BDE9FB] bg-[#F7FBFF] px-4 py-3 text-center";

export const lessonImagePlaceholderCompactClass =
  "flex aspect-square w-full min-w-0 max-w-full min-h-[5rem] max-w-[8rem] flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#BDE9FB] bg-[#F7FBFF] px-3 py-2 text-center";

/** Inline media inside games (drag targets, scene blocks). */
export const lessonInlineMediaShellClass =
  "relative w-full min-w-0 max-w-full shrink-0";

export const lessonInlineMediaImageClass =
  "block h-auto max-h-[220px] w-full max-w-full min-h-[3rem] object-contain object-center";

// ─── Spent-total bar (L3 drag-and-drop) ──────────────────────────────────────

export const lessonSpentTotalBarClass = "py-2 text-center";

export const lessonSpentTotalBarCompleteClass = "py-2 text-center";

export const lessonSpentTotalCaptionClass =
  "text-xs font-medium uppercase tracking-wider text-[#1E3A5F]";

export const lessonSpentTotalAmountClass =
  "font-heading text-[22px] font-extrabold tabular-nums text-[#031F82]";

export const lessonSpentTotalLabelClass =
  "font-heading text-sm font-semibold tabular-nums text-white";

export const lessonSpentTotalLabelCompleteClass =
  "font-heading text-sm font-semibold tabular-nums text-[#031F82]";

// ─── Word-drop blank slots ───────────────────────────────────────────────────

export const lessonBlankSlotClass =
  "inline-flex min-h-8 min-w-[86px] items-center justify-center align-middle mx-[3px] border-0 border-b-[3px] border-[#0CC1E0] bg-transparent px-1 font-heading text-[17px] font-semibold text-[#031F82]";

export const lessonBlankSlotFilledClass =
  "inline-flex min-h-8 min-w-[86px] items-center justify-center align-middle mx-[3px] border-0 border-b-[3px] border-[#0CC1E0] bg-transparent px-1 font-heading text-[17px] font-semibold text-[#031F82]";

export const lessonRangeSliderClass = "lesson-range-slider w-full cursor-pointer";

