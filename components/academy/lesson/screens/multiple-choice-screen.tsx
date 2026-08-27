"use client";

import { useEffect, useRef, useState } from "react";
import { LESSON_SUCCESS_FLASH_MS } from "@/components/academy/lesson/hooks/use-lesson-screen-flow";
import { LessonChoiceButton } from "@/components/academy/lesson/lesson-choice-button";
import { lessonChoiceStackClass } from "@/components/academy/lesson/lesson-shared-styles";
import {
  LessonScreenLayout,
  lessonFeedbackCopy,
} from "@/components/academy/lesson/lesson-ui";
import { findAllOfTheAboveCorrectKey } from "@/lib/academy/lessons/all-of-the-above";
import { collectMultipleChoiceOptions } from "@/lib/academy/lessons/multiple-choice-options";
import {
  getCorrectOptionKeys,
  hasIncorrectSelection,
  isLessonChoiceOptionCorrect,
} from "@/lib/academy/lessons/choice-evaluation";
import type { MultipleChoiceScreen as MultipleChoicePayload } from "@/lib/academy/lessons/types";
import {
  celebrateLessonCorrectAnswer,
  signalLessonIncorrectAnswer,
} from "@/lib/academy/lessons/utils";
import type { StandardScreenProps } from "./types";

type ChoiceKey = string;
type ChoiceOption = {
  key: ChoiceKey;
  label: string;
  isCorrect: boolean;
  feedback?: string;
};

type MultipleChoiceNextHandler = () => boolean;

let activeMultipleChoiceNextHandler: MultipleChoiceNextHandler | null = null;

/** Used by the lesson runner Next control. No-ops unless a multiple-choice screen is active. */
export function runMultipleChoiceNextHandler(): boolean {
  if (!activeMultipleChoiceNextHandler) return true;
  return activeMultipleChoiceNextHandler();
}

function letterForIndex(index: number): string {
  return String.fromCharCode(65 + index);
}

