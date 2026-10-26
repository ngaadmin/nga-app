import {
  getIllustrationPath,
  getPairSheetImagePath,
  isIllustrationId,
} from "@/lib/academy/illustrations/illustration-registry";
import { isPairedZoneSortScreen } from "@/lib/academy/lessons/paired-zone-sort";
import type { LessonIllustration } from "@/lib/academy/lessons/types/declarative";
import {
  isMultipleChoiceScreen,
  type ScreenConfig,
} from "@/lib/academy/lessons/types";

/** Dense interaction screens omit the shared illustration slot (see `docs/academy-screen-types.md`). */
const DENSE_LESSON_SCREEN_TYPES = new Set<ScreenConfig["type"]>([
  "tap-reveal",
  "bucket-sort",
  "savings-goal",
  "budget-select",
  "completion",
]);

function isRadioListChoiceScreen(screen: ScreenConfig): boolean {
  return isMultipleChoiceScreen(screen) && screen.optionLayout === "radio-list";
}

/** True when the screen type should not render `LessonIllustrationSlot`. */
export function isDenseLessonScreen(screen: ScreenConfig): boolean {
  return (
    DENSE_LESSON_SCREEN_TYPES.has(screen.type) || isRadioListChoiceScreen(screen)
  );
}

function pairSheetFileName(value: ScreenConfig["pairImage"]): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function radioListHasPicture(screen: ScreenConfig): boolean {
  if (pairSheetFileName(screen.pairImage)) return true;
  if (screen.illustration?.src) return true;
  if (screen.illustrationId) return true;
  return false;
}

const STEP_SETTING = /^STEP\d+\s*:/i;
const SPENT_SETTING = /^SPENT\s*:/i;
const TWO_BUCKET_SETTING = /^(SHORT|LONG|NEED|WANT|YES|NO|RUSHING|THINKING)\s*:/i;

function settingLines(settings: string): string[] {
  return settings.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}

/**
 * Lightning rounds and two-bucket sorts keep a picture name on the row and
 * do not paint it. Step order and the spent total still do.
 */
export function payloadGameDropsNamedPicture(
  gameType: string,
  settings: string,
): boolean {
  if (gameType === "spotlight-rounds") return true;
  if (gameType !== "bucket-sort") return false;
  const lines = settingLines(settings);
  if (lines.some((line) => STEP_SETTING.test(line) || SPENT_SETTING.test(line))) {
    return false;
  }
  const buckets = new Set<string>();
  for (const line of lines) {
    const match = TWO_BUCKET_SETTING.exec(line);
    if (match?.[1]) buckets.add(match[1].toUpperCase());
  }
  return buckets.size === 2;
}

/** Resolved screen whose payload picture is kept on the row and never painted. */
export function screenDropsNamedPicture(screen: ScreenConfig): boolean {
  if (screen.type === "spotlight-rounds") return true;
  return screen.type === "bucket-sort" && isPairedZoneSortScreen(screen);
}

/** True when the shared top illustration slot is part of this screen template. */
export function supportsLessonScreenIllustration(
  screen: ScreenConfig,
): boolean {
  if (screenDropsNamedPicture(screen)) return false;
  // Other bucket-sort layouts own their picture inside the game, not in chrome.
  if (screen.type === "bucket-sort") return false;
  if (screen.pairImage === false) return false;
  if (pairSheetFileName(screen.pairImage)) return true;
  if (isRadioListChoiceScreen(screen)) return radioListHasPicture(screen);
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
  if (screenDropsNamedPicture(screen) || screen.pairImage === false) {
    return undefined;
  }

  const pairFile = pairSheetFileName(screen.pairImage);
  if (pairFile) {
    const src = getPairSheetImagePath(pairFile);
    if (!src) return undefined;
    return {
      src,
      alt:
        screen.illustration?.alt ??
        screen.illustration?.label ??
        pairFile.replace(/[-_]/g, " ").replace(/\.[a-z0-9]+$/i, ""),
      ...(screen.illustration?.label ? { label: screen.illustration.label } : {}),
      scale: screen.illustration?.scale,
    };
  }

  if (isDenseLessonScreen(screen) && !isRadioListChoiceScreen(screen)) {
    return undefined;
  }

  const fromRegistry = resolveRegistryIllustration(screen);
  if (fromRegistry) {
    return fromRegistry;
  }

  if (screen.illustration) {
    return screen.illustration;
  }

  if (
    isMultipleChoiceScreen(screen) &&
    screen.optionLayout !== "radio-list" &&
    screen.imagePlaceholder
  ) {
    return imagePlaceholderToIllustration(screen.imagePlaceholder);
  }

  return undefined;
}
