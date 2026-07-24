"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  lessonChoiceBaseClass,
  lessonChoiceStateClass,
  lessonMatchPulseClass,
  lessonSortRowClass,
} from "@/components/academy/lesson/lesson-shared-styles";
import {
  LessonCard,
  LessonGameBoard,
  LessonGameHint,
  LessonMatchColumnHeaders,
  LessonMatchConnector,
  LessonMatchRow,
  LessonSuccessBanner,
} from "@/components/academy/lesson/lesson-ui";
import { cn } from "@/lib/utils/cn";

export type LessonLinkMatchPair = {
  id: string;
  event: string;
  benefit: string;
};

type LessonLinkMatchGameProps = {
  pairs: readonly LessonLinkMatchPair[];
  eventColumnLabel?: string;
  benefitColumnLabel?: string;
  onComplete: () => void;
  onSuccess?: () => void;
  onMismatch?: () => void;
};

const MATCH_PULSE_MS = 750;

function shuffleIds(ids: readonly string[]): string[] {
  const next = [...ids];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j]!, next[i]!];
  }
  return next;
}

function shuffleBenefitsAwayFromEvents(
  pairIds: readonly string[],
  eventOrder: readonly string[],
): string[] {
  if (pairIds.length <= 1) return shuffleIds(pairIds);

  let benefitOrder = shuffleIds(pairIds);
  let attempts = 0;
  while (
    benefitOrder.some((id, index) => id === eventOrder[index]) &&
    attempts < 24
  ) {
    benefitOrder = shuffleIds(pairIds);
    attempts += 1;
  }
  return benefitOrder;
}

function resolveRowIndexFromPointer(
  clientY: number,
  rowElements: readonly (HTMLDivElement | null)[],
): number {
  for (let index = 0; index < rowElements.length; index += 1) {
    const row = rowElements[index];
    if (!row) continue;

    const rect = row.getBoundingClientRect();
    if (clientY >= rect.top && clientY <= rect.bottom) {
      return index;
    }
  }

  const lastRow = rowElements[rowElements.length - 1];
  if (lastRow && clientY > lastRow.getBoundingClientRect().bottom) {
    return rowElements.length - 1;
  }

  return 0;
}

function matchingRowIndices(
  eventOrder: readonly string[],
  benefitOrder: readonly string[],
): Set<number> {
  const matched = new Set<number>();
  for (let index = 0; index < eventOrder.length; index += 1) {
    if (eventOrder[index] === benefitOrder[index]) {
      matched.add(index);
    }
  }
  return matched;
}

