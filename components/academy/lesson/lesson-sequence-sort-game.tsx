"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { usePlaySeed } from "@/components/academy/lesson/hooks/use-play-seed";
import {
  lessonOptionTextClass,
  lessonSequenceBoardClass,
  lessonSequenceStepCardClass,
} from "@/components/academy/lesson/lesson-shared-styles";
import { useLessonShake } from "@/components/academy/lesson/hooks/use-lesson-screen-flow";
import {
  LessonAnswerTick,
  LessonSequenceNumberedRow,
  LessonSequenceSortBoard,
  LessonSequenceSlot,
  LessonSequenceStepCard,
  LessonSequenceStepPlaced,
} from "@/components/academy/lesson/lesson-ui";
import { OverlayPortal } from "@/components/ui/overlay-portal";
import {
  bestDropZone,
  domRectToDropRect,
  type DragBounds,
} from "@/lib/academy/lessons/drop-hit";
import { seededShuffle } from "@/lib/academy/lessons/seeded-shuffle";
import { cn } from "@/lib/utils/cn";

export type LessonSequenceItem<TStep extends string = string> = {
  id: string;
  label: string;
  emoji?: string;
  bucket: TStep;
};

export type LessonSequenceStep<TStep extends string = string> = {
  id: TStep;
  label: string;
};

type LessonSequenceSortGameProps<TStep extends string> = {
  items: readonly LessonSequenceItem<TStep>[];
  steps: readonly LessonSequenceStep<TStep>[];
  /** Screen id mixed into the pile shuffle. Numbered slots stay in order. */
  orderKey: string;
  onComplete: () => void;
  onMismatch?: () => void;
};

type DragState = {
  itemId: string;
  offsetX: number;
  offsetY: number;
  x: number;
  y: number;
  width: number;
  height: number;
};

type PendingSideEffect = { kind: "correct"; willComplete: boolean };

