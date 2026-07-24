"use client";

import {
  Fragment,
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
  lessonIconLabelClass,
  lessonSortBucketActiveClass,
  lessonSortBucketClass,
  lessonSortBucketErrorClass,
  lessonSortCircleChipClass,
  lessonSortGridCellClass,
  lessonSortGridPlaceholderClass,
  lessonSortRowClass,
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
  layout?: "default" | "spent-total" | "steps-row" | "stable-grid";
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

function formatDollars(amount: number): string {
  return `$${amount}`;
}

function shuffleIds(ids: readonly string[]): string[] {
  const next = [...ids];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j]!, next[i]!];
  }
  return next;
}

/** Steps-row — content-height boxes; no inherited min-heights from sort defaults. */
const stepsRowRowClass = "h-full w-full min-w-0";
const stepsRowTextClass = "text-[11px] leading-tight sm:text-xs sm:leading-snug";
const stepsRowChipBaseClass =
  "cursor-grab touch-none select-none rounded-lg border-2 border-b-2 border-[#BDE9FB] bg-white font-heading font-bold text-[#031F82] transition-shadow active:cursor-grabbing active:translate-y-px";
const stepsRowChipClass = "px-3.5 py-2 shadow-none";
const stepsRowBucketBaseClass =
  "rounded-lg border-2 border-dashed border-[#BDE9FB]/80 bg-[#F7FBFF]/80 transition-colors";
const stepsRowBucketClass =
  "relative flex h-full w-full min-h-0 flex-col p-2.5";

/** Extra pixels around bucket bounds so drops register more easily on touch devices. */
const BUCKET_DROP_HIT_PADDING_PX = 20;

