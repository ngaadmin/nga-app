import type { ScreenConfig } from "@/lib/academy/lessons/types";

export function storyClipDurationLabel(durationMs: number): string | null {
  if (!Number.isFinite(durationMs) || durationMs <= 0) return null;
  const totalSeconds = Math.round(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

/** The next story clip after the screen on screen, for a single preload link. */
export function nextStoryAudioSrc(
  screens: readonly ScreenConfig[],
  screenIndex: number,
): string | undefined {
  for (let index = screenIndex + 1; index < screens.length; index += 1) {
    const screen = screens[index];
    if (screen?.type === "narrative-bonus" && screen.audio?.src) {
      return screen.audio.src;
    }
  }
  return undefined;
}
