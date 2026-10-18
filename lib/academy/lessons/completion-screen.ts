import { isModuleCloserLessonNumber } from "@/lib/dashboard/academy-state";
import {
  moduleCloserGoldMedals,
  resolveCompletionMedalId,
  type MedalIllustrationId,
} from "@/lib/academy/illustrations/medal-registry";
import type { CompletionScreenConfig } from "@/lib/academy/lessons/types";

export type PresentedCompletionMedal = {
  medalId: MedalIllustrationId;
  skillSlug?: string;
};

/**
 * Medals the completion pane actually shows.
 * `MEDAL: none` suppresses the lesson-number fallback.
 * Lesson 9 golds all three module skills.
 */
export function presentedCompletionMedals(args: {
  lessonNumber?: number;
  moduleNumber?: number;
  skillNumber?: number;
  skillMedalTier?: "unlocked" | "bronze" | "silver" | "gold" | null;
  medalId?: MedalIllustrationId;
  authoredMedal?: boolean;
  suppressMedal?: boolean;
}): PresentedCompletionMedal[] {
  if (args.suppressMedal) return [];
  if (
    typeof args.lessonNumber === "number" &&
    isModuleCloserLessonNumber(args.lessonNumber)
  ) {
    return moduleCloserGoldMedals(args.moduleNumber ?? 1);
  }
  const medalId =
    args.authoredMedal && args.medalId
      ? args.medalId
      : resolveCompletionMedalId({
          medalId: args.medalId,
          lessonNumber: args.lessonNumber,
          moduleNumber: args.moduleNumber,
          skillNumber: args.skillNumber,
          tier: args.skillMedalTier,
        });
  return medalId ? [{ medalId }] : [];
}

/**
 * Screen 8 — every cohort.
 * LessonCompletionPane shows 100 XP plus a 50 XP perfect-streak bonus.
 */
export function explorerCompletionScreen(
  id = "milestone-splash",
  medalId?: MedalIllustrationId,
): CompletionScreenConfig {
  return {
    type: "completion",
    id,
    useStandardPane: true,
    ...(medalId ? { medalId } : {}),
  };
}

/**
 * Same completion pane as Explorer. Pathfinder / Maverick no longer use a
 * smaller cash-in amount.
 */
export function teenCompletionScreen(options: {
  skillTitle: string;
  id?: string;
  returnButtonLabel?: string;
  medalId?: MedalIllustrationId;
}): CompletionScreenConfig {
  return {
    ...explorerCompletionScreen(options.id, options.medalId),
    skillLearnedLabel: `Skill Learned: ${options.skillTitle}`,
    ...(options.returnButtonLabel
      ? { returnButtonLabel: options.returnButtonLabel }
      : {}),
  };
}
