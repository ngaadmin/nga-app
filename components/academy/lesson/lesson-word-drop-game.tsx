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
  const blankRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const dragCleanupRef = useRef<(() => void) | null>(null);

  useImperativeHandle(ref, () => ({
    evaluate: () => {
      const current = choicesRef.current;
      return blanksRef.current.every(
        (blank, index) => current[index] === blank.correctOption,
      );
    },
  }));

  const removeWordFromBlank = useCallback((blankIndex: number) => {
    const current = choicesRef.current;
    if (!current[blankIndex]) return;
    const next = [...current];
    next[blankIndex] = "";
    choicesRef.current = next;
    setChoices(next);
    onChoicesChangeRef.current?.();
    reportSolvedState();
  }, [reportSolvedState]);

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
        if (press.fromBlankIndex === null) {
          const emptyIndex = choicesRef.current.findIndex((choice) => !choice);
          const target =
            emptyIndex >= 0
              ? emptyIndex
              : blanksRef.current.length === 1
                ? 0
                : null;
          if (target !== null) placeWordInBlank(target, press.word);
        } else {
          removeWordFromBlank(press.fromBlankIndex);
        }
        endDrag();
        return;
      }

      const hit = document.elementFromPoint(
        nativeEvent.clientX,
        nativeEvent.clientY,
      );
      const slot =
        hit instanceof Element ? hit.closest("[data-word-drop-slot]") : null;
      const overBank =
        hit instanceof Element && Boolean(hit.closest("#word-drop-bank"));
      const slotIndex = slot
        ? Number.parseInt(slot.getAttribute("data-word-drop-slot") ?? "", 10)
        : Number.NaN;

      if (Number.isInteger(slotIndex)) {
        placeWordInBlank(slotIndex, press.word);
      } else if (press.fromBlankIndex !== null && (overBank || !slot)) {
        removeWordFromBlank(press.fromBlankIndex);
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
    },
    [],
  );

  const blankSlotClass = (index: number, filled: boolean) =>
    cn(
      filled ? lessonBlankSlotFilledClass : lessonBlankSlotClass,
      "align-middle text-base font-medium transition-colors",
      hoverBlankIndex === index &&
        "border-[#0CC1E0] bg-[#BDE9FB]/45 ring-2 ring-[#0CC1E0]/35",
    );

  const visibleBlankWord = (index: number) => {
    const word = choices[index];
    if (!word) return "";
    if (dragState?.fromBlankIndex === index) return "";
    return word;
  };

  return (
    <div className="space-y-4">
      <p className={cn(lessonNarrativeClass, "mb-5")}>
        {parts.map((part, index) => (
          <span key={`${part}-${index}`}>
            {part}
            {index < blanks.length ? (
              <span
                ref={(node) => {
                  blankRefs.current[index] = node;
                }}
                data-word-drop-slot={index}
                className={blankSlotClass(index, Boolean(visibleBlankWord(index)))}
              >
                {visibleBlankWord(index) ? (
                  <button
                    type="button"
                    aria-label={`Move ${visibleBlankWord(index)}`}
                    onPointerDown={(event) => {
                      const word = choices[index];
                      if (!word) return;
                      beginPress(event, word, index);
                    }}
                    className={lessonSortPoolChipClass}
                    style={{ touchAction: "none" }}
                  >
                    {visibleBlankWord(index)}
                  </button>
                ) : null}
              </span>
            ) : null}
          </span>
        ))}
      </p>

      <div
        ref={poolRef}
        id="word-drop-bank"
        className={cn(
          "flex min-h-10 flex-wrap gap-2",
          hoverPool &&
            dragState?.fromBlankIndex !== null &&
            "ring-2 ring-[#0CC1E0]/35",
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
              onPointerDown={(event) => {
                if (used) return;
                beginPress(event, option, null);
              }}
              className={cn(
                lessonSortPoolChipClass,
                used && "invisible pointer-events-none",
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
});
