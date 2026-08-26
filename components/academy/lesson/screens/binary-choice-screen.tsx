"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LessonChoiceButton } from "@/components/academy/lesson/lesson-choice-button";
import {
  lessonChoiceStackClass,
  usesNeutralChoiceFeedback,
} from "@/components/academy/lesson/lesson-shared-styles";
import {
  LessonScreenLayout,
} from "@/components/academy/lesson/lesson-ui";
import { findAllOfTheAboveCorrectKey } from "@/lib/academy/lessons/all-of-the-above";
import {
  getCorrectOptionKeys,
  isLessonChoiceOptionCorrect,
  isMultiSelectComplete,
  isPartialCorrectSelection,
  resolveChoiceSelectionVariant,
} from "@/lib/academy/lessons/choice-evaluation";
import type { BinaryChoiceScreenConfig } from "@/lib/academy/lessons/types";
import {
  celebrateLessonCorrectAnswer,
  signalLessonIncorrectAnswer,
} from "@/lib/academy/lessons/utils";
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
  const correctKeys = getCorrectOptionKeys(choiceOptions);
  const allOfTheAboveKey = findAllOfTheAboveCorrectKey(choiceOptions);
  const isAllOfTheAboveQuestion = allOfTheAboveKey !== null;
  const neutralSelected = usesNeutralChoiceFeedback(screen.choiceFeedback);

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
  const [neutralPicked, setNeutralPicked] = useState<ReadonlySet<ChoiceKey>>(
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

  /** Derive Next-button readiness from the current selection only. */
  const syncMultiSelectCompletion = useCallback(
    (locked: ReadonlySet<ChoiceKey>, wrong: ReadonlySet<ChoiceKey>) => {
      if (isAllOfTheAboveQuestion && allOfTheAboveKey) {
        const selectedAllOfTheAbove = locked.has(allOfTheAboveKey);

        if (selectedAllOfTheAbove) {
          setError(null);
          setSuccess(screen.successMessage?.trim() || null);
          flow.markScreenReady(screenIndex);
        } else {
          setSuccess(null);
          flow.clearScreenReady(screenIndex);
        }
        return;
      }

      if (
        isMultiSelectComplete({
          correctKeys,
          lockedCorrectKeys: locked,
          wrongPickedKeys: wrong,
        })
      ) {
        setError(null);
        setSuccess(screen.successMessage?.trim() || null);
        celebrateLessonCorrectAnswer(flow.flashScreen);
        flow.markScreenReady(screenIndex);
      } else {
        setSuccess(null);
        if (wrong.size === 0 && isPartialCorrectSelection(locked, correctKeys)) {
          setError(null);
        }
        flow.clearScreenReady(screenIndex);
      }
    },
    [
      allOfTheAboveKey,
      correctKeys,
      flow,
      isAllOfTheAboveQuestion,
      screen.successMessage,
      screenIndex,
    ],
  );

  const pickSingleAllOfTheAbove = (which: ChoiceKey) => {
    setChoice(which);
    setError(null);
    setSuccess(null);

    if (which === allOfTheAboveKey) {
      celebrateLessonCorrectAnswer(flow.flashScreen);
      setSuccess(
        optionByKey.get(which)?.feedback?.trim() ||
          screen.successMessage?.trim() ||
          null,
      );
      flow.markScreenReady(screenIndex);
      return;
    }

    flow.clearScreenReady(screenIndex);
  };

  const pickSingle = (which: ChoiceKey) => {
    if (isAllOfTheAboveQuestion) {
      pickSingleAllOfTheAbove(which);
      return;
    }

    setChoice(which);
    const selected = optionByKey.get(which);
    if (selected && isLessonChoiceOptionCorrect(selected)) {
      setError(null);
      setSuccess(
        selected.feedback?.trim() || screen.successMessage?.trim() || null,
      );
      celebrateLessonCorrectAnswer(flow.flashScreen);
      flow.markScreenReady(screenIndex);
      return;
    }
    setSuccess(null);
    setError(selected?.feedback ?? screen.wrongError);
    flow.incrementMistake();
    signalLessonIncorrectAnswer(flow.flashScreen);
  };

  const pickMultiAllOfTheAbove = (which: ChoiceKey) => {
    const selected = optionByKey.get(which);
    if (!selected || !allOfTheAboveKey) return;

    if (which === allOfTheAboveKey) {
      if (lockedCorrect.has(which)) {
        if (lockCorrectSelections) return;
        const nextLocked = new Set<ChoiceKey>();
        setLockedCorrect(nextLocked);
        syncMultiSelectCompletion(nextLocked, wrongPicked);
        return;
      }

      clearScheduledDudReset();
      const nextLocked = new Set<ChoiceKey>([allOfTheAboveKey]);
      setLockedCorrect(nextLocked);
      celebrateLessonCorrectAnswer(flow.flashScreen);
      syncMultiSelectCompletion(nextLocked, wrongPicked);
      return;
    }

    if (neutralPicked.has(which)) {
      const nextNeutral = new Set(neutralPicked);
      nextNeutral.delete(which);
      setNeutralPicked(nextNeutral);
      setError(null);
      syncMultiSelectCompletion(lockedCorrect, wrongPicked);
      return;
    }

    clearScheduledDudReset();
    setError(null);
    setNeutralPicked(new Set(neutralPicked).add(which));
    syncMultiSelectCompletion(lockedCorrect, wrongPicked);
  };

  const pickMulti = (which: ChoiceKey) => {
    if (isAllOfTheAboveQuestion) {
      pickMultiAllOfTheAbove(which);
      return;
    }

    const selected = optionByKey.get(which);
    if (!selected) return;

    if (lockedCorrect.has(which)) {
      if (lockCorrectSelections) return;
      const nextLocked = new Set(lockedCorrect);
      nextLocked.delete(which);
      setLockedCorrect(nextLocked);
      syncMultiSelectCompletion(nextLocked, wrongPicked);
      return;
    }

    if (wrongPicked.has(which)) {
      const nextWrong = new Set(wrongPicked);
      nextWrong.delete(which);
      setWrongPicked(nextWrong);
      setError(null);
      clearScheduledDudReset();
      syncMultiSelectCompletion(lockedCorrect, nextWrong);
      return;
    }

    if (isLessonChoiceOptionCorrect(selected)) {
      clearScheduledDudReset();
      setError(null);
      const nextLocked = new Set(lockedCorrect).add(which);
      const nextWrong = new Set(wrongPicked);
      nextWrong.delete(which);
      setLockedCorrect(nextLocked);
      setWrongPicked(nextWrong);
      celebrateLessonCorrectAnswer(flow.flashScreen, { flash: false });
      syncMultiSelectCompletion(nextLocked, nextWrong);
      return;
    }

    if (wrongIsShake) {
      setError(
        selected.feedback ??
          screen.wrongError ??
          "Not quite! That button is trying to do the thinking for you. Don't let it!",
      );
      scheduleDudFeedbackReset(which);
      syncMultiSelectCompletion(lockedCorrect, wrongPicked);
      return;
    }

    const nextWrong = new Set(wrongPicked).add(which);
    const nextLocked = new Set(lockedCorrect);
    nextLocked.delete(which);
    setLockedCorrect(nextLocked);
    setWrongPicked(nextWrong);
    syncMultiSelectCompletion(nextLocked, nextWrong);
  };

  const pick = isMultiCorrect ? pickMulti : pickSingle;

  const getVariant = (key: ChoiceKey): "neutral" | "correct" | "wrong" => {
    const option = optionByKey.get(key);
    const isCorrectOption = option
      ? isLessonChoiceOptionCorrect(option)
      : false;
    const selected = isSelected(key);

    if (isAllOfTheAboveQuestion && allOfTheAboveKey) {
      if (isMultiCorrect) {
        return resolveChoiceSelectionVariant({
          isSelected: selected,
          isCorrect: key === allOfTheAboveKey,
          isShaking: shakingKey === key,
          useNeutralFeedback: neutralSelected || key !== allOfTheAboveKey,
        });
      }

      return resolveChoiceSelectionVariant({
        isSelected: choice === key,
        isCorrect: key === allOfTheAboveKey,
        useNeutralFeedback: neutralSelected || key !== allOfTheAboveKey,
      });
    }

    return resolveChoiceSelectionVariant({
      isSelected: selected,
      isCorrect: isCorrectOption,
      isShaking: shakingKey === key,
      useNeutralFeedback: neutralSelected,
    });
  };

  const isSelected = (key: ChoiceKey): boolean => {
    if (isAllOfTheAboveQuestion) {
      if (isMultiCorrect) {
        if (shakingKey === key) return false;
        return (
          lockedCorrect.has(key) ||
          neutralPicked.has(key) ||
          wrongPicked.has(key)
        );
      }
      return choice === key;
    }

    if (isMultiCorrect) {
      if (shakingKey === key) return false;
      return lockedCorrect.has(key) || wrongPicked.has(key);
    }
    return choice === key;
  };

  const isRadioListLayout = isRadioList;

  const renderOptionList = () =>
    optionOrder.map((key) => {
      const option = optionByKey.get(key);
      if (!option) return null;
      const variant = getVariant(key);
      const selected = isSelected(key);
      const isLockedCorrect = lockCorrectSelections && lockedCorrect.has(key);

      return (
        <LessonChoiceButton
          key={key}
          layout={isRadioListLayout ? "radio-row" : "pill"}
          onClick={(event) => {
            event.stopPropagation();
            pick(key);
            if (isMultiCorrect && wrongIsShake && !isLessonChoiceOptionCorrect(option)) {
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
      <LessonScreenLayout
        prompt={screen.prompt}
        emphasizeInstruction={screen.emphasizeInstruction === true}
        successMessage={success}
        errorMessage={error}
        errorVariant={screen.errorStyle === "banner" ? "banner" : "inline"}
      >
        {screen.scenePrompt ? (
          <p className="mt-4 font-sans text-base font-normal leading-relaxed text-[#1E3A5F]">
            {screen.scenePrompt}
          </p>
        ) : null}

        <div className="mt-3 space-y-1">{renderOptionList()}</div>
      </LessonScreenLayout>
    );
  }

  return (
    <LessonScreenLayout
      prompt={screen.prompt}
      emphasizeInstruction={screen.emphasizeInstruction === true}
      successMessage={success}
      errorMessage={error}
      errorVariant={screen.errorStyle === "banner" ? "banner" : "inline"}
    >
      <div className={lessonChoiceStackClass}>{renderOptionList()}</div>
    </LessonScreenLayout>
  );
}
