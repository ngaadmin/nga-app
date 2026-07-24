"use client";

import { useState } from "react";
import {
  lessonEyebrowClass,
  lessonIconLabelClass,
  lessonIconTapClass,
  lessonIconTapSelectedClass,
  lessonIntroClass,
  usesNeutralChoiceFeedback,
} from "@/components/academy/lesson/lesson-shared-styles";
import type { SpotlightRoundsScreenConfig } from "@/lib/academy/lessons/types";
import {
  celebrateLessonCorrectAnswer,
  signalLessonIncorrectAnswer,
} from "@/lib/academy/lessons/utils";
import { cn } from "@/lib/utils/cn";
import type { StandardScreenProps } from "./types";

export function SpotlightRoundsScreen({
  screen,
  screenIndex,
  flow,
  onPersistentError,
  onDismissError,
}: StandardScreenProps<SpotlightRoundsScreenConfig> & {
  onPersistentError?: (message: string) => void;
  onDismissError?: () => void;
}) {
  const [roundIndex, setRoundIndex] = useState(0);
  const [choice, setChoice] = useState<"a" | "b" | null>(null);
  const round = screen.rounds[roundIndex];
  const neutralSelected = usesNeutralChoiceFeedback(screen.choiceFeedback);

  const pick = (which: "a" | "b") => {
    if (!round) return;
    setChoice(which);
    onDismissError?.();
    if (which !== round.correct) {
      flow.incrementMistake();
      if (onPersistentError) {
        onPersistentError(round.error);
      } else {
        signalLessonIncorrectAnswer(flow.flashScreen, { flash: !neutralSelected });
      }
      return;
    }
    celebrateLessonCorrectAnswer(flow.flashScreen);
    if (roundIndex + 1 >= screen.rounds.length) {
      flow.markScreenReady(screenIndex);
      return;
    }
    setRoundIndex((current) => current + 1);
    setChoice(null);
  };

  if (!round) return null;

  const renderOption = (which: "a" | "b", icon: string, label: string) => {
    const selected = choice === which;
    return (
      <div className="flex flex-col items-center gap-3">
        <button
          type="button"
          aria-pressed={selected}
          onClick={() => pick(which)}
          className={cn(
            lessonIconTapClass,
            selected && lessonIconTapSelectedClass,
          )}
        >
          <span className="text-5xl leading-none" aria-hidden>
            {icon}
          </span>
        </button>
        <p className={cn(lessonIconLabelClass, "max-w-[13rem] sm:max-w-[15rem]")}>{label}</p>
      </div>
    );
  };

  return (
    <>
      <p className={lessonIntroClass(screen.emphasizeInstruction === true)}>
        {screen.prompt}
      </p>
      <p className={cn("mt-3", lessonEyebrowClass)}>
        {`Round ${roundIndex + 1} of ${screen.rounds.length}`}
      </p>
      <div className="mt-6 grid grid-cols-1 gap-8 sm:grid-cols-2">
        {renderOption("a", round.iconA, round.optionA)}
        {renderOption("b", round.iconB, round.optionB)}
      </div>
    </>
  );
}
