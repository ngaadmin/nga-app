"use client";

import { useEffect, useMemo, useState } from "react";
import {
  lessonItemChipClass,
  lessonItemOrbClass,
} from "@/components/academy/lesson/lesson-shared-styles";
import { LessonScreenLayout } from "@/components/academy/lesson/lesson-ui";
import type { TapRevealScreenConfig } from "@/lib/academy/lessons/types";
import { cn } from "@/lib/utils/cn";
import type { StandardScreenProps } from "./types";

function shuffleItems<T>(items: readonly T[]): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j]!, next[i]!];
  }
  return next;
}

function itemGlyph(label: string, emoji?: string) {
  return emoji?.trim() || label.trim().charAt(0) || "?";
}

export function TapRevealScreen({
  screen,
  screenIndex,
  flow,
}: StandardScreenProps<TapRevealScreenConfig>) {
  const [tapped, setTapped] = useState<Set<string>>(new Set());
  const displayItems = useMemo(
    () => shuffleItems(screen.items),
    [screen.items],
  );

  useEffect(() => {
    if (screen.items.length === 0) {
      flow.markScreenReady(screenIndex);
      return;
    }
    if (tapped.size === screen.items.length) {
      // Reveal-only complete: unlock Next. Do not score, flash, or take a life.
      flow.markScreenReady(screenIndex);
    }
  }, [flow, screen.items.length, screenIndex, tapped.size]);

  const handleTap = (itemId: string) => {
    const item = screen.items.find((entry) => entry.id === itemId);
    if (!item || tapped.has(itemId)) return;

    setTapped((current) => {
      const next = new Set(current);
      next.add(itemId);
      return next;
    });
  };

  if (screen.items.length === 0) {
    return (
      <LessonScreenLayout
        intro={screen.intro}
        emphasizeInstruction={screen.emphasizeInstruction === true}
      >
        {null}
      </LessonScreenLayout>
    );
  }

  return (
    <LessonScreenLayout
      intro={screen.intro}
      emphasizeInstruction={screen.emphasizeInstruction === true}
      fill
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="grid auto-rows-[4.5rem] grid-cols-2 content-start gap-x-6 gap-y-5 py-2">
          {displayItems.map((item) => (
            <div key={item.id} className="flex min-h-[72px] items-center">
              <button
                type="button"
                onClick={() => handleTap(item.id)}
                className={cn(
                  lessonItemChipClass,
                  tapped.has(item.id) && "invisible pointer-events-none",
                )}
              >
                <span className={lessonItemOrbClass} aria-hidden>
                  {itemGlyph(item.label, item.emoji)}
                </span>
                <span>{item.label}</span>
              </button>
            </div>
          ))}
        </div>
        <div className="mb-2.5 h-px bg-[#C5D8E6]" />
        <div className="flex min-h-0 flex-1 gap-4">
          {screen.buckets.map((bucket) => {
            const revealed = screen.items.filter(
              (item) => item.bucket === bucket.id && tapped.has(item.id),
            );
            return (
              <div key={bucket.id} className="flex min-h-0 flex-1 flex-col gap-2">
                <h3 className="m-0 font-heading text-base font-bold text-[#031F82]">
                  {bucket.label}
                </h3>
                <div className="flex flex-1 flex-col gap-3.5 py-2.5">
                  {revealed.map((item) => (
                    <div key={item.id} className={lessonItemChipClass}>
                      <span className={lessonItemOrbClass} aria-hidden>
                        {itemGlyph(item.label, item.emoji)}
                      </span>
                      <span>{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </LessonScreenLayout>
  );
}
