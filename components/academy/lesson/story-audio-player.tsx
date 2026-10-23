"use client";

import { useEffect, useState } from "react";
import { storyClipDurationLabel } from "@/lib/academy/lessons/story-audio/next-clip";
import {
  installStoryAudioFallback,
  playStoryClipFromGesture,
  playStoryClipOnScreen,
  readStoryMuted,
  stopStoryAudio,
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
    const removeFallback = installStoryAudioFallback();
    return () => {
      removeFallback();
      stopStoryAudio();
    };
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
    const next = !muted;
    writeMuted(next);
    setMuted(next);
    if (next) {
      void playStoryClipOnScreen(clip?.src);
      return;
    }
    if (clip?.src) playStoryClipFromGesture(clip.src);
  };

  const lengthLabel = clip ? storyClipDurationLabel(clip.durationMs) : null;

  return (
    <>
      {preloadSrc ? <link rel="preload" as="audio" href={preloadSrc} /> : null}
      {clip ? (
        <div
          className={cn(
            "pointer-events-none absolute inset-x-0 flex justify-center px-5",
            aboveCredit ? "bottom-[8rem]" : "bottom-28",
            LAYER_CLASS.chrome,
          )}
        >
          <div className="pointer-events-auto flex items-center gap-2 rounded-full bg-white/95 py-1 pl-3 pr-1 shadow-sm ring-1 ring-[#031F82]/10">
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
              aria-label={muted ? "Unmute voiceover" : "Mute voiceover"}
              className={cn(
                "grid h-11 w-11 min-h-11 min-w-11 place-items-center rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0CC1E0]",
                muted ? "bg-[#031F82] text-white" : "text-[#031F82]",
              )}
            >
              <VoiceoverIcon muted={muted} />
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}

function VoiceoverIcon({ muted }: { muted: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-6"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M11 5 6 9H3v6h3l5 4V5z" fill="currentColor" stroke="none" />
      {muted ? (
        <path d="M16 10l5 5M21 10l-5 5" />
      ) : (
        <>
          <path d="M15.5 8.5a5 5 0 0 1 0 7" />
          <path d="M18.5 6a8.5 8.5 0 0 1 0 12" />
        </>
      )}
    </svg>
  );
}
