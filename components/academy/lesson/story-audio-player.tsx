"use client";

import { useEffect, useRef, useState } from "react";
import { STORY_AUDIO_MUTED_KEY } from "@/lib/academy/lessons/story-audio/audio-base";
import { storyClipDurationLabel } from "@/lib/academy/lessons/story-audio/next-clip";
import {
  isStoryAudioUnlocked,
  unlockStoryAudio,
} from "@/lib/academy/lessons/story-audio/unlock";
import { LAYER_CLASS } from "@/lib/ui/layers";
import { cn } from "@/lib/utils/cn";

type StoryAudioPlayerProps = {
  clip?: { src: string; durationMs: number };
  preloadSrc?: string;
};

function readMuted(): boolean {
  try {
    return window.localStorage.getItem(STORY_AUDIO_MUTED_KEY) === "1";
  } catch {
    return false;
  }
}

function writeMuted(muted: boolean): void {
  try {
    window.localStorage.setItem(STORY_AUDIO_MUTED_KEY, muted ? "1" : "0");
  } catch {
    // A private window can refuse storage. Playback still works for this visit.
  }
}

/**
 * One narration player for the lesson. Text stays on the story screen.
 * The first tap or key unlocks sound, then a beat plays when it opens.
 */
export function StoryAudioPlayer({ clip, preloadSrc }: StoryAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const loadedSrcRef = useRef("");
  const mutedRef = useRef(false);
  const [ready, setReady] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    const element = new Audio();
    element.preload = "auto";
    audioRef.current = element;
    setReady(true);
    setUnlocked(isStoryAudioUnlocked());
    const storedMuted = readMuted();
    mutedRef.current = storedMuted;
    setMuted(storedMuted);

    const unlock = () => {
      unlockStoryAudio();
      setUnlocked(true);
    };
    document.addEventListener("pointerdown", unlock);
    document.addEventListener("keydown", unlock);
    return () => {
      document.removeEventListener("pointerdown", unlock);
      document.removeEventListener("keydown", unlock);
      element.pause();
      element.src = "";
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    const element = audioRef.current;
    if (!element) return;
    element.muted = muted;
    mutedRef.current = muted;
  }, [muted, ready]);

  useEffect(() => {
    const element = audioRef.current;
    if (!ready || !element) return;
    element.pause();
    if (!clip?.src) {
      element.removeAttribute("src");
      loadedSrcRef.current = "";
      return;
    }
    if (loadedSrcRef.current !== clip.src) {
      element.src = clip.src;
      loadedSrcRef.current = clip.src;
    }
    element.muted = mutedRef.current;
    if (!unlocked) return;
    void element.play().catch(() => {});
  }, [clip?.src, ready, unlocked]);

  const replay = () => {
    const element = audioRef.current;
    if (!element || !clip?.src) return;
    unlockStoryAudio();
    setUnlocked(true);
    if (loadedSrcRef.current !== clip.src) {
      element.src = clip.src;
      loadedSrcRef.current = clip.src;
    }
    element.muted = mutedRef.current;
    element.currentTime = 0;
    void element.play().catch(() => {});
  };

  const toggleMuted = () => {
    setMuted((current) => {
      const next = !current;
      writeMuted(next);
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
            "pointer-events-none absolute inset-x-0 bottom-20 flex justify-center px-5",
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
