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
import { OverlayPortal } from "@/components/ui/overlay-portal";
import {
  lessonSortBucketActiveClass,
  lessonSortBucketClass,
  lessonSortBucketErrorClass,
  lessonSortChipClass,
} from "@/components/academy/lesson/lesson-shared-styles";
import { cn } from "@/lib/utils/cn";

export type LessonSortItem<TBucket extends string> = {
  id: string;
  emoji?: string;
  label: string;
  bucket: TBucket;
  price?: number;
};

export type LessonSortBucket<TBucket extends string> = {
  id: TBucket;
  label: string;
};

type LessonBucketSortGameProps<TBucket extends string> = {
  items: readonly LessonSortItem<TBucket>[];
  buckets: readonly LessonSortBucket<TBucket>[];
  onComplete: () => void;
  onMistake: () => void;
  onSuccess?: () => void;
  /** Optional hook for cohort-specific wrong-bucket feedback copy. */
  onWrongDrop?: (itemId: string, bucketId: TBucket) => void;
  layout?: "default" | "spent-total" | "steps-row";
  targetTotal?: number;
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

type PendingSideEffect<TBucket extends string> =
  | { kind: "wrong"; itemId: string; bucketId: TBucket }
  | { kind: "correct"; willComplete: boolean };

function triggerErrorVibration(): void {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(120);
  }
}

function formatDollars(amount: number): string {
  return `$${amount}`;
}

