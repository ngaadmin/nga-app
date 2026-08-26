"use client";

import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  lessonBlankSlotClass,
  lessonBlankSlotFilledClass,
  lessonChoiceStateClass,
  lessonInstructionClass,
  lessonNarrativeClass,
  lessonSortPoolChipClass,
} from "@/components/academy/lesson/lesson-shared-styles";
import { LessonCard, LessonColumnLabel, LessonSuccessBanner } from "@/components/academy/lesson/lesson-ui";
import { OverlayPortal } from "@/components/ui/overlay-portal";
import { cn } from "@/lib/utils/cn";

type WordDropBlank = {
  options: readonly string[];
  correctOption: string;
};

type LessonWordDropGameProps = {
  prompt: string;
  blanks: readonly WordDropBlank[];
  wrongError: string;
  successMessage?: string;
  promptLabel?: string;
  onComplete: () => void;
  onMistake: () => void;
  onSuccess?: () => void;
};

type DragState = {
  word: string;
  fromBlankIndex: number | null;
  offsetX: number;
  offsetY: number;
  x: number;
  y: number;
  width: number;
  height: number;
};

function isPointInRect(
  clientX: number,
  clientY: number,
  rect: DOMRect | undefined,
): boolean {
  if (!rect) return false;
  return (
    clientX >= rect.left &&
    clientX <= rect.right &&
    clientY >= rect.top &&
    clientY <= rect.bottom
  );
}

function resolveBlankIndexFromPointer(
  clientX: number,
  clientY: number,
  blankElements: readonly (HTMLSpanElement | null)[],
): number | null {
  for (let index = 0; index < blankElements.length; index += 1) {
    const blank = blankElements[index];
    if (!blank) continue;

    const rect = blank.getBoundingClientRect();
    if (isPointInRect(clientX, clientY, rect)) {
      return index;
    }
  }
  return null;
}

