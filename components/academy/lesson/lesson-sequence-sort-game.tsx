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
  lessonOptionTextClass,
  lessonSequenceBoardClass,
  lessonSequenceStepCardClass,
} from "@/components/academy/lesson/lesson-shared-styles";
import {
  LessonSequenceNumberedRow,
  LessonSequenceSortBoard,
  LessonSequenceSlot,
  LessonSequenceStepCard,
  LessonSequenceStepPlaced,
} from "@/components/academy/lesson/lesson-ui";
import { OverlayPortal } from "@/components/ui/overlay-portal";
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
  onComplete: () => void;
  onMistake: () => void;
  onSuccess?: () => void;
  onWrongDrop?: (itemId: string, stepId: TStep) => void;
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

type PendingSideEffect<TStep extends string> =
  | { kind: "wrong"; itemId: string; stepId: TStep }
  | { kind: "correct"; willComplete: boolean };

const BUCKET_DROP_HIT_PADDING_PX = 20;

function shuffleIds(ids: readonly string[]): string[] {
  const next = [...ids];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j]!, next[i]!];
  }
  return next;
}

/** Drag steps from a shuffled pool into vertically stacked numbered slots. */
export function LessonSequenceSortGame<TStep extends string>({
  items,
  steps,
  onComplete,
  onMistake,
  onSuccess,
  onWrongDrop,
}: LessonSequenceSortGameProps<TStep>) {
  const itemById = useMemo(
    () => new Map(items.map((item) => [item.id, item])),
    [items],
  );

  const [poolIds, setPoolIds] = useState<string[]>(() =>
    shuffleIds(items.map((item) => item.id)),
  );
  const [stepItems, setStepItems] = useState<Record<string, string[]>>(() =>
    Object.fromEntries(steps.map((step) => [step.id, []])),
  );
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [activeStepId, setActiveStepId] = useState<TStep | null>(null);
  const [errorStepId, setErrorStepId] = useState<TStep | null>(null);
  const [lockedStepIds, setLockedStepIds] = useState<ReadonlySet<TStep>>(
    () => new Set(),
  );

  const poolIdsRef = useRef(poolIds);
  poolIdsRef.current = poolIds;
  const stepItemsRef = useRef(stepItems);
  stepItemsRef.current = stepItems;
  const lockedStepIdsRef = useRef(lockedStepIds);
  lockedStepIdsRef.current = lockedStepIds;

  const onCompleteRef = useRef(onComplete);
  const onMistakeRef = useRef(onMistake);
  const onSuccessRef = useRef(onSuccess);
  const onWrongDropRef = useRef(onWrongDrop);
  onCompleteRef.current = onComplete;
  onMistakeRef.current = onMistake;
  onSuccessRef.current = onSuccess;
  onWrongDropRef.current = onWrongDrop;

  const pendingEffectsRef = useRef<PendingSideEffect<TStep>[]>([]);
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
    setDragState(null);
    setActiveStepId(null);
  }, [releasePointerCapture]);

  useEffect(() => () => endDrag(), [endDrag]);

  const flushPendingEffects = useCallback(() => {
    flushTimeoutRef.current = null;
    const effects = pendingEffectsRef.current.splice(0);

    for (const effect of effects) {
      if (effect.kind === "wrong") {
        onMistakeRef.current();
        onWrongDropRef.current?.(effect.itemId, effect.stepId);
        continue;
      }

      onSuccessRef.current?.();
      if (effect.willComplete) {
        onCompleteRef.current();
      }
    }
  }, []);

  const queueSideEffect = useCallback(
    (effect: PendingSideEffect<TStep>) => {
      pendingEffectsRef.current.push(effect);
      if (flushTimeoutRef.current !== null) return;
      flushTimeoutRef.current = window.setTimeout(flushPendingEffects, 0);
    },
    [flushPendingEffects],
  );

  const resolveStepAtPoint = useCallback(
    (clientX: number, clientY: number): TStep | null => {
      for (const step of steps) {
        const node = slotRefs.current[step.id];
        if (!node) continue;
        const rect = node.getBoundingClientRect();
        const pad = BUCKET_DROP_HIT_PADDING_PX;
        if (
          clientX >= rect.left - pad &&
          clientX <= rect.right + pad &&
          clientY >= rect.top - pad &&
          clientY <= rect.bottom + pad
        ) {
          return step.id;
        }
      }
      return null;
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
        setErrorStepId(stepId);
        window.setTimeout(() => setErrorStepId(null), 500);
        queueSideEffect({ kind: "wrong", itemId, stepId });
        return;
      }

      if (item.bucket !== stepId) {
        setErrorStepId(stepId);
        window.setTimeout(() => setErrorStepId(null), 500);
        queueSideEffect({ kind: "wrong", itemId, stepId });
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
    [itemById, queueSideEffect],
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
    setDragState({
      itemId,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height,
    });
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLElement>) => {
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
          error={errorStepId === step.id}
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
        poolClassName={poolIds.length > 2 ? "max-h-[26vh]" : undefined}
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
              onPointerDown={(event) => handleChipPointerDown(itemId, event)}
            />
          );
        })}
        destination={destinationRows}
      />

      {draggedItem && dragState ? (
        <OverlayPortal className="overflow-visible">
          <div
            className={cn(
              lessonSequenceStepCardClass,
              "pointer-events-none fixed shadow-lg ring-2 ring-[#0CC1E0]/40",
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