export function LessonBucketSortGame<TBucket extends string>({
  items,
  buckets,
  onComplete,
  onMistake,
  onSuccess,
  onWrongDrop,
  layout = "default",
  targetTotal,
}: LessonBucketSortGameProps<TBucket>) {
  const isSpentTotalLayout = layout === "spent-total";
  const isStepsRowLayout = layout === "steps-row";

  const itemById = useMemo(
    () => new Map(items.map((item) => [item.id, item])),
    [items],
  );

  const [poolIds, setPoolIds] = useState<string[]>(() => items.map((item) => item.id));
  const [bucketItems, setBucketItems] = useState<Record<string, string[]>>(() =>
    Object.fromEntries(buckets.map((bucket) => [bucket.id, []])),
  );
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [activeBucketId, setActiveBucketId] = useState<TBucket | null>(null);
  const [errorBucketId, setErrorBucketId] = useState<TBucket | null>(null);

  const poolIdsRef = useRef(poolIds);
  poolIdsRef.current = poolIds;

  const onCompleteRef = useRef(onComplete);
  const onMistakeRef = useRef(onMistake);
  const onSuccessRef = useRef(onSuccess);
  const onWrongDropRef = useRef(onWrongDrop);
  onCompleteRef.current = onComplete;
  onMistakeRef.current = onMistake;
  onSuccessRef.current = onSuccess;
  onWrongDropRef.current = onWrongDrop;

  const pendingEffectsRef = useRef<PendingSideEffect<TBucket>[]>([]);
  const flushTimeoutRef = useRef<number | null>(null);

  const bucketRefs = useRef<Partial<Record<TBucket, HTMLDivElement | null>>>({});
  const chipRefs = useRef<Partial<Record<string, HTMLButtonElement | null>>>({});
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
    setActiveBucketId(null);
  }, [releasePointerCapture]);

  useEffect(() => () => endDrag(), [endDrag]);

  const totalSpent = useMemo(() => {
    return Object.values(bucketItems)
      .flat()
      .reduce((sum, itemId) => sum + (itemById.get(itemId)?.price ?? 0), 0);
  }, [bucketItems, itemById]);

  const flushPendingEffects = useCallback(() => {
    flushTimeoutRef.current = null;
    const effects = pendingEffectsRef.current.splice(0);

    for (const effect of effects) {
      if (effect.kind === "wrong") {
        onMistakeRef.current();
        onWrongDropRef.current?.(effect.itemId, effect.bucketId);
        continue;
      }

      onSuccessRef.current?.();
      if (effect.willComplete) {
        onCompleteRef.current();
      }
    }
  }, []);

  const queueSideEffect = useCallback(
    (effect: PendingSideEffect<TBucket>) => {
      pendingEffectsRef.current.push(effect);
      if (flushTimeoutRef.current !== null) return;
      flushTimeoutRef.current = window.setTimeout(flushPendingEffects, 0);
    },
    [flushPendingEffects],
  );

  const resolveBucketAtPoint = useCallback(
    (clientX: number, clientY: number): TBucket | null => {
      for (const bucket of buckets) {
        const node = bucketRefs.current[bucket.id];
        if (!node) continue;
        const rect = node.getBoundingClientRect();
        if (
          clientX >= rect.left &&
          clientX <= rect.right &&
          clientY >= rect.top &&
          clientY <= rect.bottom
        ) {
          return bucket.id;
        }
      }
      return null;
    },
    [buckets],
  );

  const assignToBucket = useCallback(
    (itemId: string, bucketId: TBucket) => {
      const item = itemById.get(itemId);
      if (!item) return;

      const currentPool = poolIdsRef.current;
      if (!currentPool.includes(itemId)) return;

      if (item.bucket !== bucketId) {
        setErrorBucketId(bucketId);
        window.setTimeout(() => setErrorBucketId(null), 500);
        triggerErrorVibration();
        queueSideEffect({ kind: "wrong", itemId, bucketId });
        return;
      }

      const nextPool = currentPool.filter((id) => id !== itemId);
      poolIdsRef.current = nextPool;

      setPoolIds(nextPool);
      setBucketItems((bucketCurrent) => {
        const placed = bucketCurrent[bucketId] ?? [];
        if (placed.includes(itemId)) return bucketCurrent;
        return {
          ...bucketCurrent,
          [bucketId]: [...placed, itemId],
        };
      });

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

    const rect = chip.getBoundingClientRect();
    captureTargetRef.current = event.currentTarget;
    activePointerIdRef.current = event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);
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
    if (!dragState) return;
    setDragState((current) =>
      current
        ? {
            ...current,
            x: event.clientX - current.offsetX,
            y: event.clientY - current.offsetY,
          }
        : null,
    );
    setActiveBucketId(resolveBucketAtPoint(event.clientX, event.clientY));
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLElement>) => {
    if (!dragState) {
      endDrag();
      return;
    }

    const bucketId = resolveBucketAtPoint(event.clientX, event.clientY);
    if (bucketId) {
      assignToBucket(dragState.itemId, bucketId);
    }

    endDrag();
  };

  const handlePointerCancel = () => {
    endDrag();
  };

  const draggedItem = dragState ? itemById.get(dragState.itemId) : null;

  const renderPoolChip = (itemId: string, stacked = false) => {
    const item = itemById.get(itemId);
    if (!item) return null;
    const isDragging = dragState?.itemId === itemId;

    return (
      <button
        key={itemId}
        ref={(node) => {
          chipRefs.current[itemId] = node;
        }}
        type="button"
        onPointerDown={(event) => handleChipPointerDown(itemId, event)}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onLostPointerCapture={handlePointerCancel}
        className={cn(
          lessonSortChipClass,
          stacked ? "w-full text-left" : "min-w-[7rem] max-w-full flex-1",
          isDragging && "opacity-30",
        )}
        style={{ touchAction: "none" }}
      >
        <span
          className={cn(
            "flex items-center gap-2",
            stacked ? "justify-between" : "flex-col",
          )}
        >
          <span className={cn("flex items-center gap-2", !stacked && "flex-col")}>
            {item.emoji ? (
              <span className="text-xl leading-none" aria-hidden>
                {item.emoji}
              </span>
            ) : null}
            <span className={cn("leading-snug", stacked && "text-sm")}>
              {item.label}
            </span>
          </span>
          {item.price !== undefined ? (
            <span
              className={cn(
                "font-heading font-extrabold text-[#0CC1E0]",
                stacked ? "text-sm" : "mt-1 block text-xs",
              )}
            >
              {formatDollars(item.price)}
            </span>
          ) : null}
        </span>
      </button>
    );
  };

  const renderPlacedItem = (itemId: string) => {
    const item = itemById.get(itemId);
    if (!item) return null;
    return (
      <div
        key={itemId}
        className={cn(
          "rounded-xl border border-[#BDE9FB]/80 bg-white px-2 py-2 font-heading font-bold text-[#031F82] shadow-sm",
          isStepsRowLayout ? "text-[9px] leading-snug sm:text-[10px]" : "text-[10px]",
        )}
      >
        <span className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5">
            {item.emoji ? (
              <span aria-hidden>{item.emoji}</span>
            ) : null}
            <span>{item.label}</span>
          </span>
          {item.price !== undefined ? (
            <span className="text-[#0CC1E0]">{formatDollars(item.price)}</span>
          ) : null}
        </span>
      </div>
    );
  };

  const renderBucket = (bucket: LessonSortBucket<TBucket>) => {
    const placedIds = bucketItems[bucket.id] ?? [];
    return (
      <div
        key={bucket.id}
        ref={(node) => {
          bucketRefs.current[bucket.id] = node;
        }}
        className={cn(
          lessonSortBucketClass,
          isSpentTotalLayout && "min-h-[10rem] flex-1",
          isStepsRowLayout && "min-h-[8.5rem] min-w-0",
          activeBucketId === bucket.id && lessonSortBucketActiveClass,
          errorBucketId === bucket.id && lessonSortBucketErrorClass,
        )}
      >
        <p className="font-heading text-[10px] font-bold uppercase tracking-wide text-[#031F82]">
          {bucket.label}
        </p>
        <div className="mt-2 space-y-2">
          {placedIds.map((itemId) => renderPlacedItem(itemId))}
          {placedIds.length === 0 ? (
            <p className="py-6 text-center font-sans text-[11px] text-[#1E3A5F]/50">
              Drop items here
            </p>
          ) : null}
        </div>
      </div>
    );
  };

  if (isSpentTotalLayout) {
    const primaryBucket = buckets[0];
    if (!primaryBucket) return null;

    return (
      <div
        className="mt-5 grid grid-cols-2 gap-3"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div className={cn(lessonCardClass, "flex min-h-[14rem] flex-col gap-2")}>
          <p className="font-heading text-[10px] font-bold uppercase tracking-wide text-[#0CC1E0]">
            Mia&apos;s purchases
          </p>
          {poolIds.length > 0 ? (
            <div className="flex flex-1 flex-col gap-2">
              {poolIds.map((itemId) => renderPoolChip(itemId, true))}
            </div>
          ) : (
            <p className="flex flex-1 items-center justify-center text-center font-heading text-sm font-bold text-[#22C55E]">
              All sorted!
            </p>
          )}
        </div>

        <div className="flex min-h-[14rem] flex-col gap-2">
          <div className="rounded-xl bg-[#031F82] px-3 py-2.5 text-center">
            <p
              className={cn(
                "font-heading text-sm font-extrabold tabular-nums",
                targetTotal !== undefined && totalSpent >= targetTotal
                  ? "text-[#22C55E]"
                  : "text-white",
              )}
              aria-live="polite"
            >
              Total Amount Spent: {formatDollars(totalSpent)}
            </p>
          </div>
          {renderBucket(primaryBucket)}
        </div>

        {draggedItem && dragState ? (
          <OverlayPortal className="overflow-visible">
            <div
              className={cn(
                lessonSortChipClass,
                "pointer-events-none fixed w-[10rem] shadow-lg",
              )}
              style={{
                left: dragState.x,
                top: dragState.y,
                width: dragState.width,
              }}
            >
              {draggedItem.emoji ? (
                <span className="block text-xl" aria-hidden>
                  {draggedItem.emoji}
                </span>
              ) : null}
              <span className="mt-1 block leading-snug">{draggedItem.label}</span>
            </div>
          </OverlayPortal>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className="mt-5 space-y-4"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
    >
      <div className={cn(lessonCardClass, "space-y-2")}>
        <p className="font-heading text-[10px] font-bold uppercase tracking-wide text-[#0CC1E0]">
          Drag each item into a bucket
        </p>
        {poolIds.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {poolIds.map((itemId) => renderPoolChip(itemId))}
          </div>
        ) : (
          <p className="text-center font-heading text-sm font-bold text-[#22C55E]">
            All sorted!
          </p>
        )}
      </div>

      <div className={cn(isStepsRowLayout ? "grid grid-cols-3 gap-2" : "grid grid-cols-2 gap-3")}>
        {buckets.map((bucket) => renderBucket(bucket))}
      </div>

      {draggedItem && dragState ? (
        <OverlayPortal className="overflow-visible">
          <div
            className={cn(
              lessonSortChipClass,
              "pointer-events-none fixed min-w-[7rem] max-w-[10rem] shadow-lg",
            )}
            style={{
              left: dragState.x,
              top: dragState.y,
              width: dragState.width,
            }}
          >
            {draggedItem.emoji ? (
              <span className="block text-xl" aria-hidden>
                {draggedItem.emoji}
              </span>
            ) : null}
            <span className="mt-1 block leading-snug">{draggedItem.label}</span>
          </div>
        </OverlayPortal>
      ) : null}
    </div>
  );
}
