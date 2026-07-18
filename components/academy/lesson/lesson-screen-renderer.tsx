"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { lessonCardClass } from "@/components/academy/lesson/academy-lesson-shell";
import { LessonBucketSortGame } from "@/components/academy/lesson/lesson-bucket-sort-game";
import { LessonDragToTargetGame } from "@/components/academy/lesson/lesson-drag-to-target-game";
import { LessonSavingsGoalGame } from "@/components/academy/lesson/lesson-savings-goal-game";
import { LessonLinkMatchGame } from "@/components/academy/lesson/lesson-link-match-game";
import { LessonWordDropGame } from "@/components/academy/lesson/lesson-word-drop-game";
import { LessonChoiceButton } from "@/components/academy/lesson/lesson-choice-button";
import { LessonCompletionPane } from "@/components/academy/lesson/lesson-completion-pane";
import {
  lessonGoldClaimClass,
  LESSON_CASH_IN_LABEL,
  lessonSuccessMessageClass,
} from "@/components/academy/lesson/lesson-shared-styles";
import type { LessonFlow } from "@/lib/academy/lessons/hooks/use-lesson-flow";
import type {
  BinaryChoiceScreenConfig,
  BucketSortScreenConfig,
  CompletionScreenConfig,
  DragToTargetScreenConfig,
  HoldToFillScreenConfig,
  LessonRewards,
  LinkMatchScreenConfig,
  NarrativeBonusScreenConfig,
  ScreenConfig,
  SavingsGoalScreenConfig,
  SpotlightRoundsScreenConfig,
  TapRevealScreenConfig,
  TrueFalseScreenConfig,
  WordDropScreenConfig,
} from "@/lib/academy/lessons/types";
import {
  celebrateLessonCorrectAnswer,
  playLessonSuccessPing,
} from "@/lib/academy/lessons/utils";
import { formatLessonBronzeSkillLine } from "@/lib/dashboard/skill-trophies";
import { cn } from "@/lib/utils/cn";

const DEFAULT_HOLD_MS = 2000;

type CoreScreenProps<T extends ScreenConfig> = {
  screen: T;
  screenIndex: number;
  flow: LessonFlow;
};

type StandardScreenProps<T extends ScreenConfig> = CoreScreenProps<T> & {
  rewards: LessonRewards;
};

function SingleBlankWordDropScreen({
  screen,
  screenIndex,
  flow,
}: CoreScreenProps<WordDropScreenConfig>) {
  const [choice, setChoice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleChoice = (option: string) => {
    setChoice(option);
    if (option === screen.correctOption) {
      setError(null);
      celebrateLessonCorrectAnswer(flow.flashScreen);
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

function WordDropScreen({
  screen,
  screenIndex,
  flow,
}: CoreScreenProps<WordDropScreenConfig>) {
  const flowRef = useRef(flow);
  flowRef.current = flow;

  const handleComplete = useCallback(() => {
    flowRef.current.markScreenReady(screenIndex);
  }, [screenIndex]);

  const handleSuccess = useCallback(() => {
    celebrateLessonCorrectAnswer(flowRef.current.flashScreen);
  }, []);

  const handleMistake = useCallback(() => {
    flowRef.current.incrementMistake();
  }, []);

  if (screen.prompt && screen.blanks?.length) {
    return (
      <LessonWordDropGame
        prompt={screen.prompt}
        blanks={screen.blanks}
        wrongError={screen.wrongError}
        successMessage={screen.successMessage}
        promptLabel={screen.promptLabel}
        onComplete={handleComplete}
        onMistake={handleMistake}
        onSuccess={handleSuccess}
      />
    );
  }

  return (
    <SingleBlankWordDropScreen
      screen={screen}
      screenIndex={screenIndex}
      flow={flow}
    />
  );
}

function BinaryChoiceScreen({
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
    if (screen.errorStyle !== "banner") {
      flow.flashScreen("error");
    }
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
      if (screen.errorStyle !== "banner") {
        flow.flashScreen("error");
      }
      scheduleDudFeedbackReset(which);
      return;
    }

    setWrongPicked((current) => new Set(current).add(which));
    setSuccess(null);
    flow.clearScreenReady(screenIndex);
    setError(selected.feedback ?? screen.wrongError);
    flow.incrementMistake();
    if (screen.errorStyle !== "banner") {
      flow.flashScreen("error");
    }
  };

  const pick = isMultiCorrect ? pickMulti : pickSingle;

  const getVariant = (key: ChoiceKey): "neutral" | "correct" | "wrong" => {
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
            <span className="font-heading text-sm font-bold leading-snug text-[#031F82]">
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
          <p className="mt-4 font-sans text-sm leading-relaxed text-[#1E3A5F]">
            {screen.scenePrompt}
          </p>
        ) : null}

        <p className="mt-4 font-sans text-sm font-bold leading-relaxed text-[#031F82]">
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
      <p className="font-sans text-sm leading-relaxed text-[#1E3A5F]">{screen.prompt}</p>
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
      return;
    }
    if (screen.items.length > 0 && tapped.size === screen.items.length) {
      flow.markScreenReady(screenIndex);
    }
  }, [flow, screen.advance?.mode, screen.items.length, screenIndex, tapped.size]);

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

  const renderTapChip = (item: TapRevealScreenConfig["items"][number]) => {
    if (tapDisplay === "label") {
      return item.label;
    }
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
    if (revealDisplay === "label") {
      return item.label;
    }
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

  const handleSuccess = useCallback(() => {
    celebrateLessonCorrectAnswer(flowRef.current.flashScreen);
  }, []);

  return (
    <>
      <p className="font-sans text-sm leading-relaxed text-[#1E3A5F]">{screen.intro}</p>
      <LessonLinkMatchGame
        pairs={screen.pairs}
        eventColumnLabel={screen.eventColumnLabel}
        benefitColumnLabel={screen.benefitColumnLabel}
        onComplete={handleComplete}
        onSuccess={handleSuccess}
      />
      {completeMessage ? (
        <p className={lessonSuccessMessageClass}>{completeMessage}</p>
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
    celebrateLessonCorrectAnswer(flowRef.current.flashScreen);
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

  const isStepsRow = screen.layout === "steps-row";

  if (isStepsRow) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <p className="font-sans text-sm leading-relaxed text-[#1E3A5F]">{screen.intro}</p>
        <div className="mt-3 flex min-h-0 flex-1 flex-col">
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
        </div>
        {completeMessage ? (
          <p className={lessonSuccessMessageClass}>{completeMessage}</p>
        ) : null}
      </div>
    );
  }

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
        <p className={lessonSuccessMessageClass}>{completeMessage}</p>
      ) : null}
    </>
  );
}

