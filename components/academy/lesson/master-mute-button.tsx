"use client";

import { useEffect, useState } from "react";

import { applyMasterMute } from "@/lib/academy/lessons/story-audio/playback";
import { readMasterMuted } from "@/lib/academy/lessons/story-audio/master-mute";
import { LAYER_CLASS } from "@/lib/ui/layers";
import { cn } from "@/lib/utils/cn";

/**
 * One sound switch for the whole lesson. It stays in the top-right of the
 * lesson column on every screen. Only the icon changes.
 */
export function MasterMuteButton() {
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    setMuted(readMasterMuted());
  }, []);

  const toggle = () => {
    const next = !muted;
    setMuted(next);
    applyMasterMute(next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={muted}
      aria-label={muted ? "Unmute sound" : "Mute sound"}
      className={cn(
        "absolute right-2 top-2 grid h-11 w-11 min-h-11 min-w-11 place-items-center rounded-full bg-white text-[#031F82] shadow-sm ring-1 ring-[#031F82]/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0CC1E0]",
        LAYER_CLASS.chrome,
      )}
    >
      <SpeakerIcon muted={muted} />
    </button>
  );
}

function SpeakerIcon({ muted }: { muted: boolean }) {
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
        <path d="M16 9.5 21 14.5" />
      ) : (
        <>
          <path d="M15.5 8.5a5 5 0 0 1 0 7" />
          <path d="M18.5 6a8.5 8.5 0 0 1 0 12" />
        </>
      )}
    </svg>
  );
}