export function LessonLinkMatchGame({
  pairs,
  eventColumnLabel = "The Event",
  benefitColumnLabel = "The Win",
  onComplete,
  onSuccess,
  onMismatch,
}: LessonLinkMatchGameProps) {
  const pairIds = useMemo(() => pairs.map((pair) => pair.id), [pairs]);
  const pairById = useMemo(
    () => new Map(pairs.map((pair) => [pair.id, pair])),
    [pairs],
  );

  const eventOrder = pairIds;

  const [benefitOrder, setBenefitOrder] = useState(() =>
    shuffleBenefitsAwayFromEvents(pairIds, eventOrder),
  );
  const [isComplete, setIsComplete] = useState(false);
  const [lockedRows, setLockedRows] = useState<ReadonlySet<number>>(
    () => new Set(),
  );
  const [pulsingRows, setPulsingRows] = useState<ReadonlySet<number>>(
    () => new Set(),
  );
  const [dragBenefitId, setDragBenefitId] = useState<string | null>(null);

  const benefitOrderRef = useRef(benefitOrder);
  benefitOrderRef.current = benefitOrder;
  const lockedRowsRef = useRef(lockedRows);
  lockedRowsRef.current = lockedRows;

  const boardRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const captureTargetRef = useRef<HTMLElement | null>(null);
  const activePointerIdRef = useRef<number | null>(null);
  const prevMatchedRowsRef = useRef<Set<number>>(new Set());
  const pulseTimeoutsRef = useRef<Partial<Record<number, number>>>({});
  const isCompleteRef = useRef(isComplete);
  isCompleteRef.current = isComplete;

  const onCompleteRef = useRef(onComplete);
  const onSuccessRef = useRef(onSuccess);
  const onMismatchRef = useRef(onMismatch);
  onCompleteRef.current = onComplete;
  onSuccessRef.current = onSuccess;
  onMismatchRef.current = onMismatch;

  const pulseRow = useCallback((rowIndex: number) => {
    const existing = pulseTimeoutsRef.current[rowIndex];
    if (existing !== undefined) {
      window.clearTimeout(existing);
    }

    setPulsingRows((current) => new Set(current).add(rowIndex));

    pulseTimeoutsRef.current[rowIndex] = window.setTimeout(() => {
      setPulsingRows((current) => {
        const next = new Set(current);
        next.delete(rowIndex);
        return next;
      });
      delete pulseTimeoutsRef.current[rowIndex];
    }, MATCH_PULSE_MS);
  }, []);

  const evaluateMatches = useCallback(
    (order: readonly string[]) => {
      if (isCompleteRef.current) return;

      const matchedNow = matchingRowIndices(eventOrder, order);

      for (const rowIndex of matchedNow) {
        if (!prevMatchedRowsRef.current.has(rowIndex)) {
          pulseRow(rowIndex);
          onSuccessRef.current?.();
        }
      }

      prevMatchedRowsRef.current = matchedNow;

      setLockedRows(() => {
        const next = new Set<number>();
        for (const rowIndex of matchedNow) {
          if (eventOrder[rowIndex] === order[rowIndex]) {
            next.add(rowIndex);
          }
        }
        return next;
      });

      if (matchedNow.size === eventOrder.length) {
        setIsComplete(true);
        onCompleteRef.current();
      }
    },
    [eventOrder, pulseRow],
  );

  const moveBenefit = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (isCompleteRef.current || fromIndex === toIndex) return;
      if (
        lockedRowsRef.current.has(fromIndex) ||
        lockedRowsRef.current.has(toIndex)
      ) {
        return;
      }

      setBenefitOrder((current) => {
        const next = [...current];
        const fromBenefit = next[fromIndex];
        const toBenefit = next[toIndex];
        if (!fromBenefit || !toBenefit) return current;

        next[fromIndex] = toBenefit;
        next[toIndex] = fromBenefit;
        benefitOrderRef.current = next;
        return next;
      });
    },
    [],
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
    setDragBenefitId(null);
    evaluateMatches(benefitOrderRef.current);
  }, [evaluateMatches, releasePointerCapture]);

  useEffect(() => {
    const pulseTimeouts = pulseTimeoutsRef.current;
    return () => {
      releasePointerCapture();
      for (const timeoutId of Object.values(pulseTimeouts)) {
        if (timeoutId !== undefined) window.clearTimeout(timeoutId);
      }
    };
  }, [releasePointerCapture]);

  const reorderDraggedBenefit = useCallback(
    (clientY: number) => {
      if (!dragBenefitId || isCompleteRef.current) return;

      const fromIndex = benefitOrderRef.current.indexOf(dragBenefitId);
      if (fromIndex < 0) return;

      const toIndex = resolveRowIndexFromPointer(clientY, rowRefs.current);
      if (toIndex >= 0 && fromIndex !== toIndex) {
        moveBenefit(fromIndex, toIndex);
      }
    },
    [dragBenefitId, moveBenefit],
  );

  const handleBenefitPointerDown = (
    event: ReactPointerEvent<HTMLDivElement>,
    benefitId: string,
    rowIndex: number,
  ) => {
    if (isCompleteRef.current || lockedRowsRef.current.has(rowIndex)) return;

    event.preventDefault();
    event.stopPropagation();

    captureTargetRef.current = boardRef.current;
    activePointerIdRef.current = event.pointerId;
    boardRef.current?.setPointerCapture(event.pointerId);
    setDragBenefitId(benefitId);
  };

  const handleBoardPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragBenefitId || activePointerIdRef.current !== event.pointerId) {
      return;
    }
    reorderDraggedBenefit(event.clientY);
  };

  const handleBoardPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (activePointerIdRef.current !== event.pointerId) return;

    const hadDrag = dragBenefitId !== null;
    const matchCountBefore = prevMatchedRowsRef.current.size;
    endDrag();

    if (
      hadDrag &&
      prevMatchedRowsRef.current.size < eventOrder.length &&
      prevMatchedRowsRef.current.size <= matchCountBefore
    ) {
      onMismatchRef.current?.();
    }
  };

  const handleKeyboardMove = (fromIndex: number, toIndex: number) => {
    if (
      isCompleteRef.current ||
      lockedRowsRef.current.has(fromIndex) ||
      lockedRowsRef.current.has(toIndex)
    ) {
      return;
    }
    moveBenefit(fromIndex, toIndex);
    window.requestAnimationFrame(() => {
      const matchCountBefore = prevMatchedRowsRef.current.size;
      evaluateMatches(benefitOrderRef.current);
      if (
        prevMatchedRowsRef.current.size < eventOrder.length &&
        prevMatchedRowsRef.current.size <= matchCountBefore
      ) {
        onMismatchRef.current?.();
      }
    });
  };

  const matchPulseClass = lessonMatchPulseClass;

  return (
    <LessonGameBoard>
      <LessonMatchColumnHeaders
        left={eventColumnLabel}
        right={benefitColumnLabel}
      />

      <LessonCard
        ref={boardRef}
        className="space-y-2 p-3 sm:p-4"
        onPointerMove={handleBoardPointerMove}
        onPointerUp={handleBoardPointerUp}
        onPointerCancel={handleBoardPointerUp}
      >
        {eventOrder.map((eventId, rowIndex) => {
          const benefitId = benefitOrder[rowIndex];
          if (!benefitId) return null;

          const eventPair = pairById.get(eventId);
          const benefitPair = pairById.get(benefitId);
          if (!eventPair || !benefitPair) return null;

          const isRowMatched = eventId === benefitId;
          const isRowLocked = lockedRows.has(rowIndex) && isRowMatched;
          const isPulsing = pulsingRows.has(rowIndex);
          const isDragging = dragBenefitId === benefitId;

          return (
            <LessonMatchRow
              key={`match-row-${rowIndex}`}
              ref={(node) => {
                rowRefs.current[rowIndex] = node;
              }}
            >
              <div
                className={cn(
                  lessonChoiceBaseClass,
                  "cursor-default rounded-full py-4 text-base shadow-none active:scale-100",
                  (isComplete || isRowLocked) &&
                    isRowMatched &&
                    lessonChoiceStateClass(true, "correct"),
                  isPulsing && matchPulseClass,
                )}
              >
                {eventPair.event}
              </div>

              <LessonMatchConnector
                matched={
                  isPulsing ||
                  isRowLocked ||
                  (isComplete && isRowMatched)
                }
                pulsing={isPulsing}
              />

              <div
                role="button"
                tabIndex={isComplete || isRowLocked ? -1 : 0}
                aria-grabbed={isDragging}
                aria-disabled={isRowLocked}
                aria-label={`Reorder: ${benefitPair.benefit}`}
                onPointerDown={(event) =>
                  handleBenefitPointerDown(event, benefitId, rowIndex)
                }
                onKeyDown={(event) => {
                  if (isCompleteRef.current || lockedRowsRef.current.has(rowIndex)) {
                    return;
                  }
                  if (event.key === "ArrowUp" && rowIndex > 0) {
                    event.preventDefault();
                    handleKeyboardMove(rowIndex, rowIndex - 1);
                  }
                  if (
                    event.key === "ArrowDown" &&
                    rowIndex < benefitOrder.length - 1
                  ) {
                    event.preventDefault();
                    handleKeyboardMove(rowIndex, rowIndex + 1);
                  }
                }}
                className={cn(
                  lessonSortRowClass,
                  !isComplete &&
                    !isRowLocked &&
                    "cursor-grab active:cursor-grabbing",
                  isRowLocked && "cursor-default opacity-100",
                  (isComplete || isRowLocked) &&
                    isRowMatched &&
                    lessonChoiceStateClass(true, "correct"),
                  isPulsing && matchPulseClass,
                  isDragging &&
                    "border-[#066B7C] bg-[#099FB8]/25 shadow-[inset_0_4px_12px_rgba(3,31,130,0.2)]",
                )}
                style={{ touchAction: isRowLocked ? "auto" : "none" }}
              >
                {benefitPair.benefit}
              </div>
            </LessonMatchRow>
          );
        })}
      </LessonCard>

      {!isComplete ? (
        <LessonGameHint>
          Drag possibilities up or down until each one lines up with its event.
          Correct matches lock in place.
        </LessonGameHint>
      ) : (
        <LessonSuccessBanner centered>All matched!</LessonSuccessBanner>
      )}
    </LessonGameBoard>
  );
}
