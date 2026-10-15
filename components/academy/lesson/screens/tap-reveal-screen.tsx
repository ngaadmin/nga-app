"use client";

import { useEffect, useState } from "react";
import { lessonNextButtonClass } from "@/components/academy/lesson/lesson-shared-styles";
import { LessonScreenLayout } from "@/components/academy/lesson/lesson-ui";
import type { TapRevealScreenConfig } from "@/lib/academy/lessons/types";
import { cn } from "@/lib/utils/cn";
import type { StandardScreenProps } from "./types";

const STEP_MS = 520;

export function TapRevealScreen({
  screen,
  screenIndex,
  flow,
}: StandardScreenProps<TapRevealScreenConfig>) {
  const [placedCount, setPlacedCount] = useState(0);
  const [playing, setPlaying] = useState(false);
  const done = screen.items.length === 0 || placedCount >= screen.items.length;

  useEffect(() => {
    if (!playing || done) return;
    const timer = window.setTimeout(() => {
      setPlacedCount((current) => current + 1);
    }, STEP_MS);
    return () => window.clearTimeout(timer);
  }, [done, playing, placedCount]);

  useEffect(() => {
    if (done && (playing || screen.items.length === 0)) {
      flow.markScreenReady(screenIndex);
    }
  }, [done, flow, playing, screen.items.length, screenIndex]);

  const placed = new Set(screen.items.slice(0, placedCount).map((item) => item.id));
  const waiting = screen.items.filter((item) => !placed.has(item.id));

  const show = () => {
    if (done) {
      flow.handleNext({ canAdvance: true });
      return;
    }
    setPlaying(true);
  };

  return (
    <LessonScreenLayout
      intro={screen.intro}
      emphasizeInstruction={screen.emphasizeInstruction === true}
      fill
    >
      <button type="button" onClick={show} className={cn(lessonNextButtonClass, "mb-4 w-full")}>
        {done && (playing || screen.items.length === 0) ? "Next" : "Show me 👀"}
      </button>
      {waiting.length > 0 ? (
        <div className="mb-4 flex flex-wrap justify-center gap-3">
          {waiting.map((item) => (
            <div
              key={item.id}
              className="grid w-[calc(50%-0.375rem)] min-w-0 max-w-[11rem] place-items-center gap-1 bg-transparent px-2 py-3 text-center text-[#14213D]"
            >
              {item.emoji ? (
                <span className="text-[2.4rem] leading-none" aria-hidden>
                  {item.emoji}
                </span>
              ) : null}
              <span className="w-full min-w-0 break-words font-sans text-sm font-semibold leading-snug">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      ) : null}
      <div className="grid min-h-0 min-w-0 flex-1 grid-cols-2 gap-3">
        {screen.buckets.map((bucket) => {
          const revealed = screen.items.filter(
            (item) => item.bucket === bucket.id && placed.has(item.id),
          );
          return (
            <div
              key={bucket.id}
              className="flex min-h-40 min-w-0 flex-col gap-2 rounded-2xl border-2 border-dashed border-[#BDE9FB] bg-[#F8FCFF] p-3"
            >
              <h3 className="m-0 break-words font-heading text-base font-bold leading-snug text-[#031F82]">
                {bucket.label}
              </h3>
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                {revealed.map((item) => (
                  <div
                    key={item.id}
                    className="flex min-w-0 flex-col items-center gap-1 rounded-xl bg-white px-2 py-2 text-center font-sans text-sm font-semibold leading-snug text-[#031F82] shadow-[0_4px_10px_rgba(3,31,130,0.08)]"
                  >
                    {item.emoji ? (
                      <span className="shrink-0 text-[1.8rem] leading-none" aria-hidden>
                        {item.emoji}
                      </span>
                    ) : null}
                    <span className="w-full min-w-0 break-words">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </LessonScreenLayout>
  );
}
