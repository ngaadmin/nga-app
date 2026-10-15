"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  lessonBlankSlotClass,
  lessonBlankSlotFilledClass,
  lessonNarrativeClass,
  lessonSortPoolChipClass,
} from "@/components/academy/lesson/lesson-shared-styles";
import { LessonAnswerTick } from "@/components/academy/lesson/lesson-ui";
import { OverlayPortal } from "@/components/ui/overlay-portal";
import { cn } from "@/lib/utils/cn";

type WordDropBlank = {
  options: readonly string[];
  correctOption: string;
};

export type LessonWordDropGameHandle = {
  /** True only when every blank matches its correct option. Empty is not correct. */
  evaluate: () => boolean;
};

type LessonWordDropGameProps = {
  prompt: string;
  blanks: readonly WordDropBlank[];
  promptLabel?: string;
  onChoicesChange?: () => void;
  onComplete?: () => void;
  onIncomplete?: () => void;
  onMismatch?: () => void;
};

const TAP_MOVE_PX = 10;

type PressSession = {
  pointerId: number;
  word: string;
  fromBlankIndex: number | null;
  startX: number;
  startY: number;
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;
  dragging: boolean;
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

function splitLeadingPunctuation(part: string): { punctuation: string; rest: string } {
  const match = /^(\s*)([.,!?;:]+)([\s\S]*)$/.exec(part);
  if (!match) return { punctuation: "", rest: part };
  return { punctuation: match[2] ?? "", rest: match[3] ?? "" };
}

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
  blankElements: readonly (HTMLElement | null)[],
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

export const LessonWordDropGame = forwardRef<
  LessonWordDropGameHandle,
  LessonWordDropGameProps
>(function LessonWordDropGame(
  { prompt, blanks, onChoicesChange, onComplete, onIncomplete, onMismatch },
  ref,
) {
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
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [shakeWord, setShakeWord] = useState<string | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [hoverBlankIndex, setHoverBlankIndex] = useState<number | null>(null);
  const [hoverPool, setHoverPool] = useState(false);

  const choicesRef = useRef(choices);
  choicesRef.current = choices;
  const blanksRef = useRef(blanks);
  blanksRef.current = blanks;
  const onChoicesChangeRef = useRef(onChoicesChange);
  onChoicesChangeRef.current = onChoicesChange;
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const onIncompleteRef = useRef(onIncomplete);
  onIncompleteRef.current = onIncomplete;
  const onMismatchRef = useRef(onMismatch);
  onMismatchRef.current = onMismatch;
  const pressRef = useRef<PressSession | null>(null);
  const shakeTimerRef = useRef<number | null>(null);
  const suppressClickRef = useRef(false);
  const placeTappedWordRef = useRef<(word: string) => void>(() => {});

  const rejectWord = (word: string) => {
    setSelectedWord(word);
    setShakeWord(word);
    onMismatchRef.current?.();
    if (shakeTimerRef.current !== null) window.clearTimeout(shakeTimerRef.current);
    shakeTimerRef.current = window.setTimeout(() => {
      setShakeWord((current) => (current === word ? null : current));
      setSelectedWord((current) => (current === word ? null : current));
      shakeTimerRef.current = null;
    }, 360);
  };

  const reportSolvedState = useCallback((placedBlankIndex?: number) => {
    const solved = blanksRef.current.every(
      (blank, index) => choicesRef.current[index] === blank.correctOption,
    );
    if (solved) {
      onCompleteRef.current?.();
      return;
    }
    onIncompleteRef.current?.();
    if (placedBlankIndex === undefined) return;
    const blank = blanksRef.current[placedBlankIndex];
    const placed = choicesRef.current[placedBlankIndex];
    if (blank && placed && placed !== blank.correctOption) {
      onMismatchRef.current?.();
    }
  }, []);

  const poolRef = useRef<HTMLDivElement>(null);
  const blankRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const dragCleanupRef = useRef<(() => void) | null>(null);

  useImperativeHandle(ref, () => ({
    evaluate: () => {
      const current = choicesRef.current;
      return blanksRef.current.every(
        (blank, index) => current[index] === blank.correctOption,
      );
    },
  }));

  const placeWordInBlank = useCallback(
    (blankIndex: number, word: string) => {
      const next = [...choicesRef.current];
      for (let index = 0; index < next.length; index += 1) {
        if (index !== blankIndex && next[index] === word) {
          next[index] = "";
        }
      }
      next[blankIndex] = word;
      choicesRef.current = next;
      setChoices(next);
      onChoicesChangeRef.current?.();
      reportSolvedState(blankIndex);
    },
    [reportSolvedState],
  );

  const endDrag = useCallback(() => {
    setDragState(null);
    setHoverBlankIndex(null);
    setHoverPool(false);
  }, []);

  const beginPress = (
    event: ReactPointerEvent<HTMLElement>,
    word: string,
    fromBlankIndex: number | null,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    suppressClickRef.current = true;

    const rect = event.currentTarget.getBoundingClientRect();
    const pointerId = event.pointerId;
    pressRef.current = {
      pointerId,
      word,
      fromBlankIndex,
      startX: event.clientX,
      startY: event.clientY,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      width: rect.width,
      height: rect.height,
      dragging: false,
    };

    const move = (nativeEvent: PointerEvent) => {
      const press = pressRef.current;
      if (!press || nativeEvent.pointerId !== pointerId) return;
      const distance = Math.hypot(
        nativeEvent.clientX - press.startX,
        nativeEvent.clientY - press.startY,
      );
      if (!press.dragging) {
        if (distance < TAP_MOVE_PX) return;
        press.dragging = true;
        setDragState({
          word: press.word,
          fromBlankIndex: press.fromBlankIndex,
          offsetX: press.offsetX,
          offsetY: press.offsetY,
          x: nativeEvent.clientX - press.offsetX,
          y: nativeEvent.clientY - press.offsetY,
          width: press.width,
          height: press.height,
        });
      } else {
        setDragState((current) =>
          current
            ? {
                ...current,
                x: nativeEvent.clientX - current.offsetX,
                y: nativeEvent.clientY - current.offsetY,
              }
            : null,
        );
      }
      setHoverBlankIndex(
        resolveBlankIndexFromPointer(
          nativeEvent.clientX,
          nativeEvent.clientY,
          blankRefs.current,
        ),
      );
      setHoverPool(
        isPointInRect(
          nativeEvent.clientX,
          nativeEvent.clientY,
          poolRef.current?.getBoundingClientRect(),
        ),
      );
    };

    const up = (nativeEvent: PointerEvent) => {
      if (nativeEvent.pointerId !== pointerId) return;
      const press = pressRef.current;
      dragCleanupRef.current?.();
      dragCleanupRef.current = null;
      pressRef.current = null;

      if (!press) {
        endDrag();
        return;
      }

      if (!press.dragging) {
        if (nativeEvent.type !== "pointercancel") {
          placeTappedWordRef.current(press.word);
        }
        endDrag();
        return;
      }

      const slotIndex = resolveBlankIndexFromPointer(
        nativeEvent.clientX,
        nativeEvent.clientY,
        blankRefs.current,
      );
      const blank = slotIndex === null ? undefined : blanksRef.current[slotIndex];
      const locked =
        slotIndex !== null &&
        choicesRef.current[slotIndex] === blank?.correctOption &&
        Boolean(choicesRef.current[slotIndex]);

      if (slotIndex !== null && blank && !locked && press.word === blank.correctOption) {
        placeWordInBlank(slotIndex, press.word);
      } else if (slotIndex !== null && press.word !== blank?.correctOption) {
        rejectWord(press.word);
      }

      endDrag();
    };

    dragCleanupRef.current?.();
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    dragCleanupRef.current = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  };

  useEffect(
    () => () => {
      dragCleanupRef.current?.();
      if (shakeTimerRef.current !== null) window.clearTimeout(shakeTimerRef.current);
    },
    [],
  );

  const placeTappedWord = (word: string) => {
    const blanksNow = blanksRef.current;
    const choicesNow = choicesRef.current;
    const open = blanksNow
      .map((blank, index) => ({ blank, index }))
      .filter(({ blank, index }) => {
        const filled = choicesNow[index];
        return !(filled && filled === blank.correctOption);
      });

    if (open.length === 0) return;

    let target = open.length === 1 ? open[0] : undefined;
    if (!target) {
      const matches = open.filter(
        ({ blank, index }) => !choicesNow[index] && word === blank.correctOption,
      );
      if (matches.length === 1) target = matches[0];
    }

    if (!target) {
      setSelectedWord(word);
      setShakeWord((current) => (current === word ? current : null));
      return;
    }

    if (word === target.blank.correctOption) {
      placeWordInBlank(target.index, word);
      setSelectedWord(null);
      return;
    }

    rejectWord(word);
  };
  placeTappedWordRef.current = placeTappedWord;

  const placeSelectedWord = (blankIndex: number) => {
    const word = selectedWord;
    if (!word) return;
    const blank = blanksRef.current[blankIndex];
    if (!blank) return;
    const locked =
      choicesRef.current[blankIndex] === blank.correctOption &&
      Boolean(choicesRef.current[blankIndex]);
    if (locked) return;
    if (word === blank.correctOption) {
      placeWordInBlank(blankIndex, word);
      setSelectedWord(null);
      return;
    }
    rejectWord(word);
  };

  const blankSlotClass = (index: number, filled: boolean) =>
    cn(
      filled ? lessonBlankSlotFilledClass : lessonBlankSlotClass,
      "align-middle transition-colors",
      hoverBlankIndex === index && "bg-[#E8F6FC]/60",
    );

  const visibleBlankWord = (index: number) => {
    const word = choices[index];
    if (!word) return "";
    if (dragState?.fromBlankIndex === index) return "";
    return word;
  };

  return (
    <div className="space-y-4">
      <p className={cn(lessonNarrativeClass, "mb-5 text-[22px]")}>
        {parts.map((part, index) => {
          const attached = index > 0 ? splitLeadingPunctuation(part) : null;
          const text = attached ? attached.rest : part;
          const blankIndex = index - 1;
          return (
            <span key={`${part}-${index}`}>
              {attached ? (
                <span className="inline-flex items-baseline whitespace-nowrap align-middle">
                  <button
                    type="button"
                    ref={(node) => {
                      blankRefs.current[blankIndex] = node;
                    }}
                    data-word-drop-slot={blankIndex}
                    aria-label={
                      visibleBlankWord(blankIndex)
                        ? `Blank, ${visibleBlankWord(blankIndex)}`
                        : "Blank. Place the selected word here."
                    }
                    onClick={() => placeSelectedWord(blankIndex)}
                    className={cn(
                      blankSlotClass(blankIndex, Boolean(visibleBlankWord(blankIndex))),
                      "text-[22px]",
                    )}
                  >
                    {visibleBlankWord(blankIndex) ? (
                      <span className={cn(lessonSortPoolChipClass, "relative text-[20px]")}>
                        {visibleBlankWord(blankIndex)}
                        {visibleBlankWord(blankIndex) ===
                        blanks[blankIndex]?.correctOption ? (
                          <LessonAnswerTick className="absolute -right-3 -top-3" />
                        ) : null}
                      </span>
                    ) : null}
                  </button>
                  {attached.punctuation ? (
                    <span className="ml-0.5">{attached.punctuation}</span>
                  ) : null}
                </span>
              ) : null}
              {text}
            </span>
          );
        })}
      </p>

      <div
        ref={poolRef}
        id="word-drop-bank"
        className={cn(
          "flex min-h-12 flex-wrap items-center justify-center gap-3",
          hoverPool && dragState?.fromBlankIndex !== null && "bg-[#E8F6FC]/40",
        )}
      >
        {allOptions.map((option) => {
          const used =
            choices.includes(option) &&
            !(
              dragState?.fromBlankIndex != null &&
              choices[dragState.fromBlankIndex] === option
            );
          return (
            <button
              key={option}
              type="button"
              aria-pressed={selectedWord === option}
              onClick={() => {
                if (suppressClickRef.current) {
                  suppressClickRef.current = false;
                  return;
                }
                if (used) return;
                placeTappedWord(option);
              }}
              onKeyDown={(event) => {
                if (event.key !== "Enter" && event.key !== " ") return;
                event.preventDefault();
                if (used) return;
                placeTappedWord(option);
              }}
              onPointerDown={(event) => {
                if (used) return;
                beginPress(event, option, null);
              }}
              className={cn(
                lessonSortPoolChipClass,
                "text-[20px]",
                used && "hidden",
                selectedWord === option &&
                  "bg-[#EAF0FF] shadow-[inset_0_0_0_2px_#031F82]",
                shakeWord === option && "lesson-tile-shake",
                dragState?.word === option &&
                  dragState.fromBlankIndex === null &&
                  "opacity-40",
              )}
              style={{ touchAction: "none" }}
            >
              {option}
            </button>
          );
        })}
      </div>

      {dragState ? (
        <OverlayPortal className="overflow-visible">
          <div
            className={cn(
              lessonSortPoolChipClass,
              "pointer-events-none fixed",
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
});
