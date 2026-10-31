"use client";

import {
  forwardRef,
  useCallback,
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
import { bestDropZone, domRectToDropRect, type DragBounds } from "@/lib/academy/lessons/drop-hit";
import { seededShuffle } from "@/lib/academy/lessons/seeded-shuffle";
import {
  wordBankItems,
  wordDropIsComplete,
  wordDropMatches,
  wordDropPlace,
  wordDropRemove,
  type WordBankItem,
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
  itemId: string;
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
  itemId: string;
  fromBlankIndex: number | null;
  offsetX: number;
  offsetY: number;
  x: number;
  y: number;
  width: number;
  height: number;
};

type PressedChip = {
  itemId: string;
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
  drag: DragBounds | null,
): number | null {
  const zones = blankElements.flatMap((blank, index) => {
    if (!blank) return [];
    return [{ id: index, rect: domRectToDropRect(blank.getBoundingClientRect()) }];
  });
  return bestDropZone(zones, drag, clientX, clientY);
}

export const LessonWordDropGame = forwardRef<
  LessonWordDropGameHandle,
  LessonWordDropGameProps
>(function LessonWordDropGame(
  { prompt, blanks, orderKey, onChoicesChange, onAttemptReady, onIncomplete },
  ref,
) {
  const parts = useMemo(() => prompt.split("[blank]"), [prompt]);

  const authoredBank = useMemo(() => wordBankItems(blanks), [blanks]);
  const [bankItems, setBankItems] = useState<WordBankItem[]>(authoredBank);
  const bankSignature = authoredBank.map((item) => item.id).join("\u0001");
  const authoredBankRef = useRef(authoredBank);
  authoredBankRef.current = authoredBank;
  const playSeed = usePlaySeed([orderKey, "words"]);

  useLayoutEffect(() => {
    const items = authoredBankRef.current;
    if (playSeed === null) {
      setBankItems(items);
      return;
    }
    setBankItems(seededShuffle(items, playSeed));
  }, [bankSignature, playSeed]);

  const [choices, setChoices] = useState<string[]>(() =>
    Array.from({ length: blanks.length }, () => ""),
  );
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
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
  const selectedItemIdRef = useRef<string | null>(null);
  selectedItemIdRef.current = selectedItemId;
  const bankItemsRef = useRef(bankItems);
  bankItemsRef.current = bankItems;
  const pendingBankFocusId = useRef<string | null>(null);
  const bankButtonRefs = useRef(new Map<string, HTMLButtonElement>());

  const commitChoices = useCallback((next: string[]) => {
    choicesRef.current = next;
    setChoices(next);
    onChoicesChangeRef.current?.();
    if (wordDropIsComplete(next)) onAttemptReadyRef.current?.();
    else onIncompleteRef.current?.();
  }, []);

  const labelFor = (itemId: string) =>
    bankItemsRef.current.find((item) => item.id === itemId)?.label ?? "";

  const setArmedItem = (itemId: string | null) => {
    selectedItemIdRef.current = itemId;
    setSelectedItemId(itemId);
  };

  const poolRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const blankRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useImperativeHandle(ref, () => ({
    evaluate: () =>
      wordDropMatches(
        choicesRef.current.map((choice) => (choice ? labelFor(choice) : "")),
        blanksRef.current.map((blank) => blank.correctOption),
      ),
  }));

  const placeWordInBlank = useCallback(
    (blankIndex: number, itemId: string, fromBlankIndex: number | null) => {
      commitChoices(
        wordDropPlace(choicesRef.current, blankIndex, itemId, fromBlankIndex),
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

  const dragBounds = (press: PressSession, clientX: number, clientY: number): DragBounds => ({
    x: clientX - press.offsetX,
    y: clientY - press.offsetY,
    width: press.width,
    height: press.height,
  });

  const beginPress = (
    event: ReactPointerEvent<HTMLElement>,
    itemId: string,
    fromBlankIndex: number | null,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    setPressedChip({ itemId, fromBlankIndex });
    const captureTarget = boardRef.current ?? event.currentTarget;
    try {
      captureTarget.setPointerCapture(event.pointerId);
    } catch {
      // The pointer can end before the element captures it.
    }

    const rect = event.currentTarget.getBoundingClientRect();
    pressRef.current = {
      pointerId: event.pointerId,
      itemId,
      fromBlankIndex,
      startX: event.clientX,
      startY: event.clientY,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      width: rect.width,
      height: rect.height,
      dragging: false,
    };
  };

  const handleBoardPointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    const press = pressRef.current;
    if (!press || event.pointerId !== press.pointerId) return;
    const distance = Math.hypot(event.clientX - press.startX, event.clientY - press.startY);
    if (!press.dragging) {
      if (distance < TAP_MOVE_PX) return;
      press.dragging = true;
      setPressedChip(null);
      setDragState({
        itemId: press.itemId,
        fromBlankIndex: press.fromBlankIndex,
        offsetX: press.offsetX,
        offsetY: press.offsetY,
        x: event.clientX - press.offsetX,
        y: event.clientY - press.offsetY,
        width: press.width,
        height: press.height,
      });
    } else {
      setDragState((current) =>
        current
          ? {
              ...current,
              x: event.clientX - current.offsetX,
              y: event.clientY - current.offsetY,
            }
          : null,
      );
    }
    const bounds = dragBounds(press, event.clientX, event.clientY);
    setHoverBlankIndex(
      resolveBlankIndexFromPointer(event.clientX, event.clientY, blankRefs.current, bounds),
    );
    setHoverPool(
      isPointInRect(event.clientX, event.clientY, poolRef.current?.getBoundingClientRect()),
    );
  };

  const finishPress = (event: ReactPointerEvent<HTMLElement>) => {
    const press = pressRef.current;
    if (!press || event.pointerId !== press.pointerId) return;
    pressRef.current = null;
    const bounds = dragBounds(press, event.clientX, event.clientY);
    const slotIndex = resolveBlankIndexFromPointer(
      event.clientX,
      event.clientY,
      blankRefs.current,
      bounds,
    );

    if (!press.dragging) {
      if (press.fromBlankIndex !== null) {
        const armed = selectedItemIdRef.current;
        if (armed && armed !== press.itemId) {
          placeWordInBlank(press.fromBlankIndex, armed, null);
          setArmedItem(null);
        } else {
          pendingBankFocusId.current = press.itemId;
          removeWordFromBlank(press.fromBlankIndex);
          setArmedItem(press.itemId);
        }
      } else {
        setArmedItem(selectedItemIdRef.current === press.itemId ? null : press.itemId);
      }
      endDrag();
      return;
    }

    if (slotIndex !== null) {
      placeWordInBlank(slotIndex, press.itemId, press.fromBlankIndex);
    } else if (press.fromBlankIndex !== null) {
      removeWordFromBlank(press.fromBlankIndex);
    }
    setArmedItem(null);
    endDrag();
  };

  useLayoutEffect(() => {
    const itemId = pendingBankFocusId.current;
    if (!itemId || choices.includes(itemId)) return;
    const button = bankButtonRefs.current.get(itemId);
    if (!button) return;
    pendingBankFocusId.current = null;
    button.focus();
  }, [choices]);

  const armBankItem = (itemId: string) => {
    setArmedItem(selectedItemIdRef.current === itemId ? null : itemId);
  };

  const activateBlankFromKeyboard = (blankIndex: number) => {
    const armed = selectedItemIdRef.current;
    if (armed) {
      placeWordInBlank(blankIndex, armed, null);
      setArmedItem(null);
      return;
    }
    const itemId = choicesRef.current[blankIndex];
    if (!itemId) return;
    pendingBankFocusId.current = itemId;
    removeWordFromBlank(blankIndex);
    setArmedItem(itemId);
  };

  const blankSlotClass = (index: number, filled: boolean) =>
    cn(
      filled ? lessonBlankSlotFilledClass : lessonBlankSlotClass,
      "align-middle transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#031F82]",
      hoverBlankIndex === index && "bg-[#E8F6FC]/60",
      pressedChip?.fromBlankIndex === index && !dragState && "-translate-y-0.5",
    );

  const visibleBlankWord = (index: number) => {
    const itemId = choices[index];
    if (!itemId) return "";
    if (dragState?.fromBlankIndex === index) return "";
    return labelFor(itemId);
  };

  return (
    <div
      ref={boardRef}
      className="space-y-4 touch-none"
      style={{ touchAction: "none" }}
      onPointerMove={handleBoardPointerMove}
      onPointerUp={finishPress}
      onPointerCancel={finishPress}
    >
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
                        ? `Blank, ${visibleBlankWord(blankIndex)}. Return to the word bank.`
                        : "Blank. Drag a word here."
                    }
                    onKeyDown={(event) => {
                      if (event.repeat) return;
                      if (event.key !== "Enter" && event.key !== " ") return;
                      event.preventDefault();
                      activateBlankFromKeyboard(blankIndex);
                    }}
                    onPointerDown={(event) => {
                      const itemId = choices[blankIndex];
                      if (!itemId) {
                        const armed = selectedItemIdRef.current;
                        if (!armed) return;
                        event.preventDefault();
                        placeWordInBlank(blankIndex, armed, null);
                        setArmedItem(null);
                        return;
                      }
                      beginPress(event, itemId, blankIndex);
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
        {bankItems.map((item) => {
          if (choices.includes(item.id)) return null;
          return (
            <button
              key={item.id}
              ref={(node) => {
                if (node) bankButtonRefs.current.set(item.id, node);
                else bankButtonRefs.current.delete(item.id);
              }}
              type="button"
              aria-pressed={selectedItemId === item.id}
              onKeyDown={(event) => {
                if (event.repeat) return;
                if (event.key !== "Enter" && event.key !== " ") return;
                event.preventDefault();
                armBankItem(item.id);
              }}
              onPointerDown={(event) => {
                beginPress(event, item.id, null);
              }}
              className={cn(
                lessonSortPoolChipClass,
                "text-[20px]",
                selectedItemId === item.id &&
                  "bg-[#EAF0FF] shadow-[inset_0_0_0_2px_#031F82]",
                pressedChip?.itemId === item.id &&
                  pressedChip.fromBlankIndex === null &&
                  !dragState &&
                  "-translate-y-0.5 shadow-[0_6px_0_rgba(3,31,130,0.18)]",
                dragState?.itemId === item.id &&
                  dragState.fromBlankIndex === null &&
                  "opacity-40",
              )}
              aria-label={item.label}
              style={{ touchAction: "none" }}
            >
              <AnswerEmojiLabel label={item.label} />
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
              position: "fixed",
              left: dragState.x,
              top: dragState.y,
              width: dragState.width,
              minHeight: dragState.height,
            }}
          >
            <AnswerEmojiLabel label={labelFor(dragState.itemId)} />
          </div>
        </OverlayPortal>
      ) : null}
    </div>
  );
});
