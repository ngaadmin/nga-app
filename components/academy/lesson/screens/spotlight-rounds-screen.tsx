"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLessonSuccessFlash } from "@/components/academy/lesson/hooks/use-lesson-screen-flow";
import {
  lessonPromptClass,
  resolveChoiceVariant,
} from "@/components/academy/lesson/lesson-shared-styles";
import {
  LessonIconOption,
  LessonScreenLayout,
  lessonFeedbackCopy,
} from "@/components/academy/lesson/lesson-ui";
import type { SpotlightRoundsScreenConfig } from "@/lib/academy/lessons/types";
import {
  celebrateLessonCorrectAnswer,
  signalLessonIncorrectAnswer,
} from "@/lib/academy/lessons/utils";
import { cn } from "@/lib/utils/cn";
import type { StandardScreenProps } from "./types";

type SideLayout = { left: "a" | "b"; right: "a" | "b" };

/** Matches lesson flow error flash duration (use-lesson-flow.ts). */
const FEEDBACK_RECOVERY_MS = 450;

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
  const [error, setError] = useState<string | null>(null);
  const [roundCorrect, setRoundCorrect] = useState(false);
  const showSuccess = useLessonSuccessFlash(roundCorrect);
  const recoveryTimeoutRef = useRef<number | null>(null);
  const round = screen.rounds[roundIndex];

  const roundSideLayouts = useMemo(
    () => buildRoundSideLayouts(screen.rounds.length),
    [screen.rounds.length],
  );

  useEffect(
    () => () => {
      if (recoveryTimeoutRef.current !== null) {
        window.clearTimeout(recoveryTimeoutRef.current);
      }
    },
    [],
  );

  const scheduleChoiceReset = () => {
    if (recoveryTimeoutRef.current !== null) {
      window.clearTimeout(recoveryTimeoutRef.current);
    }
    recoveryTimeoutRef.current = window.setTimeout(() => {
      setChoice(null);
      recoveryTimeoutRef.current = null;
    }, FEEDBACK_RECOVERY_MS);
  };

  const pick = (which: "a" | "b") => {
    if (!round || choice !== null) return;
    setChoice(which);
    onDismissError?.();
    setError(null);
    setRoundCorrect(false);

    if (which !== round.correct) {
      flow.incrementMistake();
      setError(lessonFeedbackCopy(round.error) ?? "");
      if (onPersistentError) {
        const copy = lessonFeedbackCopy(round.error);
        if (copy) onPersistentError(copy);
      }
      signalLessonIncorrectAnswer(flow.flashScreen);
      scheduleChoiceReset();
      return;
    }

    setRoundCorrect(true);
    celebrateLessonCorrectAnswer(flow.flashScreen);
    if (roundIndex + 1 >= screen.rounds.length) {
      flow.markScreenReady(screenIndex);
      return;
    }

    recoveryTimeoutRef.current = window.setTimeout(() => {
      setRoundIndex((current) => current + 1);
      setChoice(null);
      setRoundCorrect(false);
      recoveryTimeoutRef.current = null;
    }, FEEDBACK_RECOVERY_MS);
  };

  if (!round) return null;

  const sideLayout = roundSideLayouts[roundIndex] ?? { left: "a", right: "b" };

  const optionMeta = {
    a: { icon: round.iconA, label: round.optionA },
    b: { icon: round.iconB, label: round.optionB },
  };

  const renderSide = (which: "a" | "b") => {
    const meta = optionMeta[which];
    const isChosen = choice === which;
    const isCorrectChoice = which === round.correct;
    return (
      <LessonIconOption
        label={meta.label}
        emoji={meta.icon}
        display="emoji-label"
        selected={isChosen}
        disabled={choice !== null}
        selectionVariant={
          isChosen
            ? resolveChoiceVariant(true, isCorrectChoice)
            : "neutral"
        }
        labelClassName="max-w-[13rem] sm:max-w-[15rem]"
        onClick={() => pick(which)}
      />
    );
  };

  return (
    <LessonScreenLayout
      emphasizeInstruction={screen.emphasizeInstruction === true}
      success={showSuccess}
      errorMessage={error}
    >
      <p className={cn("mb-2.5", lessonPromptClass)}>{screen.prompt}</p>
      <div className="mb-5 flex justify-center gap-1.5">
        {screen.rounds.map((_, index) => (
          <i
            key={index}
            className={cn(
              "block size-2 rounded-full",
              index === roundIndex
                ? "bg-[#0CC1E0]"
                : index < roundIndex
                  ? "bg-[#031F82]"
                  : "bg-[#BDE9FB]",
            )}
            aria-hidden
          />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4">
        {renderSide(sideLayout.left)}
        {renderSide(sideLayout.right)}
      </div>
    </LessonScreenLayout>
  );
}
