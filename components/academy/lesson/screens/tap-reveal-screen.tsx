"use client";

import { useEffect, useState } from "react";
import {
  lessonEyebrowClass,
  lessonIconLabelClass,
  lessonIconTapClass,
  lessonIconTapSelectedClass,
  lessonIntroClass,
  lessonSuccessMessageClass,
  usesNeutralTapFeedback,
} from "@/components/academy/lesson/lesson-shared-styles";
import { LessonChoiceButton } from "@/components/academy/lesson/lesson-choice-button";
import type { TapRevealScreenConfig } from "@/lib/academy/lessons/types";
import {
  celebrateLessonCorrectAnswer,
  signalLessonIncorrectAnswer,
} from "@/lib/academy/lessons/utils";
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
  const tapLayout = screen.tapLayout ?? "icon-grid";
  const neutralSelection = usesNeutralTapFeedback(screen.selectionFeedback);
  const isIconGrid = tapLayout !== "default";
  const introClass = lessonIntroClass(screen.emphasizeInstruction === true);

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
        <p className={introClass}>{screen.intro}</p>
        {screen.successMessage ? (
          <p className={lessonSuccessMessageClass}>{screen.successMessage}</p>
        ) : null}
      </>
    );
  }

  const handleTap = (itemId: string) => {
    const item = screen.items.find((entry) => entry.id === itemId);
    if (!item || tapped.has(itemId)) return;

    const bucketTone = screen.buckets.find((bucket) => bucket.id === item.bucket)?.tone;
    const isShortTermSpend = bucketTone === "short" || bucketTone === "want";

    setTapped((current) => {
      const next = new Set(current);
      next.add(itemId);
      return next;
    });

    if (isShortTermSpend) {
      signalLessonIncorrectAnswer(flow.flashScreen, { flash: false });
    } else {
      celebrateLessonCorrectAnswer(flow.flashScreen);
    }
  };

  const renderTapChip = (item: TapRevealScreenConfig["items"][number]) => {
    if (tapDisplay === "label") {
      return item.label;
    }
    if (tapDisplay === "emoji-only" && item.emoji) {
      return (
        <span className="text-5xl leading-none" aria-hidden>
          {item.emoji}
        </span>
      );
    }
    if (item.emoji) {
      return (
        <span className="flex flex-col items-center gap-2">
          <span className="text-4xl leading-none" aria-hidden>
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
        <span className="text-3xl leading-none" aria-hidden>
          {item.emoji}
        </span>
      );
    }
    if (item.emoji) {
      return (
        <span className="inline-flex flex-col items-center gap-1">
          <span className="text-3xl leading-none" aria-hidden>
            {item.emoji}
          </span>
          <span className={lessonIconLabelClass}>{item.label}</span>
        </span>
      );
    }
    return item.label;
  };

  return (
    <>
      <p className={introClass}>{screen.intro}</p>

      <div className={cn("mt-6 grid grid-cols-2 gap-5", isIconGrid && "gap-6")}>
        {screen.items.map((item) => {
          const isTapped = tapped.has(item.id);

          if (isIconGrid) {
            return (
              <div key={item.id} className="flex flex-col items-center gap-2">
                <button
                  type="button"
                  aria-label={item.label}
                  aria-pressed={isTapped}
                  disabled={isTapped}
                  onClick={() => handleTap(item.id)}
                  className={cn(
                    lessonIconTapClass,
                    isTapped && lessonIconTapSelectedClass,
                    isTapped && "pointer-events-none",
                  )}
                >
                  {item.emoji ? (
                    <span className="text-5xl leading-none grayscale-[0.1]" aria-hidden>
                      {item.emoji}
                    </span>
                  ) : (
                    renderTapChip(item)
                  )}
                </button>
                <span className={lessonIconLabelClass}>{item.label}</span>
              </div>
            );
          }

          return (
            <LessonChoiceButton
              key={item.id}
              aria-label={item.label}
              aria-disabled={isTapped}
              onClick={() => handleTap(item.id)}
              selected={isTapped}
              variant={
                neutralSelection || !isTapped
                  ? "neutral"
                  : item.bucket === "short" || item.bucket === "want"
                    ? "wrong"
                    : "correct"
              }
              className={cn(isTapped && "pointer-events-none")}
            >
              {renderTapChip(item)}
            </LessonChoiceButton>
          );
        })}
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4">
        {screen.buckets.map((bucket) => {
          const toneClass =
            bucket.tone === "short" || bucket.tone === "want"
              ? "text-[#BE123C]"
              : "text-[#15803D]";
          const revealed = screen.items.filter(
            (item) => item.bucket === bucket.id && tapped.has(item.id),
          );

          return (
            <div
              key={bucket.id}
              className="min-h-[7rem] rounded-3xl border-2 border-dashed border-[#BDE9FB]/70 bg-[#F7FBFF]/50 px-3 py-4"
            >
              <p className={cn(lessonEyebrowClass, toneClass)}>{bucket.label}</p>
              <ul className="mt-3 flex flex-wrap justify-center gap-4">
                {revealed.map((item) => (
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
