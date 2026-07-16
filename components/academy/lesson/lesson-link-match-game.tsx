"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { lessonCardClass } from "@/components/academy/lesson/academy-lesson-shell";
import {
  lessonChoiceBaseClass,
  lessonChoiceStateClass,
  lessonSortChipClass,
  lessonSuccessMessageClass,
} from "@/components/academy/lesson/lesson-shared-styles";
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
  onCompleteRef.current = onComplete;
  onSuccessRef.current = onSuccess;

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
    return () => {
      releasePointerCapture();
      for (const timeoutId of Object.values(pulseTimeoutsRef.current)) {
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
    endDrag();
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
      evaluateMatches(benefitOrderRef.current);
    });
  };

  const matchPulseClass =
    "ring-4 ring-[#22C55E]/70 border-[#16A34A] shadow-[0_0_0_4px_rgba(34,197,94,0.28)]";

  return (
    <div className="mt-5 space-y-4">
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-end gap-x-2 gap-y-1 px-0.5">
        <p className="font-heading text-[10px] font-bold uppercase tracking-wide text-[#0CC1E0]">
          {eventColumnLabel}
        </p>
        <span className="w-4" aria-hidden />
        <p className="font-heading text-[10px] font-bold uppercase tracking-wide text-[#0CC1E0]">
          {benefitColumnLabel}
        </p>
      </div>

      <div
        ref={boardRef}
        className={cn(lessonCardClass, "space-y-2 p-3 sm:p-4")}
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
            <div
              key={`match-row-${rowIndex}`}
              ref={(node) => {
                rowRefs.current[rowIndex] = node;
              }}
              className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-x-2"
            >
              <div
                className={cn(
                  lessonChoiceBaseClass,
                  "cursor-default rounded-2xl py-3 text-sm shadow-none active:translate-y-0 active:border-b-4",
                  (isComplete || isRowLocked) &&
                    isRowMatched &&
                    lessonChoiceStateClass(true, "correct"),
                  isPulsing && matchPulseClass,
                )}
              >
                {eventPair.event}
              </div>

              <div
                className={cn(
                  "h-px w-4 shrink-0 rounded-full",
                  isPulsing || isRowLocked || (isComplete && isRowMatched)
                    ? "bg-[#16A34A]"
                    : "bg-[#0CC1E0]",
                )}
                aria-hidden
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
                  lessonSortChipClass,
                  "w-full touch-none rounded-2xl py-3 text-sm select-none",
                  !isComplete &&
                    !isRowLocked &&
                    "cursor-grab active:cursor-grabbing",
                  isRowLocked && "cursor-default opacity-100",
                  (isComplete || isRowLocked) &&
                    isRowMatched &&
                    lessonChoiceStateClass(true, "correct"),
                  isPulsing && matchPulseClass,
                  isDragging && "z-raised scale-[1.02] opacity-90 shadow-md",
                )}
                style={{ touchAction: isRowLocked ? "auto" : "none" }}
              >
                {benefitPair.benefit}
              </div>
            </div>
          );
        })}
      </div>

      {!isComplete ? (
        <p className="text-center font-sans text-xs text-[#1E3A5F]/75">
          Drag possibilities up or down until each one lines up with its event.
          Correct matches lock in place.
        </p>
      ) : (
        <p className={cn(lessonSuccessMessageClass, "text-center")}>All matched!</p>
      )}
    </div>
  );
}
