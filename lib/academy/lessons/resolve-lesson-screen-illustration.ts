import type { LessonIllustration } from "@/lib/academy/lessons/types/declarative";
import type { ScreenConfig } from "@/lib/academy/lessons/types";

/** Dense interaction screens omit the shared illustration slot (see `docs/academy-screen-types.md`). */
const DENSE_LESSON_SCREEN_TYPES = new Set<ScreenConfig["type"]>([
  "tap-reveal",
  "link-match",
  "rank-order",
  "spotlight-rounds",
  "savings-goal",
  "allocation-slider",
  "budget-select",
  "completion",
]);

/** True when the screen type should not render `LessonIllustrationSlot`. */
export function isDenseLessonScreen(screen: ScreenConfig): boolean {
  if (screen.type === "bucket-sort") {
    return screen.layout !== "steps-row";
  }

  return DENSE_LESSON_SCREEN_TYPES.has(screen.type);
}

type ImagePlaceholderLike = {
  label: string;
  alt?: string;
  emoji?: string;
};

function imagePlaceholderToIllustration(
  placeholder: ImagePlaceholderLike,
): LessonIllustration {
  return {
    label: placeholder.label,
    alt: placeholder.alt,
    emoji: placeholder.emoji,
  };
}

/** Shared rule: illustration slot only on lighter screen types, when content defines one. */
export function resolveLessonScreenIllustration(
  screen: ScreenConfig,
): LessonIllustration | undefined {
  if (isDenseLessonScreen(screen)) {
    return undefined;
  }

  if (screen.illustration) {
    return screen.illustration;
  }

  if (screen.type === "binary-choice" && screen.imagePlaceholder) {
    return imagePlaceholderToIllustration(screen.imagePlaceholder);
  }

  return undefined;
}
