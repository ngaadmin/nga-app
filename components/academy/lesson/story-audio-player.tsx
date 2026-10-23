"use client";

import { useEffect, useState } from "react";
import { storyClipDurationLabel } from "@/lib/academy/lessons/story-audio/next-clip";
import {
  installStoryAudioFallback,
  playStoryClipFromGesture,
  playStoryClipOnScreen,
  readStoryMuted,
  storyAudioElement,
} from "@/lib/academy/lessons/story-audio/playback";
import { STORY_AUDIO_MUTED_KEY } from "@/lib/academy/lessons/story-audio/audio-base";
import { LAYER_CLASS } from "@/lib/ui/layers";
import { cn } from "@/lib/utils/cn";

type StoryAudioPlayerProps = {
  clip?: { src: string; durationMs: number };
  preloadSrc?: string;
  /** The footer is taller when a credit sits above Next. */
  aboveCredit?: boolean;
};

function writeMuted(muted: boolean): void {
  try {
    window.localStorage.setItem(STORY_AUDIO_MUTED_KEY, muted ? "1" : "0");
  } catch {
    // A private window can refuse storage. Playback still works for this visit.
  }
}

/**
 * One narration player for the lesson. Text stays on the story screen.
 * A beat plays when it opens, after the lesson tap has unlocked sound.
 */
export function StoryAudioPlayer({ clip, preloadSrc, aboveCredit = false }: StoryAudioPlayerProps) {
  const [ready, setReady] = useState(false);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    storyAudioElement();
    setMuted(readStoryMuted());
    setReady(true);
    return installStoryAudioFallback();
  }, []);

  useEffect(() => {
    const element = storyAudioElement();
    if (!element) return;
    element.muted = muted;
  }, [muted, ready]);

  useEffect(() => {
    if (!ready) return;
    void playStoryClipOnScreen(clip?.src);
  }, [clip?.src, ready]);

  const replay = () => {
    if (!clip?.src) return;
    playStoryClipFromGesture(clip.src);
  };

  const toggleMuted = () => {
    setMuted((current) => {
      const next = !current;
      writeMuted(next);
      const element = storyAudioElement();
      if (element) element.muted = next;
      return next;
    });
  };

  const lengthLabel = clip ? storyClipDurationLabel(clip.durationMs) : null;

  return (
    <>
      {preloadSrc ? <link rel="preload" as="audio" href={preloadSrc} /> : null}
      {clip ? (
        <div
          className={cn(
            "pointer-events-none absolute inset-x-0 flex justify-center px-5",
            aboveCredit ? "bottom-28" : "bottom-20",
            LAYER_CLASS.chrome,
          )}
        >
          <div className="pointer-events-auto flex items-center gap-2 rounded-full bg-white/95 px-3 py-1.5 shadow-sm ring-1 ring-[#031F82]/10">
            <button
              type="button"
              onClick={replay}
              className="font-sans text-sm font-semibold text-[#031F82]"
            >
              Replay
            </button>
            {lengthLabel ? (
              <span className="font-sans text-xs font-medium text-[#5A6A99]">{lengthLabel}</span>
            ) : null}
            <button
              type="button"
              onClick={toggleMuted}
              aria-pressed={muted}
              className="font-sans text-sm font-semibold text-[#031F82]"
            >
              {muted ? "Sound off" : "Sound on"}
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
