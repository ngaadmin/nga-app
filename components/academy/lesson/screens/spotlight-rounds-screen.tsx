"use client";

import { useState } from "react";
import { lessonCardClass } from "@/components/academy/lesson/academy-lesson-shell";
import { LessonChoiceButton } from "@/components/academy/lesson/lesson-choice-button";
import type { SpotlightRoundsScreenConfig } from "@/lib/academy/lessons/types";
import { playLessonSuccessPing } from "@/lib/academy/lessons/utils";
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
  const [allDone, setAllDone] = useState(false);
  const round = screen.rounds[roundIndex];

  const pick = (which: "a" | "b") => {
    if (!round) return;
    setChoice(which);
    onDismissError?.();
    if (which !== round.correct) {
      flow.incrementMistake();
      onPersistentError?.(round.error);
      return;
    }
    playLessonSuccessPing();
    flow.flashScreen("success");
    if (roundIndex + 1 >= screen.rounds.length) {
      setAllDone(true);
      flow.markScreenReady(screenIndex);
      return;
    }
    setRoundIndex((current) => current + 1);
    setChoice(null);
  };

  return (
    <>
      <p className="font-sans text-sm leading-relaxed text-[#1E3A5F]">{screen.prompt}</p>
      <p className="mt-2 font-heading text-[10px] font-bold uppercase tracking-wide text-[#0CC1E0]">
        {allDone ? "Complete" : `Round ${roundIndex + 1} of ${screen.rounds.length}`}
      </p>
      {allDone ? (
        <div className={cn(lessonCardClass, "mt-6 py-8 text-center")}>
          <p className="font-heading text-sm font-bold text-[#22C55E]">All done</p>
        </div>
      ) : round ? (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <LessonChoiceButton
            onClick={() => pick("a")}
            selected={choice === "a"}
            variant={
              choice === "a"
                ? round.correct === "a"
                  ? "correct"
                  : "wrong"
                : "neutral"
            }
            className="min-h-[7rem]"
          >
            <span className="flex items-start gap-2">
              <span className="shrink-0 text-2xl" aria-hidden>
                {round.iconA}
              </span>
              <span>{round.optionA}</span>
            </span>
          </LessonChoiceButton>
          <LessonChoiceButton
            onClick={() => pick("b")}
            selected={choice === "b"}
            variant={
              choice === "b"
                ? round.correct === "b"
                  ? "correct"
                  : "wrong"
                : "neutral"
            }
            className="min-h-[7rem]"
          >
            <span className="flex items-start gap-2">
              <span className="shrink-0 text-2xl" aria-hidden>
                {round.iconB}
              </span>
              <span>{round.optionB}</span>
            </span>
          </LessonChoiceButton>
        </div>
      ) : null}
    </>
  );
}
