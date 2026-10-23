import { isModuleCloserLessonNumber } from "@/lib/dashboard/academy-state";
import {
  moduleCloserPresentedMedal,
  resolveCompletionMedalId,
  type MedalIllustrationId,
} from "@/lib/academy/illustrations/medal-registry";
import { moduleCloserSkillNames } from "@/lib/skills/lesson-skill-award";
import type { CompletionScreenConfig } from "@/lib/academy/lessons/types";

export type PresentedCompletionMedal = {
  medalId: MedalIllustrationId;
  skillSlug?: string;
};

/**
 * Medals the completion pane actually shows.
 * `MEDAL: none` suppresses the lesson-number fallback.
 * Lesson 9 shows one gold medal. The three skill names are
 * `moduleCloserGoldSkillLine`, not three medal pictures.
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
    const medal = moduleCloserPresentedMedal(args.moduleNumber ?? 1);
    return medal ? [medal] : [];
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

/** Lesson 9 close copy: one gold medal, three registry skill names. */
export function moduleCloserGoldSkillLine(moduleNumber: number): {
  medal: "🥇";
  text: string;
  names: string[];
} | null {
  const names = moduleCloserSkillNames(moduleNumber);
  if (names.length === 0) return null;
  return {
    medal: "🥇",
    text: `Turned gold: ${names.join(", ")}`,
    names,
  };
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
