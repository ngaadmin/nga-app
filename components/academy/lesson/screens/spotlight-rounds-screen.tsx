"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  LESSON_SUCCESS_FLASH_MS,
  useLessonSuccessFlash,
} from "@/components/academy/lesson/hooks/use-lesson-screen-flow";
import { useLessonCash } from "@/components/academy/lesson/lesson-cash";
import {
  LessonFalseIcon,
  LessonTrueIcon,
} from "@/components/academy/lesson/lesson-icons";
import {
  lessonPromptClass,
  resolveChoiceVariant,
} from "@/components/academy/lesson/lesson-shared-styles";
import {
  LessonIconOption,
  LessonScreenLayout,
  lessonFeedbackCopy,
} from "@/components/academy/lesson/lesson-ui";
import {
  cashMatches,
  fillCashPlaceholder,
} from "@/lib/academy/lessons/payload/cash-placeholder";
import type { SpotlightRoundsScreenConfig } from "@/lib/academy/lessons/types";
import {
  celebrateLessonCorrectAnswer,
  signalLessonIncorrectAnswer,
} from "@/lib/academy/lessons/utils";
import { cn } from "@/lib/utils/cn";
import type { StandardScreenProps } from "./types";

type SideLayout = { left: "a" | "b"; right: "a" | "b" };

/** Matches lesson flow error flash duration (use-lesson-flow.ts). */
const FEEDBACK_RECOVERY_MS = 450;

/** Scaled to the 88px option circle; default glyph is sized for the 48px true/false orb. */
const TRUE_FALSE_GLYPH_CLASS = "!size-10 text-[#031F82]";

function spotlightChoiceGlyph(label: string): ReactNode | null {
  const normalized = label.trim().toLowerCase();
  if (normalized === "true") {
    return <LessonTrueIcon className={TRUE_FALSE_GLYPH_CLASS} />;
  }
  if (normalized === "false") {
    return <LessonFalseIcon className={TRUE_FALSE_GLYPH_CLASS} />;
  }
  return null;
}

function buildRoundSideLayouts(roundCount: number): SideLayout[] {
  return Array.from({ length: roundCount }, () =>
    Math.random() < 0.5
      ? { left: "a" as const, right: "b" as const }
      : { left: "b" as const, right: "a" as const },
  );
}

type SpotlightScreenProps = StandardScreenProps<SpotlightRoundsScreenConfig> & {
  onPersistentError?: (message: string) => void;
  onDismissError?: () => void;
};

type SpotlightDecisionNextHandler = () => boolean;

let activeSpotlightDecisionNextHandler: SpotlightDecisionNextHandler | null = null;

/** Used by the lesson runner Next control for decision spotlights. */
export function runSpotlightDecisionNextHandler(): boolean {
  if (!activeSpotlightDecisionNextHandler) return true;
  return activeSpotlightDecisionNextHandler();
}

function letterForIndex(index: number): string {
  return String.fromCharCode(65 + index);
}

/** Side-by-side choices that keep cash updates and GO targets. */
function SpotlightDecisionChoices({
  screen,
  screenIndex,
  flow,
}: SpotlightScreenProps) {
  const { cash, commitCash } = useLessonCash();
  const options = screen.options ?? [];
  const visible = options
    .map((option, index) => ({ option, index }))
    .filter(({ option }) => cashMatches(option.showWhen, cash));
  const [choice, setChoice] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const flowRef = useRef(flow);
  flowRef.current = flow;
  const choiceRef = useRef(choice);
  choiceRef.current = choice;
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const commitCashRef = useRef(commitCash);
  commitCashRef.current = commitCash;
  const advancingRef = useRef(false);
  const advanceTimerRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (advanceTimerRef.current !== null) {
        window.clearTimeout(advanceTimerRef.current);
      }
    },
    [],
  );

  useEffect(() => {
    activeSpotlightDecisionNextHandler = () => {
      if (advancingRef.current) return false;
      const selected = optionsRef.current[choiceRef.current ?? -1];
      if (!selected) {
        setSuccess(false);
        setError(lessonFeedbackCopy(screen.wrongError) ?? "");
        flowRef.current.incrementMistake();
        signalLessonIncorrectAnswer(flowRef.current.flashScreen);
        return false;
      }

      advancingRef.current = true;
      setError(null);
      setSuccess(true);
      celebrateLessonCorrectAnswer(flowRef.current.flashScreen);
      advanceTimerRef.current = window.setTimeout(() => {
        advanceTimerRef.current = null;
        if (selected.cashUpdate) commitCashRef.current(selected.cashUpdate);
        if (typeof selected.goToIndex === "number") {
          flowRef.current.setScreenIndex(selected.goToIndex);
          return;
        }
        flowRef.current.handleNext({ canAdvance: true });
      }, LESSON_SUCCESS_FLASH_MS);
      return false;
    };

    return () => {
      activeSpotlightDecisionNextHandler = null;
    };
  }, [screen.wrongError]);

  const prompt = fillCashPlaceholder(
    screen.promptWhen?.find((item) => cashMatches(item.showWhen, cash))?.text ?? screen.prompt,
    cash,
  );

  return (
    <LessonScreenLayout
      emphasizeInstruction={screen.emphasizeInstruction === true}
      success={success}
      errorMessage={error}
    >
      <p className={cn("mb-2.5", lessonPromptClass)}>{prompt}</p>
      <div className="grid w-full grid-cols-2 gap-4">
        {visible.map(({ option, index }, position) => {
          const selected = choice === index;
          return (
            <LessonIconOption
              key={`${option.label}-${index}`}
              className="w-full min-w-0"
              label={fillCashPlaceholder(option.label, cash)}
              emoji={letterForIndex(position)}
              display="emoji-label"
              labelClassName="max-w-full"
              selected={selected}
              disabled={success}
              selectionVariant="neutral"
              onClick={() => {
                if (success) return;
                setChoice(index);
                setError(null);
                setSuccess(false);
                flow.markScreenReady(screenIndex);
              }}
            />
          );
        })}
      </div>
    </LessonScreenLayout>
  );
}

