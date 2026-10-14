"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  LESSON_SUCCESS_FLASH_MS,
  useLessonSuccessFlash,
} from "@/components/academy/lesson/hooks/use-lesson-screen-flow";
import { LessonChoiceButton } from "@/components/academy/lesson/lesson-choice-button";
import { useLessonCash } from "@/components/academy/lesson/lesson-cash";
import { lessonPromptClass } from "@/components/academy/lesson/lesson-shared-styles";
import {
  LessonScreenLayout,
  lessonFeedbackCopy,
} from "@/components/academy/lesson/lesson-ui";
import {
  cashMatches,
  displayCashText,
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

function answerEmoji(label: string, icon?: string): string | undefined {
  const normalized = label.trim().toLowerCase();
  if (normalized === "true") return "✅";
  if (normalized === "false") return "❌";
  if (!icon || /^[A-H]$/i.test(icon.trim())) return undefined;
  return icon;
}

function isTrueFalsePair(left: string, right: string): boolean {
  const labels = [left, right].map((label) => label.trim().toLowerCase());
  return labels.includes("true") && labels.includes("false");
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

/** Choices that keep cash updates and GO targets. The answer text is the button. */
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
        setError(lessonFeedbackCopy(screen.wrongError) ?? "Pick one to keep going.");
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

  const gatedPrompt =
    cash === null
      ? undefined
      : screen.promptWhen?.find((item) => cashMatches(item.showWhen, cash))?.text;
  const prompt = displayCashText(gatedPrompt ?? screen.prompt, cash);

  return (
    <LessonScreenLayout
      emphasizeInstruction={screen.emphasizeInstruction === true}
      success={success}
      errorMessage={error}
    >
      <p className={cn("mb-2.5", lessonPromptClass)}>{prompt}</p>
      <div className="flex w-full flex-col gap-3">
        {visible.map(({ option, index }) => {
          const selected = choice === index;
          const label = displayCashText(option.label, cash);
          return (
            <LessonChoiceButton
              key={`${option.label}-${index}`}
              emoji={answerEmoji(label, option.emoji)}
              selected={selected}
              disabled={success}
              onClick={() => {
                if (success) return;
                setChoice(index);
                setError(null);
                setSuccess(false);
                flow.markScreenReady(screenIndex);
              }}
            >
              {label}
            </LessonChoiceButton>
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
    return (
      <LessonChoiceButton
        emoji={answerEmoji(meta.label, meta.icon)}
        selected={isChosen}
        disabled={choice !== null}
        onClick={() => pick(which)}
      >
        {meta.label}
      </LessonChoiceButton>
    );
  };

  const statement = round.prompt?.trim();
  const header =
    statement && statement.toLowerCase() !== screen.prompt.trim().toLowerCase()
      ? screen.prompt
      : "";
  const trueFalse = isTrueFalsePair(round.optionA, round.optionB);

  return (
    <LessonScreenLayout
      emphasizeInstruction={screen.emphasizeInstruction === true}
      success={showSuccess}
      errorMessage={error}
    >
      {header ? (
        <p className="mb-1 font-heading text-sm font-extrabold uppercase tracking-wide text-[#0CC1E0]">
          {header}
        </p>
      ) : null}
      <p className={cn("mb-2.5", lessonPromptClass)}>{statement || screen.prompt}</p>
      {screen.rounds.length > 1 ? (
        <div className="mb-4 flex justify-center gap-1.5">
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
      ) : null}
      <div className={trueFalse ? "grid grid-cols-2 gap-3" : "flex flex-col gap-3"}>
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
