"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnswerEmoji } from "@/components/academy/lesson/answer-emoji";
import { presentLightningCard } from "@/lib/academy/lessons/peel-leading-emoji";
import { LessonAnswerTick, LessonPromptParagraphs } from "@/components/academy/lesson/lesson-ui";
import { lessonIntroClass } from "@/components/academy/lesson/lesson-shared-styles";
import {
  hasIncorrectSelection,
  isPartialCorrectSelection,
} from "@/lib/academy/lessons/choice-evaluation";
import { cn } from "@/lib/utils/cn";
import type { BudgetSelectItem } from "@/lib/academy/lessons/types/screens/budget-select";

type LessonBudgetSelectGameProps = {
  intro: string;
  walletLabel?: string;
  total: number;
  items: readonly BudgetSelectItem[];
  correctIds: readonly string[];
  errors: {
    overBudget: string;
    wrongSelection: string;
    itemHints?: Record<string, string>;
  };
  onComplete: () => void;
  onIncomplete?: () => void;
  onMistake: () => void;
  onPersistentError?: (message: string) => void;
  onDismissError?: () => void;
};

function setsMatch(a: ReadonlySet<string>, b: readonly string[]): boolean {
  if (a.size !== b.length) return false;
  return b.every((id) => a.has(id));
}

export function LessonBudgetSelectGame({
  intro,
  walletLabel = "Digital Wallet",
  total,
  items,
  correctIds,
  errors,
  onComplete,
  onIncomplete,
  onMistake,
  onPersistentError,
  onDismissError,
}: LessonBudgetSelectGameProps) {
  const [checkedIds, setCheckedIds] = useState<ReadonlySet<string>>(() => new Set());
  const [shakingId, setShakingId] = useState<string | null>(null);
  const shakeTimersRef = useRef<Map<string, number>>(new Map());

  useEffect(
    () => () => {
      for (const timer of shakeTimersRef.current.values()) {
        window.clearTimeout(timer);
      }
    },
    [],
  );

  const budgetSpent = useMemo(
    () => items.reduce((sum, item) => sum + (checkedIds.has(item.id) ? item.price : 0), 0),
    [checkedIds, items],
  );
  const overBudget = budgetSpent > total;
  const fill = total > 0 ? Math.min(100, (budgetSpent / total) * 100) : 0;

  const resolveError = useCallback(
    (nextChecked: ReadonlySet<string>, nextSpent: number): string => {
      if (nextSpent > total) return errors.overBudget;
      if (setsMatch(nextChecked, correctIds)) return "";

      if (hasIncorrectSelection(nextChecked, correctIds)) {
        for (const id of nextChecked) {
          if (!correctIds.includes(id) && errors.itemHints?.[id]) {
            return errors.itemHints[id]!;
          }
        }
        return errors.wrongSelection;
      }

      if (isPartialCorrectSelection(nextChecked, correctIds)) {
        return "";
      }

      return errors.wrongSelection;
    },
    [correctIds, errors, total],
  );

  const tryComplete = useCallback(
    (nextChecked: ReadonlySet<string>, nextSpent: number) =>
      setsMatch(nextChecked, correctIds) && nextSpent <= total,
    [correctIds, total],
  );

  const wasCompleteRef = useRef(false);

  useEffect(() => {
    const isCorrect = tryComplete(checkedIds, budgetSpent);
    if (isCorrect) {
      if (!wasCompleteRef.current) {
        wasCompleteRef.current = true;
        onDismissError?.();
        onComplete();
      }
      return;
    }
    if (wasCompleteRef.current) {
      wasCompleteRef.current = false;
      onIncomplete?.();
    }
  }, [budgetSpent, checkedIds, onComplete, onDismissError, onIncomplete, tryComplete]);

  const toggle = (itemId: string) => {
    onDismissError?.();
    const turningOn = !checkedIds.has(itemId);
    const next = new Set(checkedIds);
    if (turningOn) next.add(itemId);
    else next.delete(itemId);

    const nextSpent = items.reduce((sum, item) => sum + (next.has(item.id) ? item.price : 0), 0);
    setCheckedIds(next);

    if (tryComplete(next, nextSpent)) {
      setShakingId(null);
      return;
    }

    const wrongPick = turningOn && (nextSpent > total || !correctIds.includes(itemId));
    if (!wrongPick) {
      setShakingId(null);
      if (isPartialCorrectSelection(next, correctIds) || next.size === 0) return;
    }

    if (wrongPick) {
      setShakingId(itemId);
      onMistake();
      const message = resolveError(next, nextSpent);
      onPersistentError?.(message.trim() ? message : "");
      const existing = shakeTimersRef.current.get(itemId);
      if (existing !== undefined) window.clearTimeout(existing);
      const timer = window.setTimeout(() => {
        shakeTimersRef.current.delete(itemId);
        setShakingId((current) => (current === itemId ? null : current));
        setCheckedIds((current) => {
          if (!current.has(itemId)) return current;
          const cleared = new Set(current);
          cleared.delete(itemId);
          return cleared;
        });
      }, 360);
      shakeTimersRef.current.set(itemId, timer);
    }
  };

  return (
    <>
      <LessonPromptParagraphs text={intro} className={cn("mb-4", lessonIntroClass())} />
      <div className="space-y-3" role="group" aria-label="Budget items">
        {items.map((item) => {
          const checked = checkedIds.has(item.id);
          const shaking = shakingId === item.id;
          const shown = presentLightningCard({ emoji: item.emoji, label: item.label });
          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={checked}
              onClick={() => toggle(item.id)}
              data-selection={
                checked && correctIds.includes(item.id) && !shaking ? "correct" : undefined
              }
              className={cn(
                "lesson-choice-tile relative flex w-full min-h-[60px] items-center gap-3.5 rounded-full bg-transparent px-3.5 py-2 text-left font-sans text-[18px] font-semibold leading-[1.25] text-[#14213D] active:scale-[0.99]",
                shaking && "lesson-tile-shake",
              )}
            >
              {shown.emoji ? (
                <span className="grid w-9 shrink-0 place-items-center" aria-hidden>
                  <AnswerEmoji emoji={shown.emoji} />
                </span>
              ) : null}
              <span className="min-w-0 flex-1 font-sans text-[18px] font-semibold leading-snug">
                {shown.label}
              </span>
              <strong className="font-heading text-lg">${item.price}</strong>
              {checked && correctIds.includes(item.id) && !shaking ? (
                <LessonAnswerTick />
              ) : (
                <span className="size-7 shrink-0" aria-hidden />
              )}
            </button>
          );
        })}
      </div>
      <div className="pt-5">
        <div className="mb-2 flex items-baseline justify-between font-heading text-[#031F82]">
          <span className="text-sm font-extrabold uppercase tracking-wide">{walletLabel}</span>
          <span className="text-lg font-extrabold">
            ${budgetSpent} / ${total}
          </span>
        </div>
        <div
          className={cn(
            "h-5 overflow-hidden rounded-full bg-[#E8F6FC]",
            overBudget && "lesson-bar-wobble",
          )}
          role="meter"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={budgetSpent}
          aria-label={walletLabel}
        >
          <div
            className="h-full rounded-full bg-[#0CC1E0] transition-[width] duration-300"
            style={{ width: `${overBudget ? 100 : fill}%` }}
          />
        </div>
      </div>
    </>
  );
}
