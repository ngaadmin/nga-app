"use client";

import { useEffect, useRef, useState } from "react";
import {
  LessonFalseIcon,
  LessonTrueIcon,
} from "@/components/academy/lesson/lesson-icons";
import {
  LessonAnswerTick,
  LessonScreenLayout,
  lessonFeedbackCopy,
} from "@/components/academy/lesson/lesson-ui";
import type { TrueFalseScreenConfig } from "@/lib/academy/lessons/types";
import {
  celebrateLessonCorrectAnswer,
  signalLessonIncorrectAnswer,
} from "@/lib/academy/lessons/utils";
import { cn } from "@/lib/utils/cn";
import type { StandardScreenProps } from "./types";

const WRONG_SHAKE_MS = 360;

export function TrueFalseScreen({
  screen,
  screenIndex,
  flow,
}: StandardScreenProps<TrueFalseScreenConfig> & {
  onPersistentError?: (message: string) => void;
}) {
  const [choice, setChoice] = useState<"true" | "false" | null>(null);
  const [shaking, setShaking] = useState<"true" | "false" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [solved, setSolved] = useState(false);
  const wrongTimerRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (wrongTimerRef.current !== null) window.clearTimeout(wrongTimerRef.current);
    },
    [],
  );

  const pick = (option: "true" | "false") => {
    if (solved) return;
    if (wrongTimerRef.current !== null) {
      window.clearTimeout(wrongTimerRef.current);
      wrongTimerRef.current = null;
    }

    if (option === screen.correctAnswer) {
      setShaking(null);
      setChoice(option);
      setError(null);
      setSolved(true);
      celebrateLessonCorrectAnswer();
      flow.recordBonusRunCorrect();
      flow.markScreenReady(screenIndex);
      return;
    }

    setChoice(option);
    setShaking(option);
    setError(lessonFeedbackCopy(screen.wrongError) ?? null);
    flow.clearScreenReady(screenIndex);
    flow.incrementMistake();
    signalLessonIncorrectAnswer();
    wrongTimerRef.current = window.setTimeout(() => {
      setChoice((current) => (current === option ? null : current));
      setShaking((current) => (current === option ? null : current));
      wrongTimerRef.current = null;
    }, WRONG_SHAKE_MS);
  };

  return (
    <LessonScreenLayout
      prompt={screen.prompt}
      emphasizeInstruction={screen.emphasizeInstruction === true}
      errorMessage={error}
    >
      <div className="mt-9 grid grid-cols-2 justify-items-center gap-6">
        {(["true", "false"] as const).map((option) => {
          const selected = choice === option;
          const correct = solved && selected;
          const Glyph = option === "true" ? LessonTrueIcon : LessonFalseIcon;
          return (
            <button
              key={option}
              type="button"
              aria-pressed={selected}
              onClick={() => pick(option)}
              className={cn(
                "flex flex-col items-center gap-2 bg-transparent",
                shaking === option && "lesson-tile-shake",
              )}
            >
              <span
                className="lesson-choice-tile relative grid size-9 place-items-center rounded-full bg-[#EAF0FF] text-[#031F82]"
                data-selection={correct ? "correct" : undefined}
              >
                <Glyph className="size-5" strokeWidth={3.84} />
                {correct ? (
                  <LessonAnswerTick className="absolute -right-4 top-1/2 -translate-y-1/2" />
                ) : null}
              </span>
              <span className="font-sans text-[18px] font-semibold leading-none text-[#14213D]">
                {option === "true" ? "True" : "False"}
              </span>
            </button>
          );
        })}
      </div>
    </LessonScreenLayout>
  );
}
