"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { useLessonCash } from "@/components/academy/lesson/lesson-cash";
import { LessonChoiceButton } from "@/components/academy/lesson/lesson-choice-button";
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
  displayCashText,
} from "@/lib/academy/lessons/payload/cash-placeholder";
import { spotlightRoundUnitId } from "@/lib/academy/lessons/bonus-run";
import type { SpotlightRoundsScreenConfig } from "@/lib/academy/lessons/types";
import {
  celebrateLessonCorrectAnswer,
  signalLessonIncorrectAnswer,
} from "@/lib/academy/lessons/utils";
import { cn } from "@/lib/utils/cn";
import type { StandardScreenProps } from "./types";

type SideLayout = { left: "a" | "b"; right: "a" | "b" };

/** Wrong row shakes, then returns to rest. */
const WRONG_DESELECT_MS = 360;
/** Next round replaces the current one after a correct tick. */
const ROUND_ADVANCE_MS = 450;

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

/** Stable order for the server render and the matching hydration pass. */
function fixedRoundSideLayouts(roundCount: number): SideLayout[] {
  return Array.from({ length: roundCount }, () => ({
    left: "a" as const,
    right: "b" as const,
  }));
}

/** Shuffle which choice sits on which side. Must not run during render. */
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

function realEmoji(icon?: string): string | undefined {
  const trimmed = icon?.trim();
  if (!trimmed || /^[A-Za-z]$/.test(trimmed)) return undefined;
  return trimmed;
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
  const flowRef = useRef(flow);
  flowRef.current = flow;
  const choiceRef = useRef(choice);
  choiceRef.current = choice;
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const commitCashRef = useRef(commitCash);
  commitCashRef.current = commitCash;
  const { setBonusRunUnit } = flow;

  useLayoutEffect(() => {
    setBonusRunUnit(null);
  }, [setBonusRunUnit]);

  useEffect(() => {
    activeSpotlightDecisionNextHandler = () => {
      const selected = optionsRef.current[choiceRef.current ?? -1];
      if (!selected) {
        setError(lessonFeedbackCopy(screen.wrongError) ?? "Pick one to keep going.");
        return false;
      }

      if (selected.cashUpdate) commitCashRef.current(selected.cashUpdate);
      if (typeof selected.goToIndex === "number") {
        flowRef.current.setScreenIndex(selected.goToIndex);
        return false;
      }
      return true;
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
      errorMessage={error}
    >
      <p className={cn("mb-2.5", lessonPromptClass)}>{prompt}</p>
      <div className="grid w-full gap-3">
        {visible.map(({ option, index }) => {
          const selected = choice === index;
          return (
            <LessonChoiceButton
              key={`${option.label}-${index}`}
              emoji={option.emoji}
              selected={selected}
              onClick={() => {
                setChoice(index);
                setError(null);
                flow.markScreenReady(screenIndex);
              }}
            >
              {displayCashText(option.label, cash)}
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
  const recoveryTimeoutRef = useRef<number | null>(null);
  const round = screen.rounds[roundIndex];

  const [roundSideLayouts, setRoundSideLayouts] = useState<SideLayout[]>(() =>
    fixedRoundSideLayouts(screen.rounds.length),
  );

  useLayoutEffect(() => {
    setRoundSideLayouts(buildRoundSideLayouts(screen.rounds.length));
  }, [screen.rounds.length]);

  const { setBonusRunUnit, recordBonusRunCorrect } = flow;
  useLayoutEffect(() => {
    setBonusRunUnit(spotlightRoundUnitId(screenIndex, roundIndex));
  }, [roundIndex, screenIndex, setBonusRunUnit]);

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
    }, WRONG_DESELECT_MS);
  };

  const pick = (which: "a" | "b") => {
    if (!round || choice !== null) return;
    setChoice(which);
    onDismissError?.();
    setError(null);

    if (which !== round.correct) {
      flow.incrementMistake();
      setError(lessonFeedbackCopy(round.error) ?? "");
      if (onPersistentError) {
        const copy = lessonFeedbackCopy(round.error);
        if (copy) onPersistentError(copy);
      }
      signalLessonIncorrectAnswer();
      scheduleChoiceReset();
      return;
    }

    celebrateLessonCorrectAnswer();
    recordBonusRunCorrect();
    if (roundIndex + 1 >= screen.rounds.length) {
      flow.markScreenReady(screenIndex);
      return;
    }

    recoveryTimeoutRef.current = window.setTimeout(() => {
      setRoundIndex((current) => current + 1);
      setChoice(null);
      recoveryTimeoutRef.current = null;
    }, ROUND_ADVANCE_MS);
  };

  if (!round) return null;

  const sideLayout = roundSideLayouts[roundIndex] ?? { left: "a", right: "b" };

  const optionMeta = {
    a: { icon: round.iconA, label: round.optionA },
    b: { icon: round.iconB, label: round.optionB },
  };

  const renderCard = (which: "a" | "b") => {
    const meta = optionMeta[which];
    const isChosen = choice === which;
    const isCorrectChoice = which === round.correct;
    return (
      <LessonChoiceButton
        emoji={realEmoji(meta.icon)}
        selected={isChosen}
        locked={isChosen && isCorrectChoice}
        wrong={isChosen && !isCorrectChoice}
        onClick={() => pick(which)}
      >
        {meta.label}
      </LessonChoiceButton>
    );
  };

  const renderSide = (which: "a" | "b") => {
    const meta = optionMeta[which];
    const isChosen = choice === which;
    const isCorrectChoice = which === round.correct;
    const glyph = spotlightChoiceGlyph(meta.label);
    return (
      <LessonIconOption
        label={meta.label}
        emoji={glyph ? undefined : realEmoji(meta.icon)}
        glyph={glyph ?? undefined}
        display="emoji-label"
        selected={isChosen}
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

  const circleRound =
    screen.rounds.length > 1 &&
    Boolean(
      realEmoji(round.iconA) ||
        realEmoji(round.iconB) ||
        spotlightChoiceGlyph(round.optionA) ||
        spotlightChoiceGlyph(round.optionB),
    );

  return (
    <LessonScreenLayout
      emphasizeInstruction={screen.emphasizeInstruction === true}
      errorMessage={error}
    >
      <p className={cn("mb-2.5", lessonPromptClass)}>{screen.prompt}</p>
      {screen.rounds.length > 1 ? (
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
      ) : null}
      {!circleRound ? (
        <div className="grid gap-3">
          {renderCard(sideLayout.left)}
          {renderCard(sideLayout.right)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {renderSide(sideLayout.left)}
          {renderSide(sideLayout.right)}
        </div>
      )}
    </LessonScreenLayout>
  );
}

export function SpotlightRoundsScreen(props: SpotlightScreenProps) {
  if (props.screen.decisionPath) {
    return <SpotlightDecisionChoices {...props} />;
  }
  return <SpotlightGradedRounds {...props} />;
}
