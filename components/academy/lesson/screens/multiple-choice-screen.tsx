"use client";

import { useEffect, useRef, useState } from "react";
import { LESSON_SUCCESS_FLASH_MS } from "@/components/academy/lesson/hooks/use-lesson-screen-flow";
import { useLessonCash } from "@/components/academy/lesson/lesson-cash";
import { useCompletedHubSkills } from "@/components/academy/lesson/lesson-hub-progress";
import { LessonChoiceButton } from "@/components/academy/lesson/lesson-choice-button";
import {
  lessonChoiceStackClass,
  lessonNextButtonClass,
  usesNeutralChoiceFeedback,
} from "@/components/academy/lesson/lesson-shared-styles";
import {
  LessonScreenLayout,
  lessonFeedbackCopy,
} from "@/components/academy/lesson/lesson-ui";
import { findAllOfTheAboveCorrectKey } from "@/lib/academy/lessons/all-of-the-above";
import {
  cashMatches,
  displayCashText,
  unselectedNextIsMistake,
  type CashComparison,
  type CashUpdate,
} from "@/lib/academy/lessons/payload/cash-placeholder";
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
  emoji?: string;
  feedback?: string;
  cashUpdate?: CashUpdate;
  goToIndex?: number;
  showWhen?: CashComparison;
  hubSkillKey?: string;
  requiresHubSkills?: readonly string[];
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
  const { cash, commitCash } = useLessonCash();
  const completedHubSkills = useCompletedHubSkills();
  const continueToLabel = screen.continueToLabel;
  const choiceOptions: ChoiceOption[] = continueToLabel
    ? []
    : collectMultipleChoiceOptions(screen).filter((option) =>
        cashMatches(option.showWhen, cash),
      );

  const isRadioList = screen.optionLayout === "radio-list";
  const gradeOnNext = usesNeutralChoiceFeedback(screen.choiceFeedback);
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
  const advanceTimerRef = useRef<number | null>(null);
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
  const commitCashRef = useRef(commitCash);
  commitCashRef.current = commitCash;

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
    choiceRef.current = key;

    if (screenRef.current.decisionPath) {
      flowRef.current.markScreenReady(screenIndex);
      return;
    }

    if (gradeOnNext) {
      flowRef.current.markScreenReady(screenIndex);
      return;
    }

    const selected = optionByKeyRef.current.get(key);
    if (selected && isLessonChoiceOptionCorrect(selected)) {
      flowRef.current.markScreenReady(screenIndex);
      return;
    }

    setError(resolveErrorCopy());
    flowRef.current.incrementMistake();
    signalLessonIncorrectAnswer(flowRef.current.flashScreen);
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
    if (isMultiCorrect) {
      flowRef.current.markScreenReady(screenIndex);
    }
  }, [isMultiCorrect, screenIndex]);

  useEffect(() => {
    activeMultipleChoiceNextHandler = () => {
      if (advancingRef.current || solvedRef.current) return false;

      const decisionPath = screenRef.current.decisionPath === true;
      const selected = optionByKeyRef.current.get(choiceRef.current ?? "");
      if (decisionPath ? !selected : !isCurrentSelectionCorrect()) {
        setSuccess(false);
        setError(resolveErrorCopy());
        if (unselectedNextIsMistake(decisionPath) || selected) {
          flowRef.current.incrementMistake();
          signalLessonIncorrectAnswer(flowRef.current.flashScreen);
        }
        return false;
      }

      advancingRef.current = true;
      solvedRef.current = true;
      setSolved(true);
      setError(null);
      setSuccess(true);
      celebrateLessonCorrectAnswer(flowRef.current.flashScreen);
      advanceTimerRef.current = window.setTimeout(() => {
        advanceTimerRef.current = null;
        const chosen = optionByKeyRef.current.get(choiceRef.current ?? "");
        if (chosen?.cashUpdate) commitCashRef.current(chosen.cashUpdate);
        if (typeof chosen?.goToIndex === "number") {
          flowRef.current.setScreenIndex(chosen.goToIndex);
          return;
        }
        flowRef.current.handleNext({ canAdvance: true });
      }, LESSON_SUCCESS_FLASH_MS);
      return false;
    };

    return () => {
      activeMultipleChoiceNextHandler = null;
    };
  }, []);

  const renderOptionList = () =>
    optionOrder.map((key, index) => {
      const option = optionByKey.get(key);
      if (!option) return null;
      const selected = isSelected(key);
      const lockedUntilHubDone = option.requiresHubSkills?.some(
        (skill) => !completedHubSkills.has(skill),
      );

      return (
        <LessonChoiceButton
          key={key}
          layout={isRadioList ? "radio-row" : "pill"}
          orbLabel={option.emoji ?? letterForIndex(index)}
          disabled={lockedUntilHubDone}
          onClick={(event) => {
            event.stopPropagation();
            if (lockedUntilHubDone) return;
            pick(key);
          }}
          selected={selected}
          pending={gradeOnNext && selected && !solved}
          locked={!gradeOnNext && solved && selected}
        >
          {option.hubSkillKey && completedHubSkills.has(option.hubSkillKey)
            ? `${displayCashText(option.label, cash)} · Done`
            : displayCashText(option.label, cash)}
        </LessonChoiceButton>
      );
    });

  const gatedPrompt =
    cash === null
      ? undefined
      : screen.promptWhen?.find((item) => cashMatches(item.showWhen, cash))?.text;
  const prompt = displayCashText(gatedPrompt ?? screen.prompt, cash);
  const hubSkills = choiceOptions.filter((option) => option.hubSkillKey);
  const hubDone = hubSkills.filter(
    (option) => option.hubSkillKey && completedHubSkills.has(option.hubSkillKey),
  ).length;

  if (continueToLabel) {
    return (
      <LessonScreenLayout prompt={prompt}>
        <button
          type="button"
          className={`${lessonNextButtonClass} mt-6`}
          onClick={() => {
            const target = screen.continueToIndex;
            if (typeof target === "number") {
              flow.setScreenIndex(target);
              return;
            }
            flow.handleNext({ canAdvance: true });
          }}
        >
          Continue
        </button>
      </LessonScreenLayout>
    );
  }

  return (
    <LessonScreenLayout
      prompt={prompt}
      emphasizeInstruction={screen.emphasizeInstruction === true}
      success={success}
      errorMessage={error}
      errorVariant={screen.errorStyle === "banner" ? "banner" : "inline"}
    >
      {isRadioList && screen.scenePrompt ? (
        <p className="mt-2 font-sans text-sm font-normal leading-snug text-[#1E3A5F]">
          {displayCashText(screen.scenePrompt, cash)}
        </p>
      ) : null}
      {screen.skillHub && hubSkills.length > 0 ? (
        <p className="mt-2 font-sans text-sm font-semibold text-[#1E3A5F]">
          {hubDone} of {hubSkills.length} skills done
        </p>
      ) : null}
      <div className={isRadioList ? "mt-3 space-y-1" : lessonChoiceStackClass}>
        {renderOptionList()}
      </div>
    </LessonScreenLayout>
  );
}
