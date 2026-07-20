"use client";

import { useEffect, useState } from "react";
import { lessonCardClass } from "@/components/academy/lesson/academy-lesson-shell";
import { LessonChoiceButton } from "@/components/academy/lesson/lesson-choice-button";
import type { TapRevealScreenConfig } from "@/lib/academy/lessons/types";
import { cn } from "@/lib/utils/cn";
import type { StandardScreenProps } from "./types";

export function TapRevealScreen({
  screen,
  screenIndex,
  flow,
}: StandardScreenProps<TapRevealScreenConfig>) {
  const [tapped, setTapped] = useState<Set<string>>(new Set());
  const tapDisplay = screen.tapDisplay ?? "emoji-label";
  const revealDisplay = screen.revealDisplay ?? "emoji-label";

  useEffect(() => {
    if (screen.items.length === 0 && screen.advance?.mode === "auto-ready") {
      flow.markScreenReady(screenIndex);
      return;
    }
    if (screen.items.length > 0 && tapped.size === screen.items.length) {
      flow.markScreenReady(screenIndex);
    }
  }, [flow, screen.advance?.mode, screen.items.length, screenIndex, tapped.size]);

  if (screen.items.length === 0) {
    return (
      <>
        <p className="font-sans text-sm leading-relaxed text-[#1E3A5F]">{screen.intro}</p>
        {screen.successMessage ? (
          <p className="mt-4 rounded-xl bg-[#DCFCE7] px-3 py-2 font-sans text-xs text-[#031F82]">
            {screen.successMessage}
          </p>
        ) : null}
      </>
    );
  }

  const handleTap = (itemId: string) => {
    setTapped((current) => {
      const next = new Set(current);
      next.add(itemId);
      return next;
    });
  };

  const renderTapChip = (item: TapRevealScreenConfig["items"][number]) => {
    if (tapDisplay === "label") {
      return item.label;
    }
    if (tapDisplay === "emoji-only" && item.emoji) {
      return (
        <span className="text-2xl leading-none" aria-hidden>
          {item.emoji}
        </span>
      );
    }
    if (item.emoji) {
      return (
        <span className="flex flex-col items-center gap-1">
          <span className="text-xl leading-none" aria-hidden>
            {item.emoji}
          </span>
          <span>{item.label}</span>
        </span>
      );
    }
    return item.label;
  };

  const renderRevealEntry = (item: TapRevealScreenConfig["items"][number]) => {
    if (revealDisplay === "label") {
      return item.label;
    }
    if (revealDisplay === "emoji-only" && item.emoji) {
      return (
        <span className="text-xl leading-none" aria-hidden>
          {item.emoji}
        </span>
      );
    }
    if (item.emoji) {
      return (
        <span className="inline-flex items-center gap-1">
          <span className="text-base leading-none" aria-hidden>
            {item.emoji}
          </span>
          <span>{item.label}</span>
        </span>
      );
    }
    return item.label;
  };

  return (
    <>
      <p className="font-sans text-sm leading-relaxed text-[#1E3A5F]">{screen.intro}</p>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {screen.items.map((item) => {
          const isTapped = tapped.has(item.id);
          return (
            <LessonChoiceButton
              key={item.id}
              aria-label={item.label}
              aria-disabled={isTapped}
              onClick={() => handleTap(item.id)}
              selected={isTapped}
              variant={
                isTapped
                  ? item.bucket === "short" || item.bucket === "want"
                    ? "wrong"
                    : "correct"
                  : "neutral"
              }
              className={cn("text-xs", isTapped && "pointer-events-none")}
            >
              {renderTapChip(item)}
            </LessonChoiceButton>
          );
        })}
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3">
        {screen.buckets.map((bucket) => {
          const toneClass =
            bucket.tone === "short" || bucket.tone === "want"
              ? "text-[#E11D48]"
              : "text-[#22C55E]";
          return (
            <div key={bucket.id} className={cn(lessonCardClass, "min-h-[5.5rem]")}>
              <p className={cn("font-heading text-[9px] font-bold uppercase", toneClass)}>
                {bucket.label}
              </p>
              <ul className="mt-2 flex flex-col items-center gap-2 font-sans text-[11px] leading-snug text-[#1E3A5F]">
                {screen.items
                  .filter((item) => item.bucket === bucket.id && tapped.has(item.id))
                  .map((item) => (
                    <li key={item.id}>{renderRevealEntry(item)}</li>
                  ))}
              </ul>
            </div>
          );
        })}
      </div>
    </>
  );
}