export function LessonWordDropGame({
  prompt,
  blanks,
  wrongError,
  successMessage,
  promptLabel = "Word Drop",
  onComplete,
  onMistake,
  onSuccess,
}: LessonWordDropGameProps) {
  const parts = useMemo(() => prompt.split("[blank]"), [prompt]);

  const allOptions = useMemo(() => {
    const seen = new Set<string>();
    const options: string[] = [];
    for (const blank of blanks) {
      for (const option of blank.options) {
        if (!seen.has(option)) {
          seen.add(option);
          options.push(option);
        }
      }
    }
    return options;
  }, [blanks]);

  const [choices, setChoices] = useState<string[]>(() =>
    Array.from({ length: blanks.length }, () => ""),
  );
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [hoverBlankIndex, setHoverBlankIndex] = useState<number | null>(null);
  const [hoverPool, setHoverPool] = useState(false);

  const choicesRef = useRef(choices);
  choicesRef.current = choices;
  const isCompleteRef = useRef(isComplete);
  isCompleteRef.current = isComplete;

  const boardRef = useRef<HTMLDivElement>(null);
  const poolRef = useRef<HTMLDivElement>(null);
  const blankRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const chipRefs = useRef<Partial<Record<string, HTMLButtonElement | null>>>({});
  const captureTargetRef = useRef<HTMLElement | null>(null);
  const activePointerIdRef = useRef<number | null>(null);
  const hasCompletedRef = useRef(false);

  const onCompleteRef = useRef(onComplete);
  const onMistakeRef = useRef(onMistake);
  const onSuccessRef = useRef(onSuccess);
  onCompleteRef.current = onComplete;
  onMistakeRef.current = onMistake;
  onSuccessRef.current = onSuccess;

  const poolOptions = useMemo(
    () =>
      allOptions.filter((option) => {
        if (!choices.includes(option)) return true;
        const fromBlankIndex = dragState?.fromBlankIndex;
        return (
          fromBlankIndex != null &&
          choices[fromBlankIndex] === option
        );
      }),
    [allOptions, choices, dragState],
  );

  const tryFinish = useCallback(
    (nextChoices: readonly string[]) => {
      if (hasCompletedRef.current || !nextChoices.every(Boolean)) return;

      const allCorrect = blanks.every(
        (blank, index) => nextChoices[index] === blank.correctOption,
      );

      if (allCorrect) {
        hasCompletedRef.current = true;
        setIsComplete(true);
        setError(null);
        onSuccessRef.current?.();
        onCompleteRef.current();
        return;
      }

      setError(wrongError);
      onMistakeRef.current();
    },
    [blanks, wrongError],
  );

  const removeWordFromBlank = useCallback((blankIndex: number) => {
    if (isCompleteRef.current) return;

    setChoices((current) => {
      if (!current[blankIndex]) return current;
      const next = [...current];
      next[blankIndex] = "";
      choicesRef.current = next;
      return next;
    });
    setError(null);
  }, []);

  const assignWordToBlank = useCallback(
    (blankIndex: number, word: string) => {
      if (isCompleteRef.current) return;

      setChoices((current) => {
        const next = [...current];
        for (let index = 0; index < next.length; index += 1) {
          if (index !== blankIndex && next[index] === word) {
            next[index] = "";
          }
        }
        next[blankIndex] = word;
        choicesRef.current = next;
        return next;
      });
      setError(null);

      window.requestAnimationFrame(() => {
        tryFinish(choicesRef.current);
      });
    },
    [tryFinish],
  );

  const releasePointerCapture = useCallback(() => {
    const target = captureTargetRef.current;
    const pointerId = activePointerIdRef.current;
    if (target && pointerId !== null && target.hasPointerCapture(pointerId)) {
      target.releasePointerCapture(pointerId);
    }
    captureTargetRef.current = null;
    activePointerIdRef.current = null;
  }, []);

  const endDrag = useCallback(() => {
    releasePointerCapture();
    setDragState(null);
    setHoverBlankIndex(null);
    setHoverPool(false);
  }, [releasePointerCapture]);

  const startDrag = (
    event: ReactPointerEvent<HTMLElement>,
    word: string,
    fromBlankIndex: number | null,
  ) => {
    if (isCompleteRef.current) return;

    const chip =
      fromBlankIndex === null
        ? chipRefs.current[word]
        : blankRefs.current[fromBlankIndex];

    const rect = (chip ?? event.currentTarget).getBoundingClientRect();

    captureTargetRef.current = boardRef.current;
    activePointerIdRef.current = event.pointerId;
    boardRef.current?.setPointerCapture(event.pointerId);

    setDragState({
      word,
      fromBlankIndex,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height,
    });
  };

  const handleBoardPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragState || activePointerIdRef.current !== event.pointerId) return;

    setDragState((current) =>
      current
        ? {
            ...current,
            x: event.clientX - current.offsetX,
            y: event.clientY - current.offsetY,
          }
        : null,
    );

    setHoverBlankIndex(
      resolveBlankIndexFromPointer(
        event.clientX,
        event.clientY,
        blankRefs.current,
      ),
    );
    setHoverPool(
      isPointInRect(
        event.clientX,
        event.clientY,
        poolRef.current?.getBoundingClientRect(),
      ),
    );
  };

  const handleBoardPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragState || activePointerIdRef.current !== event.pointerId) return;

    const targetBlank = resolveBlankIndexFromPointer(
      event.clientX,
      event.clientY,
      blankRefs.current,
    );
    const droppedOnPool = isPointInRect(
      event.clientX,
      event.clientY,
      poolRef.current?.getBoundingClientRect(),
    );

    if (targetBlank !== null) {
      assignWordToBlank(targetBlank, dragState.word);
    } else if (
      dragState.fromBlankIndex !== null &&
      (droppedOnPool || targetBlank === null)
    ) {
      removeWordFromBlank(dragState.fromBlankIndex);
    }

    endDrag();
  };

  const blankSlotClass = (index: number, filled: boolean) =>
    cn(
      filled ? lessonBlankSlotFilledClass : lessonBlankSlotClass,
      "align-middle text-base font-medium transition-colors",
      hoverBlankIndex === index &&
        "border-[#0CC1E0] bg-[#BDE9FB]/45 ring-2 ring-[#0CC1E0]/35",
      error &&
        choices[index] &&
        choices[index] !== blanks[index]?.correctOption &&
        lessonChoiceStateClass(true, "wrong"),
      isComplete &&
        choices[index] === blanks[index]?.correctOption &&
        lessonChoiceStateClass(true, "correct"),
    );

  const visibleBlankWord = (index: number) => {
    const word = choices[index];
    if (!word) return "";
    if (dragState?.fromBlankIndex === index) return "";
    return word;
  };

  return (
    <div
      ref={boardRef}
      className="space-y-4"
      onPointerMove={handleBoardPointerMove}
      onPointerUp={handleBoardPointerUp}
      onPointerCancel={handleBoardPointerUp}
    >
      <p className={lessonInstructionClass}>
        {parts.map((part, index) => (
          <span key={`${part}-${index}`}>
            {part}
            {index < blanks.length ? (
              <span
                ref={(node) => {
                  blankRefs.current[index] = node;
                }}
                role="button"
                tabIndex={isComplete ? -1 : 0}
                aria-label={`Blank ${index + 1}${choices[index] ? `: ${choices[index]}` : ""}`}
                onPointerDown={(event) => {
                  if (!choices[index] || isComplete) return;
                  event.preventDefault();
                  startDrag(event, choices[index]!, index);
                }}
                className={blankSlotClass(index, Boolean(visibleBlankWord(index)))}
              >
                {visibleBlankWord(index) || "______"}
              </span>
            ) : null}
          </span>
        ))}
      </p>

      {!isComplete ? (
        <LessonCard
          ref={poolRef}
          className={cn(
            "space-y-2 transition-colors",
            hoverPool &&
              dragState?.fromBlankIndex !== null &&
              "ring-2 ring-[#0CC1E0]/35",
          )}
        >
          <LessonColumnLabel>{promptLabel}</LessonColumnLabel>
          <p className={lessonNarrativeClass}>
            Drag a word into each blank. Drag a filled word back here to change
            your answer.
          </p>
          <div className="flex flex-wrap gap-2">
            {poolOptions.map((option) => (
              <button
                key={option}
                ref={(node) => {
                  chipRefs.current[option] = node;
                }}
                type="button"
                onPointerDown={(event) => {
                  event.preventDefault();
                  startDrag(event, option, null);
                }}
                className={cn(
                  lessonSortPoolChipClass,
                  dragState?.word === option &&
                    dragState.fromBlankIndex === null &&
                    "opacity-40",
                )}
                style={{ touchAction: "none" }}
              >
                {option}
              </button>
            ))}
          </div>
        </LessonCard>
      ) : null}

      {isComplete && successMessage?.trim() ? (
        <LessonSuccessBanner>{successMessage}</LessonSuccessBanner>
      ) : null}

      {error ? (
        <p className={cn("mt-3 px-3 py-2 font-sans text-sm font-medium text-[#031F82]")} role="alert">
          {error}
        </p>
      ) : null}

      {dragState ? (
        <OverlayPortal className="overflow-visible">
          <div
            className={cn(
              lessonSortPoolChipClass,
              "pointer-events-none fixed shadow-lg",
            )}
            style={{
              left: dragState.x,
              top: dragState.y,
              width: dragState.width,
              minHeight: dragState.height,
            }}
          >
            {dragState.word}
          </div>
        </OverlayPortal>
      ) : null}
    </div>
  );
}
