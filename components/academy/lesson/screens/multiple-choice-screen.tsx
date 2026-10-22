"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { usePlaySeed } from "@/components/academy/lesson/hooks/use-play-seed";
import { useLessonCash } from "@/components/academy/lesson/lesson-cash";
import { useCompletedHubSkills } from "@/components/academy/lesson/lesson-hub-progress";
import { LessonChoiceButton } from "@/components/academy/lesson/lesson-choice-button";
import {
  lessonChoiceStackClass,
  lessonNextButtonClass,
} from "@/components/academy/lesson/lesson-shared-styles";
import {
  LessonScreenLayout,
  lessonFeedbackCopy,
} from "@/components/academy/lesson/lesson-ui";
import {
  cashMatches,
  displayCashText,
  type CashComparison,
  type CashUpdate,
} from "@/lib/academy/lessons/payload/cash-placeholder";
import { isNeutralTrueStatement, isPinnedChoiceLabel } from "@/lib/academy/lessons/all-of-the-above";
import { seededShuffle } from "@/lib/academy/lessons/seeded-shuffle";
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

const WRONG_SHAKE_MS = 360;

function choiceEmoji(_label: string, emoji?: string): string | undefined {
  return emoji;
}

export function MultipleChoiceScreen({
  screen,
  screenIndex,
  flow,
}: StandardScreenProps<MultipleChoicePayload>) {
  const { cash, commitCash } = useLessonCash();
  const completedHubSkills = useCompletedHubSkills();
  const continueToLabel = screen.continueToLabel;
  const authoredOptions = collectMultipleChoiceOptions(screen);
  const continueOnly = Boolean(continueToLabel) && authoredOptions.length === 0;
  const cashFiltered = authoredOptions.filter((option) => cashMatches(option.showWhen, cash));
  const choiceOptions: ChoiceOption[] = continueOnly
    ? []
    : cashFiltered.length > 0
      ? cashFiltered
      : authoredOptions;

  const isRadioList = screen.optionLayout === "radio-list";
  const correctKeys = getCorrectOptionKeys(choiceOptions);
  const isMultiCorrect = correctKeys.length > 1;
  const neutralTrueOptions = choiceOptions.filter((option) =>
    isNeutralTrueStatement(choiceOptions, option.key),
  );
  const neutralTrueKeys = new Set(neutralTrueOptions.map((option) => option.key));
  const optionByKey = new Map(choiceOptions.map((option) => [option.key, option]));

  const [optionOrder, setOptionOrder] = useState<ChoiceKey[]>(() =>
    choiceOptions.map((option) => option.key),
  );
  const choiceSignature = choiceOptions
    .map((option) => `${option.key}:${option.label}`)
    .join("|");
  const choiceOptionsRef = useRef(choiceOptions);
  choiceOptionsRef.current = choiceOptions;
  const skillHub = screen.skillHub === true;
  const playSeed = usePlaySeed([screen.id, skillHub ? "fixed" : "choices"]);

  useLayoutEffect(() => {
    const options = choiceOptionsRef.current;
    if (skillHub || playSeed === null) {
      setOptionOrder(options.map((option) => option.key));
      return;
    }
    setOptionOrder(
      seededShuffle(options, playSeed, {
        pinLast: (option) => isPinnedChoiceLabel(option.label),
      }).map((option) => option.key),
    );
  }, [choiceSignature, playSeed, skillHub]);
  const [choice, setChoice] = useState<ChoiceKey | null>(null);
  const [multiSelected, setMultiSelected] = useState<ReadonlySet<ChoiceKey>>(
    () => new Set(),
  );
  const [solved, setSolved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const flowRef = useRef(flow);
  flowRef.current = flow;
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
  const isMultiCorrectRef = useRef(isMultiCorrect);
  isMultiCorrectRef.current = isMultiCorrect;
  const neutralTrueKeysRef = useRef(neutralTrueKeys);
  neutralTrueKeysRef.current = neutralTrueKeys;
  const commitCashRef = useRef(commitCash);
  commitCashRef.current = commitCash;
  const wrongTimersRef = useRef<Map<ChoiceKey, number>>(new Map());

  useEffect(
    () => () => {
      for (const timer of wrongTimersRef.current.values()) {
        window.clearTimeout(timer);
      }
    },
    [],
  );

  const scheduleWrongReset = (key: ChoiceKey) => {
    const existing = wrongTimersRef.current.get(key);
    if (existing !== undefined) window.clearTimeout(existing);
    const timer = window.setTimeout(() => {
      wrongTimersRef.current.delete(key);
      if (solvedRef.current) return;
      if (isMultiCorrectRef.current) {
        setMultiSelected((current) => {
          if (!current.has(key)) return current;
          const next = new Set(current);
          next.delete(key);
          multiSelectedRef.current = next;
          return next;
        });
        return;
      }
      setChoice((current) => {
        if (current !== key) return current;
        choiceRef.current = null;
        return null;
      });
    }, WRONG_SHAKE_MS);
    wrongTimersRef.current.set(key, timer);
  };

  const isSelected = (key: ChoiceKey): boolean => {
    if (isMultiCorrect) return multiSelected.has(key);
    return choice === key;
  };

  const lockCorrect = () => {
    setError(null);
    setSuccess(true);
    setSolved(true);
    solvedRef.current = true;
    celebrateLessonCorrectAnswer();
    flowRef.current.recordBonusRunCorrect();
    flowRef.current.markScreenReady(screenIndex);
  };

  const pick = (key: ChoiceKey) => {
    if (solved) return;
    setError(null);
    setSuccess(false);

    if (isMultiCorrect) {
      const next = new Set(multiSelectedRef.current);
      const turningOn = !next.has(key);
      if (turningOn) next.add(key);
      else next.delete(key);
      multiSelectedRef.current = next;
      setMultiSelected(next);

      if (screenRef.current.decisionPath) {
        flowRef.current.markScreenReady(screenIndex);
        return;
      }

      const keys = correctKeysRef.current;
      if (turningOn && !keys.includes(key)) {
        setSolved(false);
        solvedRef.current = false;
        setError(resolveErrorCopy());
        flowRef.current.clearScreenReady(screenIndex);
        flowRef.current.incrementMistake();
        signalLessonIncorrectAnswer();
        scheduleWrongReset(key);
        return;
      }

      const exact =
        !hasIncorrectSelection(next, keys) &&
        keys.every((correctKey) => next.has(correctKey));
      if (exact) {
        lockCorrect();
        return;
      }

      setSolved(false);
      solvedRef.current = false;
      flowRef.current.clearScreenReady(screenIndex);
      return;
    }

    setChoice(key);
    choiceRef.current = key;

    if (screenRef.current.decisionPath) {
      flowRef.current.markScreenReady(screenIndex);
      return;
    }

    if (neutralTrueKeysRef.current.has(key)) {
      setSolved(false);
      solvedRef.current = false;
      setError(lessonFeedbackCopy(screenRef.current.wrongError) ?? null);
      flowRef.current.clearScreenReady(screenIndex);
      return;
    }

    const selected = optionByKeyRef.current.get(key);
    if (selected && isLessonChoiceOptionCorrect(selected)) {
      lockCorrect();
      return;
    }

    setError(resolveErrorCopy());
    flowRef.current.incrementMistake();
    signalLessonIncorrectAnswer();
    scheduleWrongReset(key);
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
    activeMultipleChoiceNextHandler = () => {
      const decisionPath = screenRef.current.decisionPath === true;
      const selected = optionByKeyRef.current.get(choiceRef.current ?? "");

      if (decisionPath) {
        if (!selected) {
          setSuccess(false);
          setError(
            lessonFeedbackCopy(screenRef.current.wrongError) ??
              "Pick one to keep going.",
          );
          return false;
        }
        if (selected.cashUpdate) commitCashRef.current(selected.cashUpdate);
        if (typeof selected.goToIndex === "number") {
          flowRef.current.setScreenIndex(selected.goToIndex);
          return false;
        }
        return true;
      }

      if (!solvedRef.current) return false;

      if (selected?.cashUpdate) commitCashRef.current(selected.cashUpdate);
      if (typeof selected?.goToIndex === "number") {
        flowRef.current.setScreenIndex(selected.goToIndex);
        return false;
      }
      return true;
    };

    return () => {
      activeMultipleChoiceNextHandler = null;
    };
  }, []);

  const renderOptionList = () =>
    optionOrder.map((key) => {
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
          emoji={choiceEmoji(option.label, option.emoji)}
          disabled={lockedUntilHubDone}
          onClick={(event) => {
            event.stopPropagation();
            if (lockedUntilHubDone) return;
            pick(key);
          }}
          selected={selected}
          locked={solved && selected}
          wrong={
            !solved &&
            selected &&
            error !== null &&
            screen.decisionPath !== true &&
            !neutralTrueKeys.has(key) &&
            !isLessonChoiceOptionCorrect(option)
          }
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

  if (continueOnly) {
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