export function MultipleChoiceScreen({
  screen,
  screenIndex,
  flow,
}: StandardScreenProps<MultipleChoicePayload>) {
  const choiceOptions: ChoiceOption[] = collectMultipleChoiceOptions(screen);

  const isRadioList = screen.optionLayout === "radio-list";
  const correctKeys = getCorrectOptionKeys(choiceOptions);
  const isMultiCorrect = correctKeys.length > 1;
  const allOfTheAboveKey = findAllOfTheAboveCorrectKey(choiceOptions);
  const isAllOfTheAboveQuestion = allOfTheAboveKey !== null;
  const optionByKey = new Map(choiceOptions.map((option) => [option.key, option]));

  const [optionOrder] = useState<ChoiceKey[]>(() =>
    choiceOptions.map((option) => option.key),
  );
  const [choice, setChoice] = useState<ChoiceKey | null>(null);
  const [multiSelected, setMultiSelected] = useState<ReadonlySet<ChoiceKey>>(
    () => new Set(),
  );
  const [solved, setSolved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const flowRef = useRef(flow);
  flowRef.current = flow;
  const advancingRef = useRef(false);
  const choiceRef = useRef(choice);
  choiceRef.current = choice;
  const multiSelectedRef = useRef(multiSelected);
  multiSelectedRef.current = multiSelected;
  const solvedRef = useRef(solved);
  solvedRef.current = solved;
  const screenRef = useRef(screen);
  screenRef.current = screen;
  const optionByKeyRef = useRef(optionByKey);
  optionByKeyRef.current = optionByKey;
  const correctKeysRef = useRef(correctKeys);
  correctKeysRef.current = correctKeys;
  const allOfTheAboveKeyRef = useRef(allOfTheAboveKey);
  allOfTheAboveKeyRef.current = allOfTheAboveKey;
  const isMultiCorrectRef = useRef(isMultiCorrect);
  isMultiCorrectRef.current = isMultiCorrect;
  const isAllOfTheAboveQuestionRef = useRef(isAllOfTheAboveQuestion);
  isAllOfTheAboveQuestionRef.current = isAllOfTheAboveQuestion;

  const isSelected = (key: ChoiceKey): boolean => {
    if (isMultiCorrect) return multiSelected.has(key);
    return choice === key;
  };

  const pick = (key: ChoiceKey) => {
    if (solved) return;
    setError(null);
    setSuccess(false);

    if (isMultiCorrect) {
      setMultiSelected((current) => {
        const next = new Set(current);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        return next;
      });
      return;
    }

    setChoice(key);
  };

  const isCurrentSelectionCorrect = (): boolean => {
    const allOfTheAboveKey = allOfTheAboveKeyRef.current;
    const correctKeys = correctKeysRef.current;
    const optionByKey = optionByKeyRef.current;

    if (isAllOfTheAboveQuestionRef.current && allOfTheAboveKey) {
      return choiceRef.current === allOfTheAboveKey;
    }

    if (isMultiCorrectRef.current) {
      const selected = multiSelectedRef.current;
      if (hasIncorrectSelection(selected, correctKeys)) return false;
      return correctKeys.every((key) => selected.has(key));
    }

    const selected = optionByKey.get(choiceRef.current ?? "");
    return selected ? isLessonChoiceOptionCorrect(selected) : false;
  };

  const resolveErrorCopy = (): string => {
    const screen = screenRef.current;
    if (!isMultiCorrectRef.current) {
      const selected = optionByKeyRef.current.get(choiceRef.current ?? "");
      return lessonFeedbackCopy(selected?.feedback, screen.wrongError) ?? "";
    }
    return lessonFeedbackCopy(screen.wrongError) ?? "";
  };

  useEffect(() => {
    flowRef.current.markScreenReady(screenIndex);
  }, [screenIndex]);

  useEffect(() => {
    advancingRef.current = false;
    let advanceTimer: number | null = null;

    activeMultipleChoiceNextHandler = () => {
      if (advancingRef.current || solvedRef.current) return false;

      if (!isCurrentSelectionCorrect()) {
        setSuccess(false);
        setError(resolveErrorCopy());
        flowRef.current.incrementMistake();
        signalLessonIncorrectAnswer(flowRef.current.flashScreen);
        return false;
      }

      advancingRef.current = true;
      solvedRef.current = true;
      setSolved(true);
      setError(null);
      setSuccess(true);
      celebrateLessonCorrectAnswer(flowRef.current.flashScreen);
      advanceTimer = window.setTimeout(() => {
        flowRef.current.handleNext();
      }, LESSON_SUCCESS_FLASH_MS);
      return false;
    };

    return () => {
      if (advanceTimer !== null) window.clearTimeout(advanceTimer);
      activeMultipleChoiceNextHandler = null;
    };
  }, []);

  const renderOptionList = () =>
    optionOrder.map((key, index) => {
      const option = optionByKey.get(key);
      if (!option) return null;
      const selected = isSelected(key);

      return (
        <LessonChoiceButton
          key={key}
          layout={isRadioList ? "radio-row" : "pill"}
          orbLabel={letterForIndex(index)}
          onClick={(event) => {
            event.stopPropagation();
            pick(key);
          }}
          selected={selected}
          locked={solved && selected}
        >
          {option.label}
        </LessonChoiceButton>
      );
    });

  return (
    <LessonScreenLayout
      prompt={screen.prompt}
      emphasizeInstruction={screen.emphasizeInstruction === true}
      success={success}
      errorMessage={error}
      errorVariant={screen.errorStyle === "banner" ? "banner" : "inline"}
    >
      {isRadioList && screen.scenePrompt ? (
        <p className="mt-4 font-sans text-base font-normal leading-relaxed text-[#1E3A5F]">
          {screen.scenePrompt}
        </p>
      ) : null}
      <div className={isRadioList ? "mt-3 space-y-1" : lessonChoiceStackClass}>
        {renderOptionList()}
      </div>
    </LessonScreenLayout>
  );
}
