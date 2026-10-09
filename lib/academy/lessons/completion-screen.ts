import type { MedalIllustrationId } from "@/lib/academy/illustrations/medal-registry";
import type { CompletionScreenConfig } from "@/lib/academy/lessons/types";

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
