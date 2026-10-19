"use client";

import { useEffect, useState } from "react";
import { lessonNextButtonClass } from "@/components/academy/lesson/lesson-shared-styles";
import {
  LessonIconOption,
  LessonIconReveal,
  LessonScreenLayout,
} from "@/components/academy/lesson/lesson-ui";
import type { TapRevealScreenConfig } from "@/lib/academy/lessons/types";
import { cn } from "@/lib/utils/cn";
import type { StandardScreenProps } from "./types";

/**
 * Flash Tap: each item opens when the learner taps it.
 * Advance is `all-taps-revealed` — Next stays hidden until every item is open.
 */
export function TapRevealScreen({
  screen,
  screenIndex,
  flow,
}: StandardScreenProps<TapRevealScreenConfig>) {
  const [revealedIds, setRevealedIds] = useState<readonly string[]>([]);
  const revealed = new Set(revealedIds);
  const done =
    screen.items.length === 0 ||
    screen.items.every((item) => revealed.has(item.id));

  useEffect(() => {
    if (done) flow.markScreenReady(screenIndex);
  }, [done, flow, screenIndex]);

  const revealItem = (id: string) => {
    setRevealedIds((current) =>
      current.includes(id) ? current : [...current, id],
    );
  };

  const waiting = screen.items.filter((item) => !revealed.has(item.id));

  return (
    <LessonScreenLayout
      intro={screen.intro}
      emphasizeInstruction={screen.emphasizeInstruction === true}
      fill
      gameClassName="min-h-0 overflow-y-auto"
    >
      {waiting.length > 0 ? (
        <div className="mb-4 flex flex-wrap justify-center gap-3">
          {waiting.map((item) => (
            <LessonIconOption
              key={item.id}
              label={item.label}
              emoji={item.emoji}
              size="compact"
              className="w-[calc(50%-0.375rem)] min-w-0 max-w-[11rem]"
              labelClassName="w-full min-w-0 break-normal"
              onClick={() => revealItem(item.id)}
            />
          ))}
        </div>
      ) : null}
      <div className="grid min-h-0 min-w-0 flex-1 grid-cols-2 gap-3">
        {screen.buckets.map((bucket) => {
          const placed = screen.items.filter(
            (item) => item.bucket === bucket.id && revealed.has(item.id),
          );
          return (
            <div
              key={bucket.id}
              className="flex min-h-40 min-w-0 flex-col gap-2 rounded-2xl border-2 border-dashed border-[#BDE9FB] bg-[#F8FCFF] p-3"
            >
              <h3 className="m-0 break-normal font-heading text-base font-bold leading-snug text-[#031F82]">
                {bucket.label}
              </h3>
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                {placed.map((item) => (
                  <LessonIconReveal
                    key={item.id}
                    label={item.label}
                    emoji={item.emoji}
                    size="compact"
                    className="w-full min-w-0"
                    labelClassName="w-full min-w-0 break-normal"
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
      {done ? (
        <button
          type="button"
          onClick={() => flow.handleNext({ canAdvance: true })}
          className={cn(lessonNextButtonClass, "mt-4 w-full")}
        >
          Next
        </button>
      ) : null}
    </LessonScreenLayout>
  );
}
