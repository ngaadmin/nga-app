"use client";

import { useState } from "react";
import {
  lessonEyebrowClass,
  usesNeutralChoiceFeedback,
} from "@/components/academy/lesson/lesson-shared-styles";
import {
  LessonIconOption,
  LessonScreenLayout,
} from "@/components/academy/lesson/lesson-ui";
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

  const renderOption = (which: "a" | "b", icon: string, label: string) => (
    <LessonIconOption
      label={label}
      emoji={icon}
      display="emoji-label"
      selected={choice === which}
      labelClassName="max-w-[13rem] sm:max-w-[15rem]"
      onClick={() => pick(which)}
    />
  );

  return (
    <LessonScreenLayout
      prompt={screen.prompt}
      emphasizeInstruction={screen.emphasizeInstruction === true}
    >
      <p className={cn("mt-3", lessonEyebrowClass)}>
        {`Round ${roundIndex + 1} of ${screen.rounds.length}`}
      </p>
      <div className="mt-6 grid grid-cols-1 gap-8 sm:grid-cols-2">
        {renderOption("a", round.iconA, round.optionA)}
        {renderOption("b", round.iconB, round.optionB)}
      </div>
    </LessonScreenLayout>
  );
}
