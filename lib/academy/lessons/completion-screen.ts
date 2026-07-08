import type { CompletionScreenConfig } from "@/lib/academy/lessons/types";

/**
 * Screen 8 — Explorer pattern.
 * Uses LessonCompletionPane: dynamic XP, perfect-streak bonus, bronze skill line.
 * Footer button label comes from LESSON_CASH_IN_LABEL via getCompletionFooterLabel().
 *
 * When overriding a teen base screen, use `{ _replace: true, ...explorerCompletionScreen() }`.
 */
export function explorerCompletionScreen(
  id = "milestone-splash",
): CompletionScreenConfig {
  return {
    type: "completion",
    id,
    useStandardPane: true,
  };
}

/**
 * Screen 8 — Pathfinder / Maverick pattern.
 * Fixed copy with explicit XP line; footer uses returnButtonLabel.
 * Bronze unlock still runs in useLessonFlow.handleCashInPoints().
 */
export function teenCompletionScreen(options: {
  skillTitle: string;
  xpReward: number;
  id?: string;
  returnButtonLabel?: string;
}): CompletionScreenConfig {
  return {
    type: "completion",
    id: options.id ?? "milestone-splash",
    skillLearnedLabel: `Skill Learned: ${options.skillTitle}`,
    pointsLabel: `Lesson points earned: ${options.xpReward} XP`,
    returnButtonLabel:
      options.returnButtonLabel ?? "Return to Learning Journey",
    useStandardPane: false,
  };
}
