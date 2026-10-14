"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
    }
  };

  return (
    <>
      <p className={cn("mb-4", lessonIntroClass())}>{intro}</p>
      <div className="space-y-3" role="group" aria-label="Budget items">
        {items.map((item) => {
          const checked = checkedIds.has(item.id);
          const shaking = shakingId === item.id;
          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={checked}
              onClick={() => toggle(item.id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-2xl bg-[#E8F6FC] px-4 py-3 text-left text-[#031F82] transition-colors active:scale-[0.99]",
                checked && "bg-[#BDE9FB]",
                shaking && "lesson-tile-shake bg-[#FFF1F2] text-[#9F1239]",
              )}
            >
              {item.emoji ? (
                <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-white text-[2rem] leading-none" aria-hidden>
                  {item.emoji}
                </span>
              ) : null}
              <span className="min-w-0 flex-1 font-sans text-[18px] font-semibold leading-snug">
                {item.label}
              </span>
              <strong className="font-heading text-lg">${item.price}</strong>
              <span
                className={cn(
                  "grid size-7 shrink-0 place-items-center rounded-full text-sm font-extrabold",
                  checked ? "bg-[#031F82] text-white" : "bg-white text-transparent",
                )}
                aria-hidden
              >
                ✓
              </span>
            </button>
          );
        })}
      </div>
      <div className="pt-5">
        <div className="mb-2 flex items-baseline justify-between font-heading text-[#031F82]">
          <span className="text-sm font-extrabold uppercase tracking-wide">{walletLabel}</span>
          <span className={cn("text-lg font-extrabold", overBudget && "text-[#E11D48]")}>
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
            className={cn("h-full rounded-full transition-[width] duration-300", overBudget ? "bg-[#E11D48]" : "bg-[#0CC1E0]")}
            style={{ width: `${overBudget ? 100 : fill}%` }}
          />
        </div>
      </div>
    </>
  );
}
