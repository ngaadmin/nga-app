"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  cnLessonChoice,
  lessonIntroClass,
} from "@/components/academy/lesson/lesson-shared-styles";
import { LessonCard, LessonColumnLabel } from "@/components/academy/lesson/lesson-ui";
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
      onPersistentError?.(errors.overBudget);
      return;
    }

    setCheckedIds(next);

    if (tryComplete(next, nextSpent)) return;

    const message = resolveError(next, nextSpent);
    if (message) {
      onMistake();
      onPersistentError?.(message);
    }
  };

  return (
    <>
      <p className={lessonIntroClass()}>{intro}</p>
      <LessonCard className="mt-4 text-center">
        <LessonColumnLabel>{walletLabel}</LessonColumnLabel>
        <p
          className={cn(
            "mt-2 font-heading text-3xl font-extrabold",
            budgetRemaining < 0 ? "text-[#E11D48]" : "text-[#031F82]",
          )}
        >
          ${Math.max(0, budgetRemaining)}
        </p>
      </LessonCard>
      <div className="mt-3 space-y-2" role="group" aria-label="Budget items">
        {items.map((item) => {
          const checked = checkedIds.has(item.id);
          const isCorrectItem = correctIds.includes(item.id);
          const selectionVariant = checked
            ? isCorrectItem
              ? "correct"
              : "wrong"
            : "neutral";
          const label =
            item.emoji && !item.label.includes(item.emoji)
              ? `${item.emoji} ${item.label}`
              : item.label;
          return (
            <div key={item.id} className="flex items-center gap-2.5">
              <input
                type="checkbox"
                id={`budget-${item.id}`}
                checked={checked}
                onChange={(event) => {
                  event.stopPropagation();
                  toggle(item.id, event.target.checked);
                }}
                className="h-5 w-5 shrink-0 cursor-pointer accent-[#0CC1E0]"
                aria-label={label}
              />
              <label
                htmlFor={`budget-${item.id}`}
                className={cn(
                  cnLessonChoice(checked, selectionVariant),
                  "min-h-[3rem] flex-1 cursor-pointer items-center px-3 py-2.5",
                )}
              >
                <span className="w-full text-center text-base font-medium">
                  {label}
                  {item.price > 0 ? (
                    <span className="ml-1 font-heading text-[#0CC1E0]">
                      (${item.price})
                    </span>
                  ) : null}
                </span>
              </label>
            </div>
          );
        })}
      </div>
    </>
  );
}
