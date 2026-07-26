"use client";

import { useMemo, useState } from "react";
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

type SideLayout = { left: "a" | "b"; right: "a" | "b" };

function buildRoundSideLayouts(roundCount: number): SideLayout[] {
  return Array.from({ length: roundCount }, () =>
    Math.random() < 0.5
      ? { left: "a" as const, right: "b" as const }
      : { left: "b" as const, right: "a" as const },
  );
}

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

  const roundSideLayouts = useMemo(
    () => buildRoundSideLayouts(screen.rounds.length),
    [screen.rounds.length],
  );

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

  const sideLayout = roundSideLayouts[roundIndex] ?? { left: "a", right: "b" };

  const optionMeta = {
    a: { icon: round.iconA, label: round.optionA },
    b: { icon: round.iconB, label: round.optionB },
  };

  const renderSide = (which: "a" | "b") => {
    const meta = optionMeta[which];
    return (
      <LessonIconOption
        label={meta.label}
        emoji={meta.icon}
        display="emoji-label"
        selected={choice === which}
        labelClassName="max-w-[13rem] sm:max-w-[15rem]"
        onClick={() => pick(which)}
      />
    );
  };

  return (
    <LessonScreenLayout
      prompt={screen.prompt}
      emphasizeInstruction={screen.emphasizeInstruction === true}
    >
      <p className={cn("mt-3", lessonEyebrowClass)}>
        {`Round ${roundIndex + 1} of ${screen.rounds.length}`}
      </p>
      <div className="mt-6 grid grid-cols-1 gap-8 sm:grid-cols-2">
        {renderSide(sideLayout.left)}
        {renderSide(sideLayout.right)}
      </div>
    </LessonScreenLayout>
  );
}
