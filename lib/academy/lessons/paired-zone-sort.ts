import type { ScreenConfig } from "@/lib/academy/lessons/types";

const ZONE_ORDER = ["want", "short", "need", "long"] as const;

/** Side-by-side tinted zones: Needs/Wants drag, and Short Fun tap-reveal. */
export function isPairedZoneSortScreen(screen: ScreenConfig | undefined): boolean {
  if (!screen) return false;
  if (screen.type === "tap-reveal") return true;
  if (screen.type !== "bucket-sort") return false;
  const ids = new Set(screen.buckets.map((bucket) => bucket.id));
  return ids.has("want") && ids.has("need");
}

export function isRoomyLessonScreen(screen: ScreenConfig | undefined): boolean {
  if (!screen) return false;
  return screen.type === "allocation-slider" || isPairedZoneSortScreen(screen);
}

/** Wants and Short Fun sit on the left. Needs and More Fun sit on the right. */
export function orderPairedZones<T extends { id: string }>(buckets: readonly T[]): T[] {
  return [...buckets].sort((left, right) => {
    const leftIndex = ZONE_ORDER.indexOf(left.id as (typeof ZONE_ORDER)[number]);
    const rightIndex = ZONE_ORDER.indexOf(right.id as (typeof ZONE_ORDER)[number]);
    return (leftIndex === -1 ? 99 : leftIndex) - (rightIndex === -1 ? 99 : rightIndex);
  });
}

export function pairedZoneEmoji(bucketId: string): string | undefined {
  if (bucketId === "want") return "🎈";
  if (bucketId === "need") return "🛠️";
  if (bucketId === "short") return "⚡";
  if (bucketId === "long") return "🌈";
  return undefined;
}

/** One paragraph per sentence, keeping a newline the author already wrote. */
export function sortPromptLines(text: string): string[] {
  return text
    .split(/\n+/)
    .flatMap((line) => line.split(/(?<=[.!?])\s+(?=[A-Z"'“])/))
    .map((line) => line.trim())
    .filter(Boolean);
}

/** Needs/Wants portrait. Short Fun does not use one. Lars is the fallback. */
export function needsWantsPortrait(intro: string): { src: string; alt: string } {
  const name = /\b(Holly|Aiden)\b/.exec(intro)?.[1] ?? "Lars";
  const file = name.toLowerCase();
  return {
    src: `/assets/illustrations/characters/${file}/${file}-thinking-512.webp`,
    alt: `${name} thinking`,
  };
}
