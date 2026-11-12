"use client";

import { useEffect, useState } from "react";
import { storyClipDurationLabel } from "@/lib/academy/lessons/story-audio/next-clip";
import {
  installStoryAudioFallback,
  playStoryClipFromGesture,
  playStoryClipOnScreen,
  stopStoryAudio,
  storyAudioElement,
} from "@/lib/academy/lessons/story-audio/playback";
import { LAYER_CLASS } from "@/lib/ui/layers";
import { cn } from "@/lib/utils/cn";

type StoryAudioPlayerProps = {
  clip?: { src: string; durationMs: number };
  preloadSrc?: string;
  /** The footer is taller when a credit sits above Next. */
  aboveCredit?: boolean;
  /** In the lesson footer, on its own row. Academy beats keep the floating pill. */
  inline?: boolean;
};

/**
 * Narration for the lesson. Text stays on the story screen.
 * A beat plays when it opens, after the lesson tap has unlocked sound.
 * Sound on or off is the master switch, not a control on this pill.
 */
export function StoryAudioPlayer({ clip, preloadSrc, aboveCredit = false, inline = false }: StoryAudioPlayerProps) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    storyAudioElement();
    setReady(true);
    const removeFallback = installStoryAudioFallback();
    return () => {
      removeFallback();
      stopStoryAudio();
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    void playStoryClipOnScreen(clip?.src);
  }, [clip?.src, ready]);

  const replay = () => {
    if (!clip?.src) return;
    playStoryClipFromGesture(clip.src);
  };

  const lengthLabel = clip ? storyClipDurationLabel(clip.durationMs) : null;

  return (
    <>
      {preloadSrc ? <link rel="preload" as="audio" href={preloadSrc} /> : null}
      {clip ? (
        <div
          data-story-player=""
          className={cn(
            "flex justify-center",
            inline
              ? "relative mb-2"
              : cn("pointer-events-none absolute inset-x-0 px-5", aboveCredit ? "bottom-[8rem]" : "bottom-28", LAYER_CLASS.chrome),
          )}
        >
          <div className={cn("flex items-center gap-2 rounded-full bg-white/95 px-3 py-1 shadow-sm ring-1 ring-[#031F82]/10", inline ? "" : "pointer-events-auto")}>
            <button
              type="button"
              data-story-replay=""
              onClick={replay}
              className={cn("font-sans font-semibold text-[#031F82]", inline ? "text-[16px] leading-[23px]" : "text-sm")}
            >
              Replay
            </button>
            {lengthLabel ? (
              <span className={cn("font-sans font-medium text-[#5A6A99]", inline ? "text-[16px] leading-[23px]" : "text-xs")}>{lengthLabel}</span>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
