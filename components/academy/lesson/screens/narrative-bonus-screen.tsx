"use client";

import { useEffect, useState } from "react";
import { LessonCompletionConfetti } from "@/components/academy/lesson/lesson-completion-confetti";
import {
  lessonGoldClaimClass,
  lessonNarrativeClass,
} from "@/components/academy/lesson/lesson-shared-styles";
import type { NarrativeBonusScreenConfig } from "@/lib/academy/lessons/types";
import { coinWord } from "@/lib/copy/coin-word";
import { splitResolutionCopy } from "@/lib/academy/lessons/resolution-copy";
import {
  celebrateLessonCorrectAnswer,
} from "@/lib/academy/lessons/utils";
import { cn } from "@/lib/utils/cn";
import type { StandardScreenProps } from "./types";

export function NarrativeBonusScreen({
  screen,
  screenIndex,
  flow,
  awardBonusXp,
}: StandardScreenProps<NarrativeBonusScreenConfig> & {
  awardBonusXp?: (amount: number) => void;
}) {
  const [claimed, setClaimed] = useState(false);
  const hasBonus = screen.bonusXp > 0;
  const resolution = screen.resolution === true;
  const resolutionCopy = resolution ? splitResolutionCopy(screen.narrative) : null;

  useEffect(() => {
    if (!hasBonus && screen.autoReadyWhenNoBonus !== false) {
      flow.markScreenReady(screenIndex);
    }
  }, [flow, hasBonus, screen.autoReadyWhenNoBonus, screenIndex]);

  const claim = () => {
    if (claimed || !hasBonus) return;
    setClaimed(true);
    awardBonusXp?.(screen.bonusXp);
    celebrateLessonCorrectAnswer();
    flow.markScreenReady(screenIndex);
    window.requestAnimationFrame(() => {
      flow.handleNext({ canAdvance: true });
    });
  };

  return (
    <>
      {resolution ? <LessonCompletionConfetti light /> : null}
      {resolutionCopy ? (
        <>
          <h2 className="font-heading text-[1.75rem] font-extrabold leading-tight text-[#031F82]">
            {resolutionCopy.headline}
          </h2>
          {resolutionCopy.paragraphs.length > 0 ? (
            <div className="mt-3 space-y-4">
              {resolutionCopy.paragraphs.map((paragraph) => (
                <p key={paragraph} className={lessonNarrativeClass}>
                  {paragraph}
                </p>
              ))}
            </div>
          ) : null}
        </>
      ) : (
        <p className={lessonNarrativeClass}>{screen.narrative}</p>
      )}
      {screen.successMessage ? (
        <p className={cn("mt-4", lessonNarrativeClass)}>
          {screen.successMessage}
        </p>
      ) : null}
      {hasBonus ? (
        <button
          type="button"
          onClick={claim}
          disabled={claimed}
          className={cn(lessonGoldClaimClass, "mt-6 h-touch w-full max-w-md")}
        >
          {claimed
            ? `+${screen.bonusXp} ${coinWord(screen.bonusXp)} Collected!`
            : screen.bonusTapLabel}
        </button>
      ) : null}
    </>
  );
}
