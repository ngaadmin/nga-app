export type LessonTileSelection = "idle" | "selected" | "correct" | "wrong";

/**
 * Visual state for a choice tile.
 * Position is not an input: the left tile and the right tile use this same result.
 */
export function lessonTileSelection(input: {
  selected: boolean;
  variant: "neutral" | "correct" | "wrong";
}): LessonTileSelection {
  if (!input.selected) return "idle";
  if (input.variant === "correct") return "correct";
  if (input.variant === "wrong") return "wrong";
  return "selected";
}

/** The correct tile, on either side, carries a tick. */
export function lessonTileShowsTick(selection: LessonTileSelection): boolean {
  return selection === "correct";
}
