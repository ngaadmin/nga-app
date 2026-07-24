"use client";

import { useEffect, useState } from "react";
import {
  lessonEyebrowClass,
  lessonIconGridClass,
  usesNeutralTapFeedback,
} from "@/components/academy/lesson/lesson-shared-styles";
import {
  LessonIconOption,
  LessonIconReveal,
  LessonRevealBucket,
  LessonScreenLayout,
} from "@/components/academy/lesson/lesson-ui";
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
  const neutralSelection = usesNeutralTapFeedback(screen.selectionFeedback);

  useEffect(() => {
    if (screen.items.length === 0 && screen.advance?.mode === "auto-ready") {
      flow.markScreenReady(screenIndex);
      return;
    }
    if (screen.items.length > 0 && tapped.size === screen.items.length) {
      flow.markScreenReady(screenIndex);
    }
  }, [flow, screen.advance?.mode, screen.items.length, screenIndex, tapped.size]);

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

  if (screen.items.length === 0) {
    return (
      <LessonScreenLayout
        intro={screen.intro}
        emphasizeInstruction={screen.emphasizeInstruction === true}
        successMessage={screen.successMessage}
      >
        {null}
      </LessonScreenLayout>
    );
  }

  return (
    <LessonScreenLayout
      intro={screen.intro}
      emphasizeInstruction={screen.emphasizeInstruction === true}
    >
      <div className={lessonIconGridClass}>
        {screen.items.map((item) => {
          const isTapped = tapped.has(item.id);
          const bucketTone = screen.buckets.find((bucket) => bucket.id === item.bucket)?.tone;
          const isShortTermSpend = bucketTone === "short" || bucketTone === "want";

          return (
            <LessonIconOption
              key={item.id}
              label={item.label}
              emoji={item.emoji}
              display={tapDisplay}
              selected={isTapped}
              disabled={isTapped}
              chipClassName={
                !neutralSelection && isTapped
                  ? isShortTermSpend
                    ? "border-[#BE123C] bg-[#FDA4AF]/40"
                    : "border-[#16A34A] bg-[#86EFAC]/40"
                  : undefined
              }
              onClick={() => handleTap(item.id)}
            />
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
            <LessonRevealBucket key={bucket.id}>
              <p className={cn(lessonEyebrowClass, toneClass)}>{bucket.label}</p>
              <ul className="mt-3 flex flex-wrap justify-center gap-4">
                {revealed.map((item) => (
                  <li key={item.id}>
                    <LessonIconReveal
                      label={item.label}
                      emoji={item.emoji}
                      display={revealDisplay}
                    />
                  </li>
                ))}
              </ul>
            </LessonRevealBucket>
          );
        })}
      </div>
    </LessonScreenLayout>
  );
}
