import type { ScreenConfig } from "@/lib/academy/lessons/types";

const ZONE_ORDER = ["want", "short", "yes", "need", "long", "no"] as const;

/**
 * Side-by-side tinted zones.
 * Tap-reveal is the demo. Two-bucket drag sorts (Short Fun, Needs/Wants, Yes/No)
 * use the same layout. Step order and the single Spent bucket stay on their own games.
 */
export function isPairedZoneSortScreen(screen: ScreenConfig | undefined): boolean {
  if (!screen) return false;
  if (screen.type === "tap-reveal") return true;
  if (screen.type !== "bucket-sort") return false;
  if (screen.layout === "steps-row" || screen.layout === "spent-total") return false;
  return screen.buckets.length === 2;
}

export function isRoomyLessonScreen(screen: ScreenConfig | undefined): boolean {
  if (!screen) return false;
  return screen.type === "allocation-slider" || isPairedZoneSortScreen(screen);
}

/**
 * True when items arrive in one run per zone, in that zone order.
 * Want-then-need (or short-then-long) is the grouped start the shuffle should skip.
 */
export function itemsGroupedLikeZones<T extends { bucket: string }>(
  items: readonly T[],
  zoneIds: readonly string[],
): boolean {
  if (items.length < 2 || zoneIds.length < 2) return false;
  const runs: string[] = [];
  for (const item of items) {
    if (runs[runs.length - 1] !== item.bucket) runs.push(item.bucket);
  }
  return (
    runs.length === zoneIds.length &&
    runs.every((bucket, index) => bucket === zoneIds[index])
  );
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