/** Drag steps from a shuffled pool into vertically stacked numbered slots. */
export function LessonSequenceSortGame<TStep extends string>({
  items,
  steps,
  orderKey,
  onComplete,
  onMismatch,
}: LessonSequenceSortGameProps<TStep>) {
  const itemById = useMemo(
    () => new Map(items.map((item) => [item.id, item])),
    [items],
  );

  const authoredIds = useMemo(() => items.map((item) => item.id), [items]);
  const itemSignature = authoredIds.join("\0");
  const [poolIds, setPoolIds] = useState<string[]>(() => items.map((item) => item.id));
  const playSeed = usePlaySeed([orderKey, "pile"]);
  const authoredIdsRef = useRef(authoredIds);
  authoredIdsRef.current = authoredIds;

  useLayoutEffect(() => {
    if (playSeed === null) return;
    const authored = authoredIdsRef.current;
    setPoolIds((current) => {
      if (current.length !== authored.length) return current;
      if (!authored.every((id) => current.includes(id))) return current;
      return seededShuffle(authored, playSeed);
    });
  }, [itemSignature, playSeed]);
  const [stepItems, setStepItems] = useState<Record<string, string[]>>(() =>
    Object.fromEntries(steps.map((step) => [step.id, []])),
  );
  const [dragState, setDragState] = useState<DragState | null>(null);
  const dragStateRef = useRef<DragState | null>(null);
  const [activeStepId, setActiveStepId] = useState<TStep | null>(null);
  const [lockedStepIds, setLockedStepIds] = useState<ReadonlySet<TStep>>(
    () => new Set(),
  );
  const { shakingKey, shake } = useLessonShake();

  const poolIdsRef = useRef(poolIds);
  poolIdsRef.current = poolIds;
  const stepItemsRef = useRef(stepItems);
  stepItemsRef.current = stepItems;
  const lockedStepIdsRef = useRef(lockedStepIds);
  lockedStepIdsRef.current = lockedStepIds;

  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const onMismatchRef = useRef(onMismatch);
  onMismatchRef.current = onMismatch;

  const pendingEffectsRef = useRef<PendingSideEffect[]>([]);
  const flushTimeoutRef = useRef<number | null>(null);

  const slotRefs = useRef<Partial<Record<TStep, HTMLDivElement | null>>>({});
  const chipRefs = useRef<Partial<Record<string, HTMLButtonElement | null>>>({});
  const boardRef = useRef<HTMLDivElement | null>(null);
  const captureTargetRef = useRef<HTMLElement | null>(null);
  const activePointerIdRef = useRef<number | null>(null);

  const isComplete = poolIds.length === 0;

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
    dragStateRef.current = null;
    setDragState(null);
    setActiveStepId(null);
  }, [releasePointerCapture]);

  useEffect(() => () => endDrag(), [endDrag]);

  const flushPendingEffects = useCallback(() => {
    flushTimeoutRef.current = null;
    const effects = pendingEffectsRef.current.splice(0);

    for (const effect of effects) {
      if (effect.willComplete) {
        onCompleteRef.current();
      }
    }
  }, []);

  const queueSideEffect = useCallback(
    (effect: PendingSideEffect) => {
      pendingEffectsRef.current.push(effect);
      if (flushTimeoutRef.current !== null) return;
      flushTimeoutRef.current = window.setTimeout(flushPendingEffects, 0);
    },
    [flushPendingEffects],
  );

  const resolveStepAtPoint = useCallback(
    (clientX: number, clientY: number): TStep | null => {
      const drag = dragStateRef.current;
      const bounds: DragBounds | null = drag
        ? { x: drag.x, y: drag.y, width: drag.width, height: drag.height }
        : null;
      const zones = steps.flatMap((step) => {
        const node = slotRefs.current[step.id];
        if (!node) return [];
        return [{ id: step.id, rect: domRectToDropRect(node.getBoundingClientRect()) }];
      });
      return bestDropZone(zones, bounds, clientX, clientY);
    },
    [steps],
  );

  const assignToStep = useCallback(
    (itemId: string, stepId: TStep) => {
      const item = itemById.get(itemId);
      if (!item) return;

      if (lockedStepIdsRef.current.has(stepId)) {
        return;
      }

      const currentPool = poolIdsRef.current;
      if (!currentPool.includes(itemId)) return;

      const occupied = stepItemsRef.current[stepId] ?? [];
      if (occupied.length > 0) {
        return;
      }

      if (item.bucket !== stepId) {
        shake(itemId);
        onMismatchRef.current?.();
        return;
      }

      const nextPool = currentPool.filter((id) => id !== itemId);
      poolIdsRef.current = nextPool;

      setPoolIds(nextPool);
      setStepItems((current) => {
        const placed = current[stepId] ?? [];
        if (placed.includes(itemId)) return current;
        return {
          ...current,
          [stepId]: [...placed, itemId],
        };
      });

      setLockedStepIds((current) => new Set(current).add(stepId));
      queueSideEffect({ kind: "correct", willComplete: nextPool.length === 0 });
    },
    [itemById, queueSideEffect, shake],
  );

  const handleChipPointerDown = (
    itemId: string,
    event: ReactPointerEvent<HTMLButtonElement>,
  ) => {
    if (isComplete) return;
    const chip = chipRefs.current[itemId];
    if (!chip) return;

    event.preventDefault();
    event.stopPropagation();

    const rect = chip.getBoundingClientRect();
    const captureTarget = boardRef.current ?? event.currentTarget;
    captureTargetRef.current = captureTarget;
    activePointerIdRef.current = event.pointerId;
    captureTarget.setPointerCapture(event.pointerId);
    const nextDrag: DragState = {
      itemId,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height,
    };
    dragStateRef.current = nextDrag;
    setDragState(nextDrag);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    if (!dragState || activePointerIdRef.current !== event.pointerId) return;
    const current = dragStateRef.current;
    if (!current) return;
    const moved: DragState = {
      ...current,
      x: event.clientX - current.offsetX,
      y: event.clientY - current.offsetY,
    };
    dragStateRef.current = moved;
    setDragState(moved);
    setActiveStepId(resolveStepAtPoint(event.clientX, event.clientY));
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLElement>) => {
    if (activePointerIdRef.current !== event.pointerId) return;

    if (!dragState) {
      endDrag();
      return;
    }

    const stepId = resolveStepAtPoint(event.clientX, event.clientY);
    if (stepId) {
      assignToStep(dragState.itemId, stepId);
    }

    endDrag();
  };

  const handlePointerCancel = () => {
    endDrag();
  };

  const draggedItem = dragState ? itemById.get(dragState.itemId) : null;

  const destinationRows = steps.map((step, rowIndex) => {
    const placedIds = stepItems[step.id] ?? [];
    const placedItem = placedIds[0] ? itemById.get(placedIds[0]) : null;
    const isFilled = placedIds.length > 0;

    return (
      <LessonSequenceNumberedRow key={step.id} stepNumber={rowIndex + 1}>
        <LessonSequenceSlot
          ref={(node) => {
            slotRefs.current[step.id] = node;
          }}
          stepLabel={step.label}
          active={activeStepId === step.id}
          locked={lockedStepIds.has(step.id)}
          isEmpty={!isFilled}
        >
          {placedItem ? (
            <LessonSequenceStepPlaced label={placedItem.label} />
          ) : null}
        </LessonSequenceSlot>
      </LessonSequenceNumberedRow>
    );
  });

  return (
    <div
      ref={boardRef}
      className={lessonSequenceBoardClass}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
    >
      <LessonSequenceSortBoard
        poolComplete={isComplete}
        pool={poolIds.map((itemId) => {
          const item = itemById.get(itemId);
          if (!item) return null;

          return (
            <LessonSequenceStepCard
              key={itemId}
              ref={(node) => {
                chipRefs.current[itemId] = node;
              }}
              label={item.label}
              isDragging={dragState?.itemId === itemId}
              className={shakingKey === itemId ? "lesson-tile-shake" : undefined}
              onPointerDown={(event) => handleChipPointerDown(itemId, event)}
            />
          );
        })}
        destination={destinationRows}
      />
      {isComplete ? (
        <div className="mt-3 flex justify-center">
          <LessonAnswerTick />
        </div>
      ) : null}

      {draggedItem && dragState ? (
        <OverlayPortal className="overflow-visible">
          <div
            className={cn(
              lessonSequenceStepCardClass,
              "pointer-events-none fixed",
            )}
            style={{
              left: dragState.x,
              top: dragState.y,
              width: dragState.width,
              minHeight: dragState.height,
            }}
          >
            <span className={cn(lessonOptionTextClass, "w-full text-left")}>
              {draggedItem.label}
            </span>
          </div>
        </OverlayPortal>
      ) : null}
    </div>
  );
}
