import { cn } from "@/lib/utils/cn";

/** Layout shared by default and locked lesson choice tiles. */
export const lessonChoiceLayoutClass =
  "w-full rounded-2xl px-4 py-4 text-left font-heading text-sm font-bold text-[#031F82] shadow-sm transition-colors";

/** Base tile for lesson multiple-choice and sort chips. */
export const lessonChoiceBaseClass =
  `${lessonChoiceLayoutClass} border-2 border-b-4 border-[#BDE9FB] bg-white hover:bg-[#BDE9FB]/20 active:translate-y-[2px] active:border-b-2`;

/** @deprecated Use lessonChoiceBaseClass + lessonChoiceSelectedClass helpers. */
export const lessonChoiceClass = lessonChoiceBaseClass;

export type LessonChoiceVariant = "neutral" | "correct" | "wrong";

const lessonChoiceSelectedVariantClass: Record<LessonChoiceVariant, string> = {
  neutral:
    "translate-y-[3px] border-b-0 border-[#099FB8] bg-[#7AD4E8]/45 shadow-[inset_0_4px_8px_rgba(3,31,130,0.24)]",
  correct:
    "translate-y-[3px] border-b-0 border-[#16A34A] bg-[#86EFAC]/75 shadow-[inset_0_4px_8px_rgba(22,101,52,0.28)]",
  wrong:
    "translate-y-[3px] border-b-0 border-[#E11D48] bg-[#FDA4AF]/70 shadow-[inset_0_4px_8px_rgba(190,18,60,0.24)]",
};

/** Locked-in correct (multi-select): hover blue fill + navy border — standalone, no base class. */
export const lessonChoiceLockedCorrectClass =
  "pointer-events-none cursor-default border-2 border-[#031F82] bg-[#BDE9FB]/20 hover:bg-[#BDE9FB]/20 translate-y-[1px] shadow-[inset_0_2px_4px_rgba(3,31,130,0.1)]";

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

export const lessonSortChipClass =
  "cursor-grab touch-none select-none rounded-xl border-2 border-b-4 border-[#BDE9FB] bg-white px-3 py-3 text-center font-heading text-xs font-bold text-[#031F82] shadow-sm transition-shadow active:cursor-grabbing active:translate-y-[1px] active:border-b-2";

export const lessonSortBucketClass =
  "min-h-[8.5rem] rounded-2xl border-2 border-dashed border-[#BDE9FB]/80 bg-[#F7FBFF]/80 p-3 transition-colors";

export const lessonSortBucketActiveClass =
  "border-[#0CC1E0] bg-[#BDE9FB]/35 ring-2 ring-[#0CC1E0]/40";

export const lessonSortBucketSuccessClass =
  "border-[#16A34A] bg-[#DCFCE7]/40 ring-2 ring-[#22C55E]/35";

export const lessonSortBucketErrorClass =
  "border-[#E11D48] bg-[#FEE2E2]/40 ring-2 ring-[#E11D48]/35";

export const lessonGoldClaimClass =
  "h-touch w-full max-w-md rounded-nga-lg border-b-4 border-[#9A5F00] bg-gradient-to-br from-[#FFE082] via-[#FFA503] to-[#C88202] px-6 font-heading text-sm font-bold uppercase tracking-wide text-[#031F82] shadow-[0_6px_16px_rgba(255,165,3,0.45)] transition-all hover:brightness-[1.03] active:translate-y-[2px] active:border-b-2";

export const LESSON_CASH_IN_LABEL = "[ CASH IN YOUR POINTS ]";

export const lessonSubmitAnswerClass =
  "h-touch w-full max-w-xs rounded-nga-lg border-b-4 border-[#4338CA] bg-[#6366F1] px-6 font-heading text-sm font-bold uppercase tracking-wide text-white shadow-md transition-all hover:brightness-[1.05] active:translate-y-[2px] active:border-b-2";

/** Green success copy shown after a correct lesson interaction. */
export const lessonSuccessMessageClass =
  "mt-4 rounded-xl bg-[#DCFCE7] px-3 py-2 font-sans text-xs text-[#031F82]";
