import {
  getIllustrationPath,
  isIllustrationId,
} from "@/lib/academy/illustrations/illustration-registry";
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
  "bucket-sort",
]);

/** True when the screen type should not render `LessonIllustrationSlot`. */
export function isDenseLessonScreen(screen: ScreenConfig): boolean {
  return DENSE_LESSON_SCREEN_TYPES.has(screen.type);
}

/** True when the shared top illustration slot is part of this screen template. */
export function supportsLessonScreenIllustration(
  screen: ScreenConfig,
): boolean {
  return !isDenseLessonScreen(screen);
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

function humanizeIllustrationId(id: string): string {
  return id.replace(/-/g, " ");
}

function resolveRegistryIllustration(
  screen: ScreenConfig,
): LessonIllustration | undefined {
  const { illustrationId, illustration: legacy } = screen;
  if (!illustrationId || !isIllustrationId(illustrationId)) {
    return undefined;
  }

  return {
    src: getIllustrationPath(illustrationId),
    alt: legacy?.alt ?? humanizeIllustrationId(illustrationId),
    emoji: legacy?.emoji,
    label: legacy?.label,
    scale: legacy?.scale,
  };
}

/** Shared rule: illustration slot only on lighter screen types, when content defines one. */
export function resolveLessonScreenIllustration(
  screen: ScreenConfig,
): LessonIllustration | undefined {
  if (isDenseLessonScreen(screen)) {
    return undefined;
  }

  const fromRegistry = resolveRegistryIllustration(screen);
  if (fromRegistry) {
    return fromRegistry;
  }

  if (screen.illustration) {
    return screen.illustration;
  }

  if (screen.type === "binary-choice" && screen.imagePlaceholder) {
    return imagePlaceholderToIllustration(screen.imagePlaceholder);
  }

  return undefined;
}
