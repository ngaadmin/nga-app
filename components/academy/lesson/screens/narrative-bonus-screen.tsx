"use client";

import { useEffect, useState } from "react";
import {
  lessonGoldClaimClass,
  lessonNarrativeClass,
} from "@/components/academy/lesson/lesson-shared-styles";
import type { NarrativeBonusScreenConfig } from "@/lib/academy/lessons/types";
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

  useEffect(() => {
    if (!hasBonus && screen.autoReadyWhenNoBonus !== false) {
      flow.markScreenReady(screenIndex);
    }
  }, [flow, hasBonus, screen.autoReadyWhenNoBonus, screenIndex]);

  const claim = () => {
    if (claimed || !hasBonus) return;
    setClaimed(true);
    awardBonusXp?.(screen.bonusXp);
    celebrateLessonCorrectAnswer(flow.flashScreen);
    flow.markScreenReady(screenIndex);
    window.requestAnimationFrame(() => {
      flow.handleNext({ canAdvance: true });
    });
  };

  return (
    <>
      <p className={lessonNarrativeClass}>{screen.narrative}</p>
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
          {claimed ? `+${screen.bonusXp} coins Collected!` : screen.bonusTapLabel}
        </button>
      ) : null}
    </>
  );
}
