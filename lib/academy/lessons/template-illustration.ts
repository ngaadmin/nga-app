import { isPairedZoneSortScreen } from "@/lib/academy/lessons/paired-zone-sort";
import type { ScreenConfig } from "@/lib/academy/lessons/types";

/**
 * Whether a lesson template paints a picture.
 * The lesson runner, the asset check, and the master reader all read this.
 * `false` means no illustration slot, in every cohort. Anything not listed
 * keeps its picture.
 *
 * bucket-sort is one template with variants. The two-bucket sort and the
 * spent-total (items that add up) variant do not paint. Step order does.
 */
export const TEMPLATE_HAS_ILLUSTRATION = {
  "spotlight-rounds": false,
  "link-match": false,
  /** Tap two-bucket sort. Same zones as the drag two-bucket sort. */
  "tap-reveal": false,
  "bucket-sort": {
    paired: false,
    "spent-total": false,
    "steps-row": true,
  },
} as const;

const STEP_SETTING = /^STEP\d+\s*:/i;
const SPENT_SETTING = /^SPENT\s*:/i;
const TWO_BUCKET_SETTING = /^(SHORT|LONG|NEED|WANT|YES|NO|RUSHING|THINKING)\s*:/i;

function settingLines(settings: string): string[] {
  return settings
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

/** Which bucket-sort variant a settings cell is, before the screen is built. */
export function bucketSortVariantFromSettings(
  settings: string,
): "steps-row" | "spent-total" | "paired" | "other" {
  const lines = settingLines(settings);
  if (lines.some((line) => STEP_SETTING.test(line))) return "steps-row";
  if (lines.some((line) => SPENT_SETTING.test(line))) return "spent-total";
  const buckets = new Set<string>();
  for (const line of lines) {
    const match = TWO_BUCKET_SETTING.exec(line);
    if (match?.[1]) buckets.add(match[1].toUpperCase());
  }
  if (buckets.size === 2) return "paired";
  return "other";
}

function bucketSortVariantFromScreen(
  screen: Extract<ScreenConfig, { type: "bucket-sort" }>,
): "steps-row" | "spent-total" | "paired" | "other" {
  if (screen.layout === "steps-row") return "steps-row";
  if (screen.layout === "spent-total") return "spent-total";
  if (isPairedZoneSortScreen(screen)) return "paired";
  return "other";
}

/** True when this template's declaration says it has no picture. */
export function templateOmitsIllustration(
  gameType: string,
  variant?: "steps-row" | "spent-total" | "paired" | "other",
): boolean {
  if (gameType === "bucket-sort") {
    if (variant !== "steps-row" && variant !== "spent-total" && variant !== "paired") {
      return false;
    }
    return TEMPLATE_HAS_ILLUSTRATION["bucket-sort"][variant] === false;
  }
  if (
    gameType === "spotlight-rounds" ||
    gameType === "link-match" ||
    gameType === "tap-reveal"
  ) {
    return TEMPLATE_HAS_ILLUSTRATION[gameType] === false;
  }
  return false;
}

/** Sheet row: game type plus the settings cell. */
export function payloadOmitsIllustration(gameType: string, settings: string): boolean {
  if (gameType === "bucket-sort") {
    return templateOmitsIllustration(gameType, bucketSortVariantFromSettings(settings));
  }
  return templateOmitsIllustration(gameType);
}

/** Resolved screen. Same declaration as `payloadOmitsIllustration`. */
export function screenOmitsIllustration(screen: ScreenConfig): boolean {
  if (screen.type === "bucket-sort") {
    return templateOmitsIllustration(screen.type, bucketSortVariantFromScreen(screen));
  }
  return templateOmitsIllustration(screen.type);
}