function DragToTargetScreen({
  screen,
  screenIndex,
  flow,
}: StandardScreenProps<DragToTargetScreenConfig>) {
  const [completeMessage, setCompleteMessage] = useState<string | null>(null);
  const flowRef = useRef(flow);
  flowRef.current = flow;

  const handleComplete = useCallback(() => {
    if (screen.successMessage) {
      setCompleteMessage(screen.successMessage);
    }
    flowRef.current.markScreenReady(screenIndex);
  }, [screen.successMessage, screenIndex]);

  const handleSuccess = useCallback(() => {
    celebrateLessonCorrectAnswer(flowRef.current.flashScreen);
  }, []);

  return (
    <>
      <p className="font-sans text-sm leading-relaxed text-[#1E3A5F]">{screen.intro}</p>
      <LessonDragToTargetGame
        sourceLabel={screen.sourceLabel}
        targetLabel={screen.targetLabel}
        itemEmoji={screen.itemEmoji}
        coinCount={screen.coinCount}
        onComplete={handleComplete}
        onSuccess={handleSuccess}
      />
      {completeMessage ? (
        <p className={lessonSuccessMessageClass}>{completeMessage}</p>
      ) : null}
    </>
  );
}

function SavingsGoalScreen({
  screen,
  screenIndex,
  flow,
}: StandardScreenProps<SavingsGoalScreenConfig>) {
  const flowRef = useRef(flow);
  flowRef.current = flow;

  const handleGoalReady = useCallback(() => {
    flowRef.current.markScreenReady(screenIndex);
  }, [screenIndex]);

  const handleAdvance = useCallback(() => {
    flowRef.current.handleNext();
  }, []);

  const handleItemSaved = useCallback(() => {
    celebrateLessonCorrectAnswer(flowRef.current.flashScreen);
  }, []);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <p className="shrink-0 font-sans text-xs leading-snug text-[#1E3A5F]">
        {screen.intro}
      </p>

      {screen.imagePlaceholder ? (
        <div
          className="mt-2 flex h-20 w-full shrink-0 flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#BDE9FB] bg-[#F7FBFF] px-3 text-center"
          role="img"
          aria-label={screen.imagePlaceholder.alt ?? screen.imagePlaceholder.label}
        >
          <p className="font-heading text-[9px] font-bold uppercase tracking-wide text-[#0CC1E0]">
            Image placeholder
          </p>
          <p className="mt-0.5 font-heading text-[11px] font-bold leading-tight text-[#031F82]">
            {screen.imagePlaceholder.label}
          </p>
        </div>
      ) : null}

      <div className="mt-2 flex min-h-0 flex-1 flex-col">
        <LessonSavingsGoalGame
          meterLabel={screen.meterLabel}
          targetAmount={screen.targetAmount}
          poolColumnLabel={screen.poolColumnLabel}
          dropZoneLabel={screen.dropZoneLabel}
          items={screen.items}
          workshopSignTitle={screen.workshopSignTitle}
          lockedLabel={screen.lockedLabel}
          unlockedLabel={screen.unlockedLabel}
          goalAchievedLabel={screen.goalAchievedLabel}
          onGoalReady={handleGoalReady}
          onAdvance={handleAdvance}
          onItemSaved={handleItemSaved}
        />
      </div>
    </div>
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
    case "drag-to-target":
      return (
        <DragToTargetScreen
          screen={screen}
          screenIndex={screenIndex}
          flow={flow}
          rewards={rewards}
        />
      );
    case "savings-goal":
      return (
        <SavingsGoalScreen
          screen={screen}
          screenIndex={screenIndex}
          flow={flow}
          rewards={rewards}
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