function SpotlightGradedRounds({
  screen,
  screenIndex,
  flow,
  onPersistentError,
  onDismissError,
}: SpotlightScreenProps) {
  const [roundIndex, setRoundIndex] = useState(0);
  const [choice, setChoice] = useState<"a" | "b" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [roundCorrect, setRoundCorrect] = useState(false);
  const showSuccess = useLessonSuccessFlash(roundCorrect);
  const recoveryTimeoutRef = useRef<number | null>(null);
  const round = screen.rounds[roundIndex];

  const roundSideLayouts = useMemo(
    () => buildRoundSideLayouts(screen.rounds.length),
    [screen.rounds.length],
  );

  useEffect(
    () => () => {
      if (recoveryTimeoutRef.current !== null) {
        window.clearTimeout(recoveryTimeoutRef.current);
      }
    },
    [],
  );

  const scheduleChoiceReset = () => {
    if (recoveryTimeoutRef.current !== null) {
      window.clearTimeout(recoveryTimeoutRef.current);
    }
    recoveryTimeoutRef.current = window.setTimeout(() => {
      setChoice(null);
      recoveryTimeoutRef.current = null;
    }, FEEDBACK_RECOVERY_MS);
  };

  const pick = (which: "a" | "b") => {
    if (!round || choice !== null) return;
    setChoice(which);
    onDismissError?.();
    setError(null);
    setRoundCorrect(false);

    if (which !== round.correct) {
      flow.incrementMistake();
      setError(lessonFeedbackCopy(round.error) ?? "");
      if (onPersistentError) {
        const copy = lessonFeedbackCopy(round.error);
        if (copy) onPersistentError(copy);
      }
      signalLessonIncorrectAnswer(flow.flashScreen);
      scheduleChoiceReset();
      return;
    }

    setRoundCorrect(true);
    celebrateLessonCorrectAnswer(flow.flashScreen);
    if (roundIndex + 1 >= screen.rounds.length) {
      flow.markScreenReady(screenIndex);
      return;
    }

    recoveryTimeoutRef.current = window.setTimeout(() => {
      setRoundIndex((current) => current + 1);
      setChoice(null);
      setRoundCorrect(false);
      recoveryTimeoutRef.current = null;
    }, FEEDBACK_RECOVERY_MS);
  };

  if (!round) return null;

  const sideLayout = roundSideLayouts[roundIndex] ?? { left: "a", right: "b" };

  const optionMeta = {
    a: { icon: round.iconA, label: round.optionA },
    b: { icon: round.iconB, label: round.optionB },
  };

  const renderSide = (which: "a" | "b") => {
    const meta = optionMeta[which];
    const isChosen = choice === which;
    const isCorrectChoice = which === round.correct;
    const glyph = spotlightChoiceGlyph(meta.label);
    return (
      <LessonIconOption
        label={meta.label}
        emoji={glyph ? undefined : meta.icon}
        glyph={glyph ?? undefined}
        display="emoji-label"
        selected={isChosen}
        disabled={choice !== null}
        selectionVariant={
          isChosen
            ? resolveChoiceVariant(true, isCorrectChoice)
            : "neutral"
        }
        labelClassName="max-w-[13rem] sm:max-w-[15rem]"
        onClick={() => pick(which)}
      />
    );
  };

  return (
    <LessonScreenLayout
      emphasizeInstruction={screen.emphasizeInstruction === true}
      success={showSuccess}
      errorMessage={error}
    >
      <p className={cn("mb-2.5", lessonPromptClass)}>{screen.prompt}</p>
      <div className="mb-5 flex justify-center gap-1.5">
        {screen.rounds.map((_, index) => (
          <i
            key={index}
            className={cn(
              "block size-2 rounded-full",
              index === roundIndex
                ? "bg-[#0CC1E0]"
                : index < roundIndex
                  ? "bg-[#031F82]"
                  : "bg-[#BDE9FB]",
            )}
            aria-hidden
          />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4">
        {renderSide(sideLayout.left)}
        {renderSide(sideLayout.right)}
      </div>
    </LessonScreenLayout>
  );
}

export function SpotlightRoundsScreen(props: SpotlightScreenProps) {
  if (props.screen.decisionPath) {
    return <SpotlightDecisionChoices {...props} />;
  }
  return <SpotlightGradedRounds {...props} />;
}
