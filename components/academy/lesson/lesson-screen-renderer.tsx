"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { lessonCardClass } from "@/components/academy/lesson/academy-lesson-shell";
import { LessonBucketSortGame } from "@/components/academy/lesson/lesson-bucket-sort-game";
import { LessonLinkMatchGame } from "@/components/academy/lesson/lesson-link-match-game";
import { LessonChoiceButton } from "@/components/academy/lesson/lesson-choice-button";
import { LessonCompletionPane } from "@/components/academy/lesson/lesson-completion-pane";
import {
  lessonGoldClaimClass,
  LESSON_CASH_IN_LABEL,
} from "@/components/academy/lesson/lesson-shared-styles";
import type { LessonFlow } from "@/lib/academy/lessons/hooks/use-lesson-flow";
import type {
  BinaryChoiceScreenConfig,
  BucketSortScreenConfig,
  CompletionScreenConfig,
  HoldToFillScreenConfig,
  LessonRewards,
  LinkMatchScreenConfig,
  NarrativeBonusScreenConfig,
  ScreenConfig,
  SpotlightRoundsScreenConfig,
  TapRevealScreenConfig,
  TrueFalseScreenConfig,
  WordDropScreenConfig,
} from "@/lib/academy/lessons/types";
import { playLessonSuccessPing } from "@/lib/academy/lessons/utils";
import { formatLessonBronzeSkillLine } from "@/lib/dashboard/skill-trophies";
import { cn } from "@/lib/utils/cn";

const DEFAULT_HOLD_MS = 2000;

type StandardScreenProps<T extends ScreenConfig> = {
  screen: T;
  screenIndex: number;
  flow: LessonFlow;
  rewards: LessonRewards;
};

