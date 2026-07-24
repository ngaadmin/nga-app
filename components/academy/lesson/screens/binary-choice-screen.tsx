"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LessonChoiceButton } from "@/components/academy/lesson/lesson-choice-button";
import {
  lessonIntroClass,
  lessonPromptClass,
  lessonSuccessMessageClass,
  usesNeutralChoiceFeedback,
} from "@/components/academy/lesson/lesson-shared-styles";
import type { BinaryChoiceScreenConfig } from "@/lib/academy/lessons/types";
import {
  celebrateLessonCorrectAnswer,
  signalLessonIncorrectAnswer,
} from "@/lib/academy/lessons/utils";
import { cn } from "@/lib/utils/cn";
import type { StandardScreenProps } from "./types";

export function BinaryChoiceScreen({
  screen,
  screenIndex,
  flow,
}: StandardScreenProps<BinaryChoiceScreenConfig>) {
  type ChoiceKey = "a" | "b" | "c" | "d" | "e";
  type ChoiceOption = {
    key: ChoiceKey;
    label: string;
    isCorrect: boolean;
    feedback?: string;
  };

  const choiceOptions: ChoiceOption[] = [
    { key: "a", ...screen.optionA },
    { key: "b", ...screen.optionB },
    ...(screen.optionC ? [{ key: "c" as const, ...screen.optionC }] : []),
    ...(screen.optionD ? [{ key: "d" as const, ...screen.optionD }] : []),
    ...(screen.optionE ? [{ key: "e" as const, ...screen.optionE }] : []),
  ];

  const isMultiCorrect = screen.selectionMode === "multi-correct";
  const lockCorrectSelections = screen.lockCorrectSelections ?? false;
  const isRadioList = screen.optionLayout === "radio-list";
  const wrongIsShake =
    screen.wrongInteraction === "shake" ||
    (screen.wrongInteraction !== "persist" &&
      lockCorrectSelections &&
      isMultiCorrect &&
      !isRadioList);
  const correctKeys = choiceOptions.filter((option) => option.isCorrect).map((o) => o.key);
  const neutralSelected = usesNeutralChoiceFeedback(screen.choiceFeedback);
  const promptClass = lessonIntroClass(screen.emphasizeInstruction === true);

  const [optionOrder] = useState<ChoiceKey[]>(() => {
    const keys = choiceOptions.map((option) => option.key);
    if (!isMultiCorrect) return keys;
    const shuffled = [...keys];
    for (let i = shuffled.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
    }
    return shuffled;
  });

  const [choice, setChoice] = useState<ChoiceKey | null>(null);
  const [lockedCorrect, setLockedCorrect] = useState<ReadonlySet<ChoiceKey>>(
    () => new Set(),
  );
  const [wrongPicked, setWrongPicked] = useState<ReadonlySet<ChoiceKey>>(
    () => new Set(),
  );
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [shakingKey, setShakingKey] = useState<ChoiceKey | null>(null);
  const shakeTimeoutRef = useRef<number | null>(null);
  const errorDismissTimeoutRef = useRef<number | null>(null);

  const clearScheduledDudReset = useCallback(() => {
    if (shakeTimeoutRef.current !== null) {
      window.clearTimeout(shakeTimeoutRef.current);
      shakeTimeoutRef.current = null;
    }
    if (errorDismissTimeoutRef.current !== null) {
      window.clearTimeout(errorDismissTimeoutRef.current);
      errorDismissTimeoutRef.current = null;
    }
  }, []);

  const scheduleDudFeedbackReset = useCallback((which: ChoiceKey) => {
    if (shakeTimeoutRef.current !== null) {
      window.clearTimeout(shakeTimeoutRef.current);
    }
    if (errorDismissTimeoutRef.current !== null) {
      window.clearTimeout(errorDismissTimeoutRef.current);
    }

    setShakingKey(which);
    shakeTimeoutRef.current = window.setTimeout(() => {
      setShakingKey(null);
      shakeTimeoutRef.current = null;
    }, 450);

    errorDismissTimeoutRef.current = window.setTimeout(() => {
      setError(null);
      errorDismissTimeoutRef.current = null;
    }, 3200);
  }, []);

  useEffect(
    () => () => {
      clearScheduledDudReset();
    },
    [clearScheduledDudReset],
  );

  const optionByKey = new Map(choiceOptions.map((option) => [option.key, option]));

  const pickSingle = (which: ChoiceKey) => {
    setChoice(which);
    const selected = optionByKey.get(which);
    if (selected?.isCorrect) {
      setError(null);
      setSuccess(selected.feedback ?? screen.successMessage ?? null);
      celebrateLessonCorrectAnswer(flow.flashScreen);
      flow.markScreenReady(screenIndex);
      return;
    }
    setSuccess(null);
    setError(selected?.feedback ?? screen.wrongError);
    flow.incrementMistake();
    signalLessonIncorrectAnswer(flow.flashScreen, {
      flash: screen.errorStyle !== "banner" && !neutralSelected,
    });
  };

  const pickMulti = (which: ChoiceKey) => {
    const selected = optionByKey.get(which);
    if (!selected) return;

    if (lockedCorrect.has(which)) {
      if (lockCorrectSelections) return;
      const nextLocked = new Set(lockedCorrect);
      nextLocked.delete(which);
      setLockedCorrect(nextLocked);
      setSuccess(null);
      flow.clearScreenReady(screenIndex);
      return;
    }

    if (wrongPicked.has(which)) {
      const nextWrong = new Set(wrongPicked);
      nextWrong.delete(which);
      setWrongPicked(nextWrong);
      if (nextWrong.size === 0) {
        setError(null);
      }
      return;
    }

    if (selected.isCorrect) {
      clearScheduledDudReset();
      const nextLocked = new Set(lockedCorrect).add(which);
      setLockedCorrect(nextLocked);
      setError(null);
      celebrateLessonCorrectAnswer(flow.flashScreen);

      if (correctKeys.every((key) => nextLocked.has(key))) {
        setSuccess(screen.successMessage ?? null);
        flow.markScreenReady(screenIndex);
      } else {
        flow.clearScreenReady(screenIndex);
      }
      return;
    }

    if (wrongIsShake) {
      setWrongPicked((current) => {
        if (!current.has(which)) return current;
        const next = new Set(current);
        next.delete(which);
        return next;
      });
      setSuccess(null);
      flow.clearScreenReady(screenIndex);
      setError(
        selected.feedback ??
          screen.wrongError ??
          "Not quite! That button is trying to do the thinking for you. Don't let it!",
      );
      flow.incrementMistake();
      signalLessonIncorrectAnswer(flow.flashScreen, {
        flash: screen.errorStyle !== "banner" && !neutralSelected,
      });
      scheduleDudFeedbackReset(which);
      return;
    }

    setWrongPicked((current) => new Set(current).add(which));
    setSuccess(null);
    flow.clearScreenReady(screenIndex);
    setError(selected.feedback ?? screen.wrongError);
    flow.incrementMistake();
    signalLessonIncorrectAnswer(flow.flashScreen, {
      flash: screen.errorStyle !== "banner" && !neutralSelected,
    });
  };

  const pick = isMultiCorrect ? pickMulti : pickSingle;

  const getVariant = (key: ChoiceKey): "neutral" | "correct" | "wrong" => {
    if (neutralSelected) return "neutral";
    if (isMultiCorrect) {
      if (shakingKey === key) return "neutral";
      if (lockedCorrect.has(key)) {
        return lockCorrectSelections ? "neutral" : "correct";
      }
      if (wrongPicked.has(key)) return "wrong";
      return "neutral";
    }
    if (choice !== key) return "neutral";
    return optionByKey.get(key)?.isCorrect ? "correct" : "wrong";
  };

  const isSelected = (key: ChoiceKey): boolean => {
    if (isMultiCorrect) {
      if (shakingKey === key) return false;
      return lockedCorrect.has(key) || wrongPicked.has(key);
    }
    return choice === key;
  };

  const isRadioListLayout = isRadioList;

  const renderRadioIndicator = (variant: "neutral" | "correct" | "wrong") => (
    <span
      className={cn(
        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
        variant === "correct" && "border-[#16A34A] bg-[#86EFAC]",
        variant === "wrong" && "border-[#E11D48] bg-[#FDA4AF]",
        variant === "neutral" && "border-[#BDE9FB] bg-white",
      )}
      aria-hidden
    >
      {variant === "correct" ? (
        <span className="h-2.5 w-2.5 rounded-full bg-[#16A34A]" />
      ) : null}
      {variant === "wrong" ? (
        <span className="h-2.5 w-2.5 rounded-full bg-[#E11D48]" />
      ) : null}
    </span>
  );

  const renderOptionList = () =>
    optionOrder.map((key) => {
      const option = optionByKey.get(key);
      if (!option) return null;
      const variant = getVariant(key);
      const selected = isSelected(key);

      if (isRadioListLayout) {
        return (
          <button
            key={key}
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              pick(key);
            }}
            className="flex w-full items-center gap-3 py-2.5 text-left"
          >
            {renderRadioIndicator(variant)}
            <span className="font-heading text-base font-bold leading-snug text-[#031F82]">
              {option.label}
            </span>
          </button>
        );
      }

      const isLockedCorrect = lockCorrectSelections && lockedCorrect.has(key);

      return (
        <LessonChoiceButton
          key={key}
          onClick={(event) => {
            event.stopPropagation();
            pick(key);
            if (isMultiCorrect && wrongIsShake && !option.isCorrect) {
              event.currentTarget.blur();
            }
          }}
          selected={selected}
          variant={variant}
          locked={isLockedCorrect}
          className={shakingKey === key ? "animate-lesson-shake" : undefined}
        >
          {option.label}
        </LessonChoiceButton>
      );
    });

  if (isRadioListLayout) {
    return (
      <>
        {screen.imagePlaceholder ? (
          <div
            className="flex aspect-[5/3] w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#BDE9FB] bg-[#F7FBFF] px-4 text-center"
            role="img"
            aria-label={screen.imagePlaceholder.alt ?? screen.imagePlaceholder.label}
          >
            <p className="font-heading text-[10px] font-bold uppercase tracking-wide text-[#0CC1E0]">
              Image placeholder
            </p>
            <p className="mt-1 font-heading text-sm font-bold text-[#031F82]">
              {screen.imagePlaceholder.label}
            </p>
          </div>
        ) : null}

        {screen.scenePrompt ? (
        <p className="mt-4 font-sans text-base font-normal leading-relaxed text-[#1E3A5F]">
          {screen.scenePrompt}
        </p>
      ) : null}

        <p className={cn("mt-4", lessonPromptClass)}>
          {screen.prompt}
        </p>

        <div className="mt-3 space-y-1">{renderOptionList()}</div>

        {success ? (
          <p className={lessonSuccessMessageClass}>{success}</p>
        ) : null}
        {error ? (
          <p
            className={cn(
              "mt-4 font-sans text-xs",
              screen.errorStyle === "banner"
                ? "rounded-xl bg-[#FFF7ED] px-3 py-2 text-[#031F82]"
                : "text-[#E11D48]",
            )}
          >
            {error}
          </p>
        ) : null}
      </>
    );
  }

  return (
    <>
      <p className={promptClass}>{screen.prompt}</p>
      <div className="mt-5 space-y-3">{renderOptionList()}</div>
      {success ? (
        <p className={lessonSuccessMessageClass}>{success}</p>
      ) : null}
      {error ? (
        <p
          className={cn(
            "mt-4 font-sans text-xs",
            screen.errorStyle === "banner"
              ? "rounded-xl bg-[#FFF7ED] px-3 py-2 text-[#031F82]"
              : "text-[#E11D48]",
          )}
        >
          {error}
        </p>
      ) : null}
    </>
  );
}
