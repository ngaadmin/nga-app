"use client";

import { useEffect, useRef, useState } from "react";
import { LessonScreenLayout, lessonFeedbackCopy } from "@/components/academy/lesson/lesson-ui";
import { presentLightningCard } from "@/lib/academy/lessons/peel-leading-emoji";
import type { LightningRoundCard, LightningRoundScreenConfig } from "@/lib/academy/lessons/types";
import {
  celebrateLessonCorrectAnswer,
  signalLessonIncorrectAnswer,
} from "@/lib/academy/lessons/utils";
import { cn } from "@/lib/utils/cn";
import type { StandardScreenProps } from "./types";

const TICK_MS = 420;

const DEFAULT_WRONG_ERROR =
  "That thought is rushing you. Pick the one that helps you stop.";

function shuffledOrder(roundCount: number): ReadonlyArray<readonly [0 | 1, 0 | 1]> {
  return Array.from({ length: roundCount }, () =>
    Math.random() < 0.5 ? ([0, 1] as const) : ([1, 0] as const),
  );
}

export function LightningRoundScreen({
  screen,
  screenIndex,
  flow,
}: StandardScreenProps<LightningRoundScreenConfig>) {
  const [roundIndex, setRoundIndex] = useState(0);
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cardOrder] = useState(() => shuffledOrder(screen.rounds.length));
  const locked = useRef(false);
  const timer = useRef<number | null>(null);
  const flowRef = useRef(flow);
  flowRef.current = flow;

  useEffect(
    () => () => {
      if (timer.current != null) window.clearTimeout(timer.current);
    },
    [],
  );

  useEffect(() => {
    if (screen.rounds.length === 0) {
      flowRef.current.markScreenReady(screenIndex);
    }
  }, [screen.rounds.length, screenIndex]);

  const total = screen.rounds.length;
  const round = screen.rounds[roundIndex];
  const order = cardOrder[roundIndex] ?? ([0, 1] as const);
  const cards: LightningRoundCard[] = round
    ? [round.cards[order[0]], round.cards[order[1]]]
    : [];

  const pick = (card: LightningRoundCard) => {
    if (locked.current) return;
    if (!card.correct) {
      setError(lessonFeedbackCopy(screen.wrongError) ?? DEFAULT_WRONG_ERROR);
      flowRef.current.incrementMistake();
      signalLessonIncorrectAnswer(flowRef.current.flashScreen);
      return;
    }

    locked.current = true;
    setError(null);
    setPickedId(card.id);
    celebrateLessonCorrectAnswer(flowRef.current.flashScreen);
    const isLast = roundIndex >= total - 1;
    if (isLast) {
      flowRef.current.markScreenReady(screenIndex);
      return;
    }
    timer.current = window.setTimeout(() => {
      locked.current = false;
      setPickedId(null);
      setRoundIndex((current) => current + 1);
    }, TICK_MS);
  };

  return (
    <LessonScreenLayout prompt={screen.prompt} errorMessage={error} fill>
      <div className="flex min-h-0 flex-1 flex-col gap-3 pb-1">
        <p
          className="shrink-0 text-center text-sm font-bold tracking-wide text-[#031F82]"
          aria-label={`Round ${Math.min(roundIndex + 1, Math.max(total, 1))} of ${Math.max(total, 1)}`}
        >
          {Math.min(roundIndex + 1, Math.max(total, 1))}/{Math.max(total, 1)}
        </p>
        <div className="flex min-h-0 flex-1 flex-col gap-3">
          {cards.map((card) => {
            const face = presentLightningCard(card);
            const picked = pickedId === card.id;
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => pick(card)}
                aria-pressed={picked}
                className={cn(
                  "flex min-h-[8.5rem] w-full flex-1 items-center gap-4 rounded-3xl border-2 bg-white px-4 py-4 text-left shadow-md transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0CC1E0]",
                  picked ? "border-[#16A34A] bg-[#F0FDF4]" : "border-[#E8F6FC]",
                )}
              >
                {face.emoji ? (
                  <span className="shrink-0 text-5xl leading-none" aria-hidden>
                    {face.emoji}
                  </span>
                ) : null}
                <span className="min-w-0 flex-1 font-heading text-[20px] font-semibold leading-snug text-[#031F82]">
                  {face.label}
                </span>
                {picked ? (
                  <span
                    className="grid size-9 shrink-0 place-items-center rounded-full bg-[#16A34A] text-lg font-extrabold text-white"
                    aria-hidden
                  >
                    ✓
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
    </LessonScreenLayout>
  );
}
