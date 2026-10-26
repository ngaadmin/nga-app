import {
  getIllustrationPath,
  getPairSheetImagePath,
  isIllustrationId,
} from "@/lib/academy/illustrations/illustration-registry";
import { needsWantsPortrait } from "@/lib/academy/lessons/paired-zone-sort";
import { resolveLessonScreenIllustration } from "@/lib/academy/lessons/resolve-lesson-screen-illustration";
import type { ScreenConfig } from "@/lib/academy/lessons/types";

function addSrc(srcs: string[], seen: Set<string>, src: string | undefined): void {
  if (!src || seen.has(src)) return;
  seen.add(src);
  srcs.push(src);
}

function dragArtSrc(fileName?: string, illustrationId?: string): string | undefined {
  if (fileName) return getPairSheetImagePath(fileName);
  if (illustrationId && isIllustrationId(illustrationId)) {
    return getIllustrationPath(illustrationId);
  }
  return undefined;
}

function celebratingPortraitSrc(leadName?: string): string {
  const trimmed = leadName?.trim();
  const id = trimmed ? `${trimmed.toLowerCase()}-celebrating` : "";
  if (id && isIllustrationId(id)) return getIllustrationPath(id);
  return getIllustrationPath("lars-celebrating");
}

/**
 * Every scene, drag, sort, and close portrait the lesson player can paint.
 * The player asks for these when the lesson opens, before each screen mounts.
 */
export function lessonImageSrcs(
  screens: readonly ScreenConfig[],
  leadName?: string,
): string[] {
  const srcs: string[] = [];
  const seen = new Set<string>();

  for (const screen of screens) {
    addSrc(srcs, seen, resolveLessonScreenIllustration(screen)?.src);

    if (screen.type === "drag-to-target") {
      addSrc(srcs, seen, dragArtSrc(screen.sourceImageFile, screen.sourceIllustrationId));
      addSrc(srcs, seen, dragArtSrc(screen.targetImageFile, screen.targetIllustrationId));
    }

    if (
      screen.type === "bucket-sort" &&
      screen.buckets.some((bucket) => bucket.id === "want" || bucket.id === "need")
    ) {
      const intro = [screen.intro, screen.cta].filter(Boolean).join("\n");
      addSrc(srcs, seen, needsWantsPortrait(intro).src);
    }

    if (screen.type === "completion") {
      addSrc(srcs, seen, screen.medalSrc);
      addSrc(srcs, seen, celebratingPortraitSrc(leadName));
    }
  }

  return srcs;
}
