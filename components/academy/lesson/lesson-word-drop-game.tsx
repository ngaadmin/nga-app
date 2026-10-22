"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { usePlaySeed } from "@/components/academy/lesson/hooks/use-play-seed";
import {
  lessonBlankSlotClass,
  lessonBlankSlotFilledClass,
  lessonNarrativeClass,
  lessonSortPoolChipClass,
} from "@/components/academy/lesson/lesson-shared-styles";
import { AnswerEmojiLabel } from "@/components/academy/lesson/answer-emoji";
import { OverlayPortal } from "@/components/ui/overlay-portal";
import { seededShuffle } from "@/lib/academy/lessons/seeded-shuffle";
import {
  wordDropIsComplete,
  wordDropMatches,
  wordDropPlace,
  wordDropRemove,
} from "@/lib/academy/lessons/word-drop-placement";
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
  /** Screen id mixed into the chip shuffle. Blanks stay in sentence order. */
  orderKey: string;
  promptLabel?: string;
  onChoicesChange?: () => void;
  /** Every gap has a word. Correctness is still unknown. */
  onAttemptReady?: () => void;
  onIncomplete?: () => void;
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

type PressedChip = {
  word: string;
  fromBlankIndex: number | null;
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
  { prompt, blanks, orderKey, onChoicesChange, onAttemptReady, onIncomplete },
  ref,
) {
  const parts = useMemo(() => prompt.split("[blank]"), [prompt]);

  const authoredOptions = useMemo(() => {
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
  const [allOptions, setAllOptions] = useState<string[]>(authoredOptions);
  const optionSignature = authoredOptions.join("\0");
  const authoredOptionsRef = useRef(authoredOptions);
  authoredOptionsRef.current = authoredOptions;
  const playSeed = usePlaySeed([orderKey, "words"]);

  useLayoutEffect(() => {
    const options = authoredOptionsRef.current;
    if (playSeed === null) {
      setAllOptions(options);
      return;
    }
    setAllOptions(seededShuffle(options, playSeed));
  }, [optionSignature, playSeed]);

  const [choices, setChoices] = useState<string[]>(() =>
    Array.from({ length: blanks.length }, () => ""),
  );
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [pressedChip, setPressedChip] = useState<PressedChip | null>(null);
  const [hoverBlankIndex, setHoverBlankIndex] = useState<number | null>(null);
  const [hoverPool, setHoverPool] = useState(false);

  const choicesRef = useRef(choices);
  choicesRef.current = choices;
  const blanksRef = useRef(blanks);
  blanksRef.current = blanks;
  const onChoicesChangeRef = useRef(onChoicesChange);
  onChoicesChangeRef.current = onChoicesChange;
  const onAttemptReadyRef = useRef(onAttemptReady);
  onAttemptReadyRef.current = onAttemptReady;
  const onIncompleteRef = useRef(onIncomplete);
  onIncompleteRef.current = onIncomplete;
  const pressRef = useRef<PressSession | null>(null);
  const selectedWordRef = useRef<string | null>(null);
  selectedWordRef.current = selectedWord;

  const commitChoices = useCallback((next: string[]) => {
    choicesRef.current = next;
    setChoices(next);
    onChoicesChangeRef.current?.();
    if (wordDropIsComplete(next)) onAttemptReadyRef.current?.();
    else onIncompleteRef.current?.();
  }, []);

  const setArmedWord = (word: string | null) => {
    selectedWordRef.current = word;
    setSelectedWord(word);
  };

  const poolRef = useRef<HTMLDivElement>(null);
  const blankRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const dragCleanupRef = useRef<(() => void) | null>(null);

  useImperativeHandle(ref, () => ({
    evaluate: () =>
      wordDropMatches(
        choicesRef.current,
        blanksRef.current.map((blank) => blank.correctOption),
      ),
  }));

  const placeWordInBlank = useCallback(
    (blankIndex: number, word: string, fromBlankIndex: number | null) => {
      const allowDuplicate =
        blanksRef.current.filter((blank) => blank.correctOption === word).length > 1;
      commitChoices(
        wordDropPlace(
          choicesRef.current,
          blankIndex,
          word,
          fromBlankIndex,
          allowDuplicate,
        ),
      );
    },
    [commitChoices],
  );

  const removeWordFromBlank = useCallback(
    (blankIndex: number) => {
      commitChoices(wordDropRemove(choicesRef.current, blankIndex));
    },
    [commitChoices],
  );

  const endDrag = useCallback(() => {
    setDragState(null);
    setPressedChip(null);
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
    setPressedChip({ word, fromBlankIndex });
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // The pointer can end before the element captures it.
    }

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

    const blockTouchScroll = (touchEvent: TouchEvent) => {
      if (touchEvent.cancelable) touchEvent.preventDefault();
    };

    const move = (nativeEvent: PointerEvent) => {
      const press = pressRef.current;
      if (!press || nativeEvent.pointerId !== pointerId) return;
      const distance = Math.hypot(
        nativeEvent.clientX - press.startX,
        nativeEvent.clientY - press.startY,
      );
      nativeEvent.preventDefault();
      if (!press.dragging) {
        if (distance < TAP_MOVE_PX) return;
        press.dragging = true;
        setPressedChip(null);
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

      if (!press || !press.dragging || nativeEvent.type === "pointercancel") {
        endDrag();
        return;
      }

      const slotIndex = resolveBlankIndexFromPointer(
        nativeEvent.clientX,
        nativeEvent.clientY,
        blankRefs.current,
      );

      if (slotIndex !== null) {
        placeWordInBlank(slotIndex, press.word, press.fromBlankIndex);
      } else if (press.fromBlankIndex !== null) {
        removeWordFromBlank(press.fromBlankIndex);
      }
      setArmedWord(null);

      endDrag();
    };

    dragCleanupRef.current?.();
    window.addEventListener("pointermove", move, { passive: false });
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    window.addEventListener("touchmove", blockTouchScroll, { passive: false });
    dragCleanupRef.current = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      window.removeEventListener("touchmove", blockTouchScroll);
    };
  };

  useEffect(
    () => () => {
      dragCleanupRef.current?.();
    },
    [],
  );

  const armBankWord = (word: string) => {
    setArmedWord(selectedWordRef.current === word ? null : word);
  };

  const activateBlankFromKeyboard = (blankIndex: number) => {
    const armed = selectedWordRef.current;
    if (armed) {
      placeWordInBlank(blankIndex, armed, null);
      setArmedWord(null);
      return;
    }
    const word = choicesRef.current[blankIndex];
    if (!word) return;
    removeWordFromBlank(blankIndex);
    setArmedWord(word);
  };

  const blankSlotClass = (index: number, filled: boolean) =>
    cn(
      filled ? lessonBlankSlotFilledClass : lessonBlankSlotClass,
      "align-middle transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#031F82]",
      hoverBlankIndex === index && "bg-[#E8F6FC]/60",
      pressedChip?.fromBlankIndex === index && !dragState && "-translate-y-0.5",
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
                        : "Blank. Drag a word here."
                    }
                    onKeyDown={(event) => {
                      if (event.repeat) return;
                      if (event.key !== "Enter" && event.key !== " ") return;
                      event.preventDefault();
                      activateBlankFromKeyboard(blankIndex);
                    }}
                    onPointerDown={(event) => {
                      const word = choices[blankIndex];
                      if (!word) return;
                      beginPress(event, word, blankIndex);
                    }}
                    className={cn(
                      blankSlotClass(blankIndex, Boolean(visibleBlankWord(blankIndex))),
                      "select-none text-[22px]",
                      choices[blankIndex] && "cursor-grab touch-none",
                    )}
                  >
                    {visibleBlankWord(blankIndex) ? (
                      <span className={cn(lessonSortPoolChipClass, "text-[20px]")}>
                        <AnswerEmojiLabel label={visibleBlankWord(blankIndex)} />
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
              onKeyDown={(event) => {
                if (event.repeat) return;
                if (event.key !== "Enter" && event.key !== " ") return;
                event.preventDefault();
                if (used) return;
                armBankWord(option);
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
                pressedChip?.word === option &&
                  pressedChip.fromBlankIndex === null &&
                  !dragState &&
                  "-translate-y-0.5 shadow-[0_6px_0_rgba(3,31,130,0.18)]",
                dragState?.word === option &&
                  dragState.fromBlankIndex === null &&
                  "opacity-40",
              )}
              aria-label={option}
              style={{ touchAction: "none" }}
            >
              <AnswerEmojiLabel label={option} />
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
            <AnswerEmojiLabel label={dragState.word} />
          </div>
        </OverlayPortal>
      ) : null}
    </div>
  );
});
