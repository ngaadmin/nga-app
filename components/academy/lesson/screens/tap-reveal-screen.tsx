"use client";

import { useEffect, useMemo, useState } from "react";
import {
  lessonEyebrowClass,
  lessonIconGridClass,
  resolveChoiceVariant,
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
import type { StandardScreenProps } from "./types";

function shuffleItems<T>(items: readonly T[]): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j]!, next[i]!];
  }
  return next;
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
      signalLessonIncorrectAnswer(flow.flashScreen);
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
        {displayItems.map((item) => {
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
              selectionVariant={
                neutralSelection || !isTapped
                  ? "neutral"
                  : resolveChoiceVariant(true, !isShortTermSpend)
              }
              onClick={() => handleTap(item.id)}
            />
          );
        })}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        {screen.buckets.map((bucket) => {
          const revealed = screen.items.filter(
            (item) => item.bucket === bucket.id && tapped.has(item.id),
          );

          return (
            <LessonRevealBucket key={bucket.id}>
              <p className={lessonEyebrowClass}>{bucket.label}</p>
              <ul className="mt-2 flex flex-wrap justify-center gap-3">
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