export function LessonBucketSortGame<TBucket extends string>({
  items,
  buckets,
  onComplete,
  onMistake,
  onSuccess,
  onWrongDrop,
  layout = "stable-grid",
  targetTotal,
}: LessonBucketSortGameProps<TBucket>) {
  const isSpentTotalLayout = layout === "spent-total";
  const isStepsRowLayout = layout === "steps-row";
  const isStableGridLayout = layout === "stable-grid";

  const itemById = useMemo(
    () => new Map(items.map((item) => [item.id, item])),
    [items],
  );

  const [poolIds, setPoolIds] = useState<string[]>(() => {
    const ids = items.map((item) => item.id);
    return isSpentTotalLayout || isStableGridLayout ? ids : shuffleIds(ids);
  });
  const [gridSlotOrder] = useState<string[]>(() => {
    const ids = items.map((item) => item.id);
    return isStableGridLayout ? shuffleIds(ids) : [];
  });
  const [bucketItems, setBucketItems] = useState<Record<string, string[]>>(() =>
    Object.fromEntries(buckets.map((bucket) => [bucket.id, []])),
  );
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [activeBucketId, setActiveBucketId] = useState<TBucket | null>(null);
  const [errorBucketId, setErrorBucketId] = useState<TBucket | null>(null);
  const [lockedBucketIds, setLockedBucketIds] = useState<ReadonlySet<TBucket>>(
    () => new Set(),
  );

  const poolIdsRef = useRef(poolIds);
  poolIdsRef.current = poolIds;
  const bucketItemsRef = useRef(bucketItems);
  bucketItemsRef.current = bucketItems;
  const lockedBucketIdsRef = useRef(lockedBucketIds);
  lockedBucketIdsRef.current = lockedBucketIds;

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
        const pad = BUCKET_DROP_HIT_PADDING_PX;
        if (
          clientX >= rect.left - pad &&
          clientX <= rect.right + pad &&
          clientY >= rect.top - pad &&
          clientY <= rect.bottom + pad
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

      if (isStepsRowLayout && lockedBucketIdsRef.current.has(bucketId)) {
        return;
      }

      const currentPool = poolIdsRef.current;
      if (!currentPool.includes(itemId)) return;

      const occupiedStep = bucketItemsRef.current[bucketId] ?? [];
      if (isStepsRowLayout && occupiedStep.length > 0) {
        setErrorBucketId(bucketId);
        window.setTimeout(() => setErrorBucketId(null), 500);
        queueSideEffect({ kind: "wrong", itemId, bucketId });
        return;
      }

      if (item.bucket !== bucketId) {
        setErrorBucketId(bucketId);
        window.setTimeout(() => setErrorBucketId(null), 500);
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

      if (isStepsRowLayout) {
        setLockedBucketIds((current) => new Set(current).add(bucketId));
      }

      queueSideEffect({ kind: "correct", willComplete: nextPool.length === 0 });
    },
    [isStepsRowLayout, itemById, queueSideEffect],
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
    setActiveBucketId(resolveBucketAtPoint(event.clientX, event.clientY));
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLElement>) => {
    if (activePointerIdRef.current !== event.pointerId) return;

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
        className={cn(
          stacked ? "w-full text-left" : "w-full min-w-[8rem] max-w-full",
          isStepsRowLayout && stacked
            ? cn(
                stepsRowChipBaseClass,
                stepsRowTextClass,
                stepsRowChipClass,
                "flex h-full w-full items-center text-left",
              )
            : lessonSortRowClass,
          isDragging && "opacity-30",
        )}
        style={{ touchAction: "none" }}
      >
        <span
          className={cn(
            "flex w-full items-center gap-2",
            stacked ? "justify-between" : "justify-start",
          )}
        >
          <span className="flex min-w-0 flex-1 items-center gap-2 justify-start text-left">
            {item.emoji ? (
              <span className="shrink-0 text-xl leading-none" aria-hidden>
                {item.emoji}
              </span>
            ) : null}
            <span
              className={cn(
                "text-left",
                stacked && !isStepsRowLayout && "text-sm leading-snug",
              )}
            >
              {item.label}
            </span>
          </span>
          {item.price !== undefined ? (
            <span
              className={cn(
                "shrink-0 font-heading font-extrabold text-[#0CC1E0]",
                stacked ? "text-sm" : "text-sm",
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
          isStepsRowLayout
            ? cn(
                stepsRowTextClass,
                stepsRowChipClass,
                "flex h-full w-full items-center rounded-lg border border-[#BDE9FB]/80 bg-white font-heading font-bold text-[#031F82]",
              )
            : "rounded-xl border border-[#BDE9FB]/80 bg-white px-2 py-2 font-heading font-bold text-[#031F82] shadow-sm text-[10px]",
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

  const renderBucket = (
    bucket: LessonSortBucket<TBucket>,
    stepIndex?: number,
  ) => {
    const placedIds = bucketItems[bucket.id] ?? [];
    const isLocked = isStepsRowLayout && lockedBucketIds.has(bucket.id);
    return (
      <div
        key={bucket.id}
        ref={(node) => {
          bucketRefs.current[bucket.id] = node;
        }}
        className={cn(
          !isStepsRowLayout && lessonSortBucketClass,
          isStableGridLayout && "min-h-[9rem]",
          isSpentTotalLayout && "min-h-[10rem] flex-1",
          isStepsRowLayout &&
            cn(
              stepsRowBucketBaseClass,
              stepsRowBucketClass,
            ),
          activeBucketId === bucket.id && lessonSortBucketActiveClass,
          errorBucketId === bucket.id && lessonSortBucketErrorClass,
          isLocked && "border-[#16A34A] bg-[#DCFCE7]/35",
        )}
      >
        {isStepsRowLayout && stepIndex !== undefined ? (
          <span
            className="absolute left-1 top-1 z-raised flex h-4 w-4 items-center justify-center rounded-full bg-[#031F82] font-heading text-[9px] font-bold leading-none text-white"
            aria-label={bucket.label}
          >
            {stepIndex + 1}
          </span>
        ) : (
          <p
            className={cn(
              "font-heading font-bold uppercase tracking-wide text-[#031F82]",
              isStableGridLayout ? "text-sm" : "text-xs",
            )}
          >
            {bucket.label}
          </p>
        )}
        <div
          className={cn(
            isStepsRowLayout ? "flex flex-col justify-center" : "mt-2 space-y-2",
          )}
        >
          {placedIds.map((itemId) => renderPlacedItem(itemId))}
          {placedIds.length === 0 ? (
            <p
              className={cn(
                "text-center font-sans text-[#1E3A5F]/50",
                isStepsRowLayout
                  ? "text-[10px] leading-tight"
                  : "py-3 text-[11px]",
              )}
            >
              {isStepsRowLayout ? "Drop here" : "Drop items here"}
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
        ref={boardRef}
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
                lessonSortRowClass,
                "pointer-events-none fixed w-[10rem] text-left shadow-lg",
              )}
              style={{
                left: dragState.x,
                top: dragState.y,
                width: dragState.width,
              }}
            >
              <span className="flex w-full items-center gap-2 justify-start text-left">
                {draggedItem.emoji ? (
                  <span className="shrink-0 text-xl" aria-hidden>
                    {draggedItem.emoji}
                  </span>
                ) : null}
                <span className="leading-snug">{draggedItem.label}</span>
              </span>
            </div>
          </OverlayPortal>
        ) : null}
      </div>
    );
  }

  if (isStepsRowLayout) {
    const rowCount = buckets.length;

    return (
      <div
        ref={boardRef}
        className="flex min-h-0 flex-1 flex-col"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
      >
        <div className={cn(lessonCardClass, "flex min-h-0 flex-1 flex-col p-4")}>
          <div
            className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-stretch gap-x-3 gap-y-2"
            style={{
              gridTemplateRows: `repeat(${rowCount}, minmax(0, 1fr))`,
            }}
          >
            {poolIds.length === 0 ? (
              <div
                className="col-start-1 row-start-1 flex items-center justify-center rounded-xl border border-dashed border-[#BDE9FB]/60 bg-[#F7FBFF]/50"
                style={{ gridRow: `1 / span ${rowCount}` }}
              >
                <p className="text-center font-heading text-xs font-bold text-[#22C55E]">
                  All sorted!
                </p>
              </div>
            ) : null}

            {buckets.map((bucket, rowIndex) => (
              <Fragment key={bucket.id}>
                {poolIds.length > 0 ? (
                  <div className={stepsRowRowClass}>
                    {poolIds[rowIndex] ? (
                      renderPoolChip(poolIds[rowIndex]!, true)
                    ) : (
                      <div className="h-full w-full min-w-0" aria-hidden />
                    )}
                  </div>
                ) : null}
                <div className={stepsRowRowClass}>{renderBucket(bucket, rowIndex)}</div>
              </Fragment>
            ))}
          </div>
        </div>

        {draggedItem && dragState ? (
          <OverlayPortal className="overflow-visible">
            <div
              className={cn(
                lessonSortRowClass,
                stepsRowTextClass,
                stepsRowChipClass,
                "pointer-events-none fixed w-[10rem] text-left shadow-lg",
              )}
              style={{
                left: dragState.x,
                top: dragState.y,
                width: dragState.width,
              }}
            >
              <span className="flex w-full items-center gap-2 justify-start text-left">
                {draggedItem.emoji ? (
                  <span className="shrink-0 text-xl" aria-hidden>
                    {draggedItem.emoji}
                  </span>
                ) : null}
                <span className="leading-snug">{draggedItem.label}</span>
              </span>
            </div>
          </OverlayPortal>
        ) : null}
      </div>
    );
  }

  const renderStableGridChip = (itemId: string) => {
    const item = itemById.get(itemId);
    if (!item) return null;
    const isDragging = dragState?.itemId === itemId;
    const inPool = poolIds.includes(itemId);

    if (!inPool) {
      return (
        <>
          <div className={lessonSortGridPlaceholderClass} aria-hidden />
          <span className={cn(lessonIconLabelClass, "invisible")} aria-hidden>
            {item.label}
          </span>
        </>
      );
    }

    return (
      <>
        <button
          ref={(node) => {
            chipRefs.current[itemId] = node;
          }}
          type="button"
          aria-label={item.label}
          onPointerDown={(event) => handleChipPointerDown(itemId, event)}
          className={cn(lessonSortCircleChipClass, isDragging && "opacity-40")}
          style={{ touchAction: "none" }}
        >
          {item.emoji ? (
            <span className="text-4xl leading-none sm:text-5xl" aria-hidden>
              {item.emoji}
            </span>
          ) : (
            <span className="px-2 text-sm leading-tight">{item.label}</span>
          )}
        </button>
        <span className={lessonIconLabelClass}>{item.label}</span>
      </>
    );
  };

  if (isStableGridLayout) {
    return (
      <div
        ref={boardRef}
        className="mt-5 space-y-4"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
      >
        <div className="grid grid-cols-2 gap-3">
          {gridSlotOrder.map((itemId) => (
            <div key={itemId} className={lessonSortGridCellClass}>
              {renderStableGridChip(itemId)}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {buckets.map((bucket) => renderBucket(bucket))}
        </div>

        {draggedItem && dragState ? (
          <OverlayPortal className="overflow-visible">
            <div
              className={cn(
                lessonSortCircleChipClass,
                "pointer-events-none fixed shadow-lg ring-2 ring-[#0CC1E0]/50",
              )}
              style={{
                left: dragState.x,
                top: dragState.y,
                width: dragState.width,
                height: dragState.height,
              }}
            >
              {draggedItem.emoji ? (
                <span className="text-4xl leading-none sm:text-5xl" aria-hidden>
                  {draggedItem.emoji}
                </span>
              ) : (
                <span className="px-2 text-sm">{draggedItem.label}</span>
              )}
            </div>
          </OverlayPortal>
        ) : null}
      </div>
    );
  }

  return (
    <div
      ref={boardRef}
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
          <div className="flex flex-col gap-2">
            {poolIds.map((itemId) => renderPoolChip(itemId))}
          </div>
        ) : (
          <p className="text-center font-heading text-sm font-bold text-[#22C55E]">
            All sorted!
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {buckets.map((bucket) => renderBucket(bucket))}
      </div>

      {draggedItem && dragState ? (
        <OverlayPortal className="overflow-visible">
          <div
            className={cn(
              lessonSortRowClass,
              "pointer-events-none fixed min-w-[8rem] max-w-[10rem] text-left shadow-lg",
            )}
            style={{
              left: dragState.x,
              top: dragState.y,
              width: dragState.width,
            }}
          >
            <span className="flex w-full items-center gap-2 justify-start text-left">
              {draggedItem.emoji ? (
                <span className="shrink-0 text-xl" aria-hidden>
                  {draggedItem.emoji}
                </span>
              ) : null}
              <span className="leading-snug">{draggedItem.label}</span>
            </span>
          </div>
        </OverlayPortal>
      ) : null}
    </div>
  );
}
