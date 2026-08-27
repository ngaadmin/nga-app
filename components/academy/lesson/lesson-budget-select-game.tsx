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
  const [checkedIds, setCheckedIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );

  const budgetSpent = useMemo(
    () =>
      items.reduce(
        (sum, item) => sum + (checkedIds.has(item.id) ? item.price : 0),
        0,
      ),
    [checkedIds, items],
  );
  const budgetRemaining = total - budgetSpent;

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
  }, [
    budgetSpent,
    checkedIds,
    onComplete,
    onDismissError,
    onIncomplete,
    tryComplete,
  ]);

  const toggle = (itemId: string, nextChecked: boolean) => {
    onDismissError?.();
    const next = new Set(checkedIds);
    if (nextChecked) next.add(itemId);
    else next.delete(itemId);

    const nextSpent = items.reduce(
      (sum, item) => sum + (next.has(item.id) ? item.price : 0),
      0,
    );

    if (nextSpent > total) {
      onMistake();
      onPersistentError?.(errors.overBudget?.trim() ? errors.overBudget : "");
      return;
    }

    setCheckedIds(next);

    if (tryComplete(next, nextSpent)) return;

    const message = resolveError(next, nextSpent);
    if (isPartialCorrectSelection(next, correctIds)) return;

    onMistake();
    onPersistentError?.(message.trim() ? message : "");
  };

  return (
    <>
      <p className={cn("mb-5", lessonIntroClass())}>{intro}</p>
      <div className="space-y-4" role="group" aria-label="Budget items">
        {items.map((item) => {
          const checked = checkedIds.has(item.id);
          return (
            <label
              key={item.id}
              className="grid grid-cols-[26px_48px_auto_auto_1fr] items-center gap-x-2.5 text-[#031F82]"
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={(event) => {
                  event.stopPropagation();
                  toggle(item.id, event.target.checked);
                }}
                className="m-0 size-[22px] cursor-pointer appearance-none rounded-full border-0 bg-[#E8F6FC] shadow-[inset_0_0_0_2px_#B7D7E8] checked:bg-[#0CC1E0] checked:shadow-[inset_0_0_0_2px_#099FB8]"
                aria-label={item.label}
              />
              <span className="grid size-11 place-items-center rounded-full bg-[#E8F6FC] text-xl">
                {item.emoji ?? item.label.trim().charAt(0)}
              </span>
              <span className="font-sans text-sm font-medium">{item.label}</span>
              <strong className="justify-self-start pl-1 font-bold">
                ${item.price}
              </strong>
            </label>
          );
        })}
      </div>
      <div className="wallet hug pt-[18px] text-center">
        <div className="text-xs uppercase tracking-wider text-[#1E3A5F]">
          {walletLabel}
        </div>
        <div
          className={cn(
            "font-heading text-[22px] font-extrabold",
            budgetRemaining < 0 ? "text-[#E11D48]" : "text-[#031F82]",
          )}
        >
          ${budgetSpent} / ${total}
        </div>
      </div>
    </>
  );
}