function WordDropScreen({
  screen,
  screenIndex,
  flow,
}: StandardScreenProps<WordDropScreenConfig>) {
  const [choices, setChoices] = useState<string[]>(() =>
    screen.blanks ? Array.from({ length: screen.blanks.length }, () => "") : [],
  );
  const [choice, setChoice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (screen.prompt && screen.blanks?.length) {
    const parts = screen.prompt.split("[blank]");
    const allFilled = choices.every(Boolean);
    const allCorrect =
      allFilled &&
      screen.blanks.every((blank, index) => choices[index] === blank.correctOption);

    const handleMultiChoice = (blankIndex: number, option: string) => {
      const next = [...choices];
      next[blankIndex] = option;
      setChoices(next);
      setError(null);
      const filled = next.every(Boolean);
      const correct =
        filled &&
        screen.blanks!.every((blank, index) => next[index] === blank.correctOption);
      if (correct) {
        flow.markScreenReady(screenIndex);
        return;
      }
      if (filled) {
        setError(screen.wrongError);
        flow.incrementMistake();
      }
    };

    const activeBlankIndex = choices.findIndex((value) => !value);

    return (
      <>
        <p className="font-sans text-sm leading-relaxed text-[#1E3A5F]">
          {parts.map((part, index) => (
            <span key={`${part}-${index}`}>
              {part}
              {index < screen.blanks!.length ? (
                <span className="inline-block min-w-[4rem] border-b-2 border-dashed border-[#0CC1E0] px-2 font-heading font-extrabold text-[#031F82]">
                  {choices[index] || "______"}
                </span>
              ) : null}
            </span>
          ))}
        </p>
        {activeBlankIndex >= 0 ? (
          <div className={cn(lessonCardClass, "mt-5 space-y-2")}>
            <p className="font-heading text-[10px] font-bold uppercase tracking-wide text-[#0CC1E0]">
              {screen.promptLabel ?? "Word Drop"}
            </p>
            <div className="flex flex-wrap gap-2">
              {screen.blanks[activeBlankIndex]!.options.map((option) => (
                <LessonChoiceButton
                  key={option}
                  onClick={() => handleMultiChoice(activeBlankIndex, option)}
                  selected={choices[activeBlankIndex] === option}
                  variant="neutral"
                  className="w-auto px-5 py-2 text-xs"
                >
                  {option}
                </LessonChoiceButton>
              ))}
            </div>
          </div>
        ) : null}
        {error ? (
          <p className="mt-4 rounded-xl bg-[#FFF7ED] px-3 py-2 font-sans text-xs text-[#031F82]">
            {error}
          </p>
        ) : null}
      </>
    );
  }

  const handleChoice = (option: string) => {
    setChoice(option);
    if (option === screen.correctOption) {
      setError(null);
      flow.markScreenReady(screenIndex);
      return;
    }
    setError(screen.wrongError);
    flow.incrementMistake();
  };

  return (
    <>
      <p className="font-sans text-sm leading-relaxed text-[#1E3A5F]">
        {screen.narrativeBefore}{" "}
        <span className="inline-block min-w-[5rem] border-b-2 border-dashed border-[#0CC1E0] px-2 font-heading font-extrabold text-[#031F82]">
          {choice ?? "______"}
        </span>{" "}
        {screen.narrativeAfter}
      </p>
      <div className={cn(lessonCardClass, "mt-5 space-y-2")}>
        <p className="font-heading text-[10px] font-bold uppercase tracking-wide text-[#0CC1E0]">
          {screen.promptLabel ?? "Word Drop"}
        </p>
        <div className="flex flex-wrap gap-2">
          {screen.options.map((option) => (
            <LessonChoiceButton
              key={option}
              onClick={() => handleChoice(option)}
              selected={choice === option}
              variant={
                choice === option
                  ? option === screen.correctOption
                    ? "correct"
                    : "wrong"
                  : "neutral"
              }
              className="w-auto px-5 py-2 text-xs"
            >
              {option}
            </LessonChoiceButton>
          ))}
        </div>
      </div>
      {error ? (
        <p className="mt-4 rounded-xl bg-[#FFF7ED] px-3 py-2 font-sans text-xs text-[#031F82]">
          {error}
        </p>
      ) : null}
    </>
  );
}

function BinaryChoiceScreen({
  screen,
  screenIndex,
  flow,
}: StandardScreenProps<BinaryChoiceScreenConfig>) {
  const [choice, setChoice] = useState<"a" | "b" | "c" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const pick = (which: "a" | "b" | "c") => {
    setChoice(which);
    const isCorrect =
      which === "a"
        ? screen.optionA.isCorrect
        : which === "b"
          ? screen.optionB.isCorrect
          : screen.optionC?.isCorrect ?? false;
    if (isCorrect) {
      setError(null);
      setSuccess(screen.successMessage ?? null);
      flow.markScreenReady(screenIndex);
      return;
    }
    setSuccess(null);
    setError(screen.wrongError);
    flow.incrementMistake();
    if (screen.errorStyle !== "banner") {
      flow.flashScreen("error");
    }
  };

  return (
    <>
      <p className="font-sans text-sm leading-relaxed text-[#1E3A5F]">{screen.prompt}</p>
      <div className="mt-5 space-y-3">
        <LessonChoiceButton
          onClick={() => pick("a")}
          selected={choice === "a"}
          variant={
            choice === "a"
              ? screen.optionA.isCorrect
                ? "correct"
                : "wrong"
              : "neutral"
          }
        >
          {screen.optionA.label}
        </LessonChoiceButton>
        <LessonChoiceButton
          onClick={() => pick("b")}
          selected={choice === "b"}
          variant={
            choice === "b"
              ? screen.optionB.isCorrect
                ? "correct"
                : "wrong"
              : "neutral"
          }
        >
          {screen.optionB.label}
        </LessonChoiceButton>
        {screen.optionC ? (
          <LessonChoiceButton
            onClick={() => pick("c")}
            selected={choice === "c"}
            variant={
              choice === "c"
                ? screen.optionC.isCorrect
                  ? "correct"
                  : "wrong"
                : "neutral"
            }
          >
            {screen.optionC.label}
          </LessonChoiceButton>
        ) : null}
      </div>
      {success ? (
        <p className="mt-4 rounded-xl bg-[#DCFCE7] px-3 py-2 font-sans text-xs text-[#031F82]">
          {success}
        </p>
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

function TrueFalseScreen({
  screen,
  screenIndex,
  flow,
  onPersistentError,
}: StandardScreenProps<TrueFalseScreenConfig> & {
  onPersistentError?: (message: string) => void;
}) {
  const [choice, setChoice] = useState<"true" | "false" | null>(null);

  const pick = (option: "true" | "false") => {
    setChoice(option);
    if (option === screen.correctAnswer) {
      flow.markScreenReady(screenIndex);
      return;
    }
    flow.incrementMistake();
    onPersistentError?.(screen.wrongError);
  };

  return (
    <>
      <p className="font-sans text-sm leading-relaxed text-[#1E3A5F]">{screen.prompt}</p>
      <div className={cn(lessonCardClass, "mt-5")}>
        <p className="font-heading text-[10px] font-bold uppercase tracking-wide text-[#0CC1E0]">
          {screen.promptLabel ?? "True or False"}
        </p>
        <div className="mt-3 flex gap-3">
          {(["true", "false"] as const).map((option) => (
            <LessonChoiceButton
              key={option}
              onClick={() => pick(option)}
              selected={choice === option}
              variant={
                choice === option
                  ? option === screen.correctAnswer
                    ? "correct"
                    : "wrong"
                  : "neutral"
              }
              className="flex-1 text-center uppercase"
            >
              {option}
            </LessonChoiceButton>
          ))}
        </div>
      </div>
    </>
  );
}

function TapRevealScreen({
  screen,
  screenIndex,
  flow,
}: StandardScreenProps<TapRevealScreenConfig>) {
  const [tapped, setTapped] = useState<Set<string>>(new Set());
  const tapDisplay = screen.tapDisplay ?? "emoji-label";
  const revealDisplay = screen.revealDisplay ?? "emoji-label";

  useEffect(() => {
    if (screen.items.length === 0 && screen.advance?.mode === "auto-ready") {
      flow.markScreenReady(screenIndex);
    }
  }, [flow, screen.advance?.mode, screen.items.length, screenIndex]);

  if (screen.items.length === 0) {
    return (
      <>
        <p className="font-sans text-sm leading-relaxed text-[#1E3A5F]">{screen.intro}</p>
        {screen.successMessage ? (
          <p className="mt-4 rounded-xl bg-[#DCFCE7] px-3 py-2 font-sans text-xs text-[#031F82]">
            {screen.successMessage}
          </p>
        ) : null}
      </>
    );
  }

  const handleTap = (itemId: string) => {
    setTapped((current) => {
      const next = new Set(current);
      next.add(itemId);
      return next;
    });
  };

  useEffect(() => {
    if (screen.items.length > 0 && tapped.size === screen.items.length) {
      flow.markScreenReady(screenIndex);
    }
  }, [flow, screen.items.length, screenIndex, tapped.size]);

  const renderTapChip = (item: TapRevealScreenConfig["items"][number]) => {
    if (tapDisplay === "emoji-only" && item.emoji) {
      return (
        <span className="text-2xl leading-none" aria-hidden>
          {item.emoji}
        </span>
      );
    }
    if (item.emoji) {
      return (
        <span className="flex flex-col items-center gap-1">
          <span className="text-xl leading-none" aria-hidden>
            {item.emoji}
          </span>
          <span>{item.label}</span>
        </span>
      );
    }
    return item.label;
  };

  const renderRevealEntry = (item: TapRevealScreenConfig["items"][number]) => {
    if (revealDisplay === "emoji-only" && item.emoji) {
      return (
        <span className="text-xl leading-none" aria-hidden>
          {item.emoji}
        </span>
      );
    }
    if (item.emoji) {
      return (
        <span className="inline-flex items-center gap-1">
          <span className="text-base leading-none" aria-hidden>
            {item.emoji}
          </span>
          <span>{item.label}</span>
        </span>
      );
    }
    return item.label;
  };

  return (
    <>
      <p className="font-sans text-sm leading-relaxed text-[#1E3A5F]">{screen.intro}</p>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {screen.items.map((item) => {
          const isTapped = tapped.has(item.id);
          return (
            <LessonChoiceButton
              key={item.id}
              aria-label={item.label}
              aria-disabled={isTapped}
              onClick={() => handleTap(item.id)}
              selected={isTapped}
              variant={
                isTapped
                  ? item.bucket === "short" || item.bucket === "want"
                    ? "wrong"
                    : "correct"
                  : "neutral"
              }
              className={cn("text-xs", isTapped && "pointer-events-none")}
            >
              {renderTapChip(item)}
            </LessonChoiceButton>
          );
        })}
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3">
        {screen.buckets.map((bucket) => {
          const toneClass =
            bucket.tone === "short" || bucket.tone === "want"
              ? "text-[#E11D48]"
              : "text-[#22C55E]";
          return (
            <div key={bucket.id} className={cn(lessonCardClass, "min-h-[5.5rem]")}>
              <p className={cn("font-heading text-[9px] font-bold uppercase", toneClass)}>
                {bucket.label}
              </p>
              <ul className="mt-2 flex flex-col items-center gap-2 font-sans text-[11px] leading-snug text-[#1E3A5F]">
                {screen.items
                  .filter((item) => item.bucket === bucket.id && tapped.has(item.id))
                  .map((item) => (
                    <li key={item.id}>{renderRevealEntry(item)}</li>
                  ))}
              </ul>
            </div>
          );
        })}
      </div>
    </>
  );
}

function LinkMatchScreen({
  screen,
  screenIndex,
  flow,
}: StandardScreenProps<LinkMatchScreenConfig>) {
  const [completeMessage, setCompleteMessage] = useState<string | null>(null);
  const flowRef = useRef(flow);
  flowRef.current = flow;

  const handleComplete = useCallback(() => {
    if (screen.successMessage) {
      setCompleteMessage(screen.successMessage);
    }
    flowRef.current.markScreenReady(screenIndex);
  }, [screen.successMessage, screenIndex]);

  const handleMistake = useCallback(() => {
    flowRef.current.incrementMistake();
  }, []);

  const handleSuccess = useCallback(() => {
    playLessonSuccessPing();
    flowRef.current.flashScreen("success");
  }, []);

  return (
    <>
      <p className="font-sans text-sm leading-relaxed text-[#1E3A5F]">{screen.intro}</p>
      <LessonLinkMatchGame
        pairs={screen.pairs}
        eventColumnLabel={screen.eventColumnLabel}
        benefitColumnLabel={screen.benefitColumnLabel}
        onComplete={handleComplete}
        onMistake={handleMistake}
        onSuccess={handleSuccess}
      />
      {completeMessage ? (
        <p className="mt-4 rounded-xl bg-[#DCFCE7] px-3 py-2 font-sans text-xs text-[#031F82]">
          {completeMessage}
        </p>
      ) : null}
    </>
  );
}

function BucketSortScreen({
  screen,
  screenIndex,
  flow,
  onPersistentError,
  onDismissPersistentError,
}: StandardScreenProps<BucketSortScreenConfig> & {
  onPersistentError?: (message: string) => void;
  onDismissPersistentError?: () => void;
}) {
  const [completeMessage, setCompleteMessage] = useState<string | null>(null);
  const flowRef = useRef(flow);
  flowRef.current = flow;

  const handleComplete = useCallback(() => {
    onDismissPersistentError?.();
    if (screen.successMessage) {
      setCompleteMessage(screen.successMessage);
    }
    flowRef.current.markScreenReady(screenIndex);
  }, [onDismissPersistentError, screen.successMessage, screenIndex]);

  const handleMistake = useCallback(() => {
    flowRef.current.incrementMistake();
  }, []);

  const handleSuccess = useCallback(() => {
    playLessonSuccessPing();
    flowRef.current.flashScreen("success");
  }, []);

  const handleWrongDrop = useCallback(
    (itemId: string) => {
      const item = screen.items.find((entry) => entry.id === itemId);
      if (item?.wrongDropError) {
        onPersistentError?.(item.wrongDropError);
      }
    },
    [onPersistentError, screen.items],
  );

  return (
    <>
      <p className="font-sans text-sm leading-relaxed text-[#1E3A5F]">{screen.intro}</p>
      <LessonBucketSortGame
        items={screen.items}
        buckets={screen.buckets}
        layout={screen.layout}
        targetTotal={screen.targetTotal}
        onComplete={handleComplete}
        onMistake={handleMistake}
        onSuccess={handleSuccess}
        onWrongDrop={handleWrongDrop}
      />
      {completeMessage ? (
        <p className="mt-4 rounded-xl bg-[#DCFCE7] px-3 py-2 font-sans text-xs text-[#031F82]">
          {completeMessage}
        </p>
      ) : null}
    </>
  );
}

function HoldToFillScreen({
  screen,
  screenIndex,
  flow,
}: StandardScreenProps<HoldToFillScreenConfig>) {
  const holdMs = screen.holdDurationMs ?? DEFAULT_HOLD_MS;
  const [progress, setProgress] = useState(0);
  const [complete, setComplete] = useState(false);
  const [isHolding, setIsHolding] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const holdStartRef = useRef<number | null>(null);
  const holdFrameRef = useRef<number | null>(null);

  const startHold = () => {
    if (complete) return;
    holdStartRef.current = performance.now();
    setIsHolding(true);
    setHint(null);

    const tick = (now: number) => {
      const start = holdStartRef.current;
      if (start === null) return;
      const elapsed = now - start;
      const nextProgress = Math.min(1, elapsed / holdMs);
      setProgress(nextProgress);
      if (nextProgress >= 1) {
        setComplete(true);
        setIsHolding(false);
        flow.markScreenReady(screenIndex);
        holdStartRef.current = null;
        return;
      }
      holdFrameRef.current = requestAnimationFrame(tick);
    };

    holdFrameRef.current = requestAnimationFrame(tick);
  };

  const endHold = () => {
    if (complete) return;
    setIsHolding(false);
    if (holdFrameRef.current !== null) {
      cancelAnimationFrame(holdFrameRef.current);
      holdFrameRef.current = null;
    }
    const start = holdStartRef.current;
    holdStartRef.current = null;
    if (start !== null && performance.now() - start < holdMs) {
      setProgress(0);
      setHint(
        screen.releaseHint ??
          "(Must hold down fully for 2 seconds to activate)",
      );
    }
  };

  useEffect(
    () => () => {
      if (holdFrameRef.current !== null) {
        cancelAnimationFrame(holdFrameRef.current);
      }
    },
    [],
  );

  if (complete && screen.clearOnSuccess) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <p className="rounded-xl bg-[#DCFCE7] px-5 py-6 font-heading text-base font-extrabold leading-snug text-[#031F82]">
          {screen.successMessage}
        </p>
      </div>
    );
  }

  return (
    <div className="relative flex flex-1 flex-col">
      <p className="font-sans text-sm leading-relaxed text-[#1E3A5F]">{screen.narrative}</p>
      <div className="relative mt-8 flex flex-col items-center">
        <button
          type="button"
          onPointerDown={startHold}
          onPointerUp={endHold}
          onPointerLeave={endHold}
          onPointerCancel={endHold}
          style={{ touchAction: "none" }}
          className={cn(
            "select-none rounded-2xl border-b-4 border-[#099FB8] bg-[#0CC1E0] px-6 py-5 font-heading text-sm font-extrabold uppercase tracking-wide text-[#031F82] shadow-md transition-transform active:scale-[0.98]",
            complete && "border-[#6366F1] bg-[#6366F1] text-white",
          )}
        >
          {complete ? screen.frozenLabel : screen.holdLabel}
        </button>
        <div className="mt-4 h-3 w-full max-w-xs overflow-hidden rounded-full border border-[#BDE9FB]/60 bg-[#E8F7FC]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#0CC1E0] to-[#099FB8]"
            style={{
              width: `${progress * 100}%`,
              transition: isHolding ? "none" : "width 150ms ease-out",
            }}
          />
        </div>
        {complete && !screen.clearOnSuccess ? (
          <p className="mt-4 rounded-xl bg-[#DCFCE7] px-4 py-3 text-center font-heading text-sm font-extrabold text-[#031F82]">
            {screen.successMessage}
          </p>
        ) : null}
        {hint ? (
          <p className="mt-3 font-sans text-xs text-[#1E3A5F]/80">{hint}</p>
        ) : null}
      </div>
    </div>
  );
}

function NarrativeBonusScreen({
  screen,
  screenIndex,
  flow,
  awardBonusXp,
}: StandardScreenProps<NarrativeBonusScreenConfig> & {
  awardBonusXp?: (amount: number) => void;
}) {
  const [claimed, setClaimed] = useState(false);
  const hasBonus = screen.bonusXp > 0;

  useEffect(() => {
    if (!hasBonus && screen.autoReadyWhenNoBonus !== false) {
      flow.markScreenReady(screenIndex);
    }
  }, [flow, hasBonus, screen.autoReadyWhenNoBonus, screenIndex]);

  const claim = () => {
    if (claimed || !hasBonus) return;
    setClaimed(true);
    awardBonusXp?.(screen.bonusXp);
    playLessonSuccessPing();
    flow.markScreenReady(screenIndex);
  };

  return (
    <>
      <p className="font-sans text-sm leading-relaxed text-[#1E3A5F]">{screen.narrative}</p>
      {screen.successMessage ? (
        <p className="mt-4 font-sans text-sm leading-relaxed text-[#1E3A5F]">
          {screen.successMessage}
        </p>
      ) : null}
      {hasBonus ? (
        <button
          type="button"
          onClick={claim}
          disabled={claimed}
          className={cn(lessonGoldClaimClass, "mt-6 h-touch w-full max-w-md")}
        >
          {claimed ? `+${screen.bonusXp} XP Collected!` : screen.bonusTapLabel}
        </button>
      ) : null}
    </>
  );
}

function SpotlightRoundsScreen({
  screen,
  screenIndex,
  flow,
  onPersistentError,
  onDismissError,
}: StandardScreenProps<SpotlightRoundsScreenConfig> & {
  onPersistentError?: (message: string) => void;
  onDismissError?: () => void;
}) {
  const [roundIndex, setRoundIndex] = useState(0);
  const [choice, setChoice] = useState<"a" | "b" | null>(null);
  const [allDone, setAllDone] = useState(false);
  const round = screen.rounds[roundIndex];

  const pick = (which: "a" | "b") => {
    if (!round) return;
    setChoice(which);
    onDismissError?.();
    if (which !== round.correct) {
      flow.incrementMistake();
      onPersistentError?.(round.error);
      return;
    }
    playLessonSuccessPing();
    flow.flashScreen("success");
    if (roundIndex + 1 >= screen.rounds.length) {
      setAllDone(true);
      flow.markScreenReady(screenIndex);
      return;
    }
    setRoundIndex((current) => current + 1);
    setChoice(null);
  };

  return (
    <>
      <p className="font-sans text-sm leading-relaxed text-[#1E3A5F]">{screen.prompt}</p>
      <p className="mt-2 font-heading text-[10px] font-bold uppercase tracking-wide text-[#0CC1E0]">
        {allDone ? "Complete" : `Round ${roundIndex + 1} of ${screen.rounds.length}`}
      </p>
      {allDone ? (
        <div className={cn(lessonCardClass, "mt-6 py-8 text-center")}>
          <p className="font-heading text-sm font-bold text-[#22C55E]">All done</p>
        </div>
      ) : round ? (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <LessonChoiceButton
            onClick={() => pick("a")}
            selected={choice === "a"}
            variant={
              choice === "a"
                ? round.correct === "a"
                  ? "correct"
                  : "wrong"
                : "neutral"
            }
            className="min-h-[7rem]"
          >
            <span className="flex items-start gap-2">
              <span className="shrink-0 text-2xl" aria-hidden>
                {round.iconA}
              </span>
              <span>{round.optionA}</span>
            </span>
          </LessonChoiceButton>
          <LessonChoiceButton
            onClick={() => pick("b")}
            selected={choice === "b"}
            variant={
              choice === "b"
                ? round.correct === "b"
                  ? "correct"
                  : "wrong"
                : "neutral"
            }
            className="min-h-[7rem]"
          >
            <span className="flex items-start gap-2">
              <span className="shrink-0 text-2xl" aria-hidden>
                {round.iconB}
              </span>
              <span>{round.optionB}</span>
            </span>
          </LessonChoiceButton>
        </div>
      ) : null}
    </>
  );
}

function CompletionScreen({
  screen,
  flow,
  rewards,
}: StandardScreenProps<CompletionScreenConfig>) {
  if (screen.useStandardPane !== false && !screen.skillLearnedLabel) {
    return (
      <LessonCompletionPane
        xpReward={rewards.xpReward}
        perfectStreakBonus={rewards.perfectStreakBonus}
        perfectStreak={flow.perfectStreak}
        achievementSkillId={rewards.achievementSkillSlug}
      />
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center text-center">
      {screen.skillLearnedLabel ? (
        <p className="font-heading text-xl font-extrabold uppercase tracking-wide text-[#031F82]">
          {screen.skillLearnedLabel}
        </p>
      ) : (
        <p className="font-heading text-xl font-extrabold uppercase tracking-wide text-[#031F82]">
          Lesson Complete!
        </p>
      )}
      {screen.pointsLabel ? (
        <p className="mt-6 font-heading text-base font-extrabold text-[#FFA503]">
          {screen.pointsLabel}
        </p>
      ) : (
        <p className="mt-8 font-heading text-base font-extrabold text-[#FFA503]">
          Points Awarded: {rewards.xpReward} XP
        </p>
      )}
      {screen.bodyCopy ? (
        <p className="mt-6 font-sans text-sm leading-relaxed text-[#1E3A5F]">
          {screen.bodyCopy}
        </p>
      ) : null}
      <p className="mt-10 text-4xl" aria-hidden>
        🥉
      </p>
      {!screen.skillLearnedLabel ? (
        <p className="mt-3 font-heading text-sm font-extrabold text-[#031F82]">
          {formatLessonBronzeSkillLine(rewards.achievementSkillSlug)}
        </p>
      ) : null}
    </div>
  );
}

export type LessonScreenRendererProps = {
  screen: ScreenConfig;
  screenIndex: number;
  flow: LessonFlow;
  rewards: LessonRewards;
  awardBonusXp?: (amount: number) => void;
  onPersistentError?: (message: string) => void;
  onDismissPersistentError?: () => void;
};

export function LessonScreenRenderer({
  screen,
  screenIndex,
  flow,
  rewards,
  awardBonusXp,
  onPersistentError,
  onDismissPersistentError,
}: LessonScreenRendererProps) {
  switch (screen.type) {
    case "word-drop":
      return (
        <WordDropScreen
          screen={screen}
          screenIndex={screenIndex}
          flow={flow}
          rewards={rewards}
        />
      );
    case "binary-choice":
      return (
        <BinaryChoiceScreen
          screen={screen}
          screenIndex={screenIndex}
          flow={flow}
          rewards={rewards}
        />
      );
    case "true-false":
      return (
        <TrueFalseScreen
          screen={screen}
          screenIndex={screenIndex}
          flow={flow}
          rewards={rewards}
          onPersistentError={onPersistentError}
        />
      );
    case "tap-reveal":
      return (
        <TapRevealScreen
          screen={screen}
          screenIndex={screenIndex}
          flow={flow}
          rewards={rewards}
        />
      );
    case "link-match":
      return (
        <LinkMatchScreen
          screen={screen}
          screenIndex={screenIndex}
          flow={flow}
          rewards={rewards}
        />
      );
    case "bucket-sort":
      return (
        <BucketSortScreen
          screen={screen}
          screenIndex={screenIndex}
          flow={flow}
          rewards={rewards}
          onPersistentError={onPersistentError}
          onDismissPersistentError={onDismissPersistentError}
        />
      );
    case "hold-to-fill":
      return (
        <HoldToFillScreen
          screen={screen}
          screenIndex={screenIndex}
          flow={flow}
          rewards={rewards}
        />
      );
    case "narrative-bonus":
      return (
        <NarrativeBonusScreen
          screen={screen}
          screenIndex={screenIndex}
          flow={flow}
          rewards={rewards}
          awardBonusXp={awardBonusXp}
        />
      );
    case "spotlight-rounds":
      return (
        <SpotlightRoundsScreen
          screen={screen}
          screenIndex={screenIndex}
          flow={flow}
          rewards={rewards}
          onPersistentError={onPersistentError}
          onDismissError={onDismissPersistentError}
        />
      );
    case "completion":
      return (
        <CompletionScreen
          screen={screen}
          screenIndex={screenIndex}
          flow={flow}
          rewards={rewards}
        />
      );
    case "custom":
      return null;
    default:
      return null;
  }
}

export function getCompletionFooterLabel(
  screens: readonly ScreenConfig[],
  lessonComplete: boolean,
): string {
  const completion = screens.find((s) => s.type === "completion");
  if (lessonComplete) return "Returning...";
  if (completion?.type === "completion" && completion.returnButtonLabel) {
    return completion.returnButtonLabel;
  }
  return LESSON_CASH_IN_LABEL;
}
