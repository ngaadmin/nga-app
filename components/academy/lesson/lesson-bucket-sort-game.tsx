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
  lessonSortBoardClass,
  lessonSortBucketClass,
  lessonSortBucketActiveClass,
  lessonSortStatementCardClass,
  lessonSortStatementPlacedClass,
  lessonSortPoolSlotPlaceholderClass,
  lessonGameHintClass,
} from "@/components/academy/lesson/lesson-shared-styles";
import { AnswerEmojiLabel } from "@/components/academy/lesson/answer-emoji";
import { useLessonShake } from "@/components/academy/lesson/hooks/use-lesson-screen-flow";
import {
  LessonAnswerTick,
  LessonColumnLabel,
  LessonSortBucket,
  LessonSortBucketRow,
  LessonSortPool,
  LessonSortStatementCard,
  LessonSortStatementPlaced,
  LessonPricedSortItemContent,
  LessonSpentTotalBar,
} from "@/components/academy/lesson/lesson-ui";
import { OverlayPortal } from "@/components/ui/overlay-portal";
import { seededShuffle } from "@/lib/academy/lessons/seeded-shuffle";
import { cn } from "@/lib/utils/cn";
import {
  bestDropZone,
  domRectToDropRect,
  type DragBounds,
} from "@/lib/academy/lessons/drop-hit";
import type { SortBucketTone } from "@/lib/academy/lessons/types/shared-blocks";

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
  tone?: SortBucketTone;
  icon?: string;
};

type LessonBucketSortGameProps<TBucket extends string> = {
  items: readonly LessonSortItem<TBucket>[];
  buckets: readonly LessonSortBucket<TBucket>[];
  /** Screen id mixed into the pool shuffle. Spent totals stay in sheet order. */
  orderKey: string;
  onComplete: () => void;
  onMismatch?: () => void;
  layout?: "default" | "spent-total" | "stable-grid" | "statement-sort";
  targetTotal?: number;
  poolColumnLabel?: string;
};

type DragState = {
  itemId: string;
  offsetX: number;
  offsetY: number;
  x: number;
  y: number;
  width: number;
  height: number;
  originX: number;
  originY: number;
};

type PendingSideEffect = { kind: "correct"; willComplete: boolean };

function formatDollars(amount: number): string {
  return `$${amount}`;
}

const TAP_SELECT_PX = 10;

export function LessonBucketSortGame<TBucket extends string>({
  items,
  buckets,
  orderKey,
  onComplete,
  onMismatch,
  layout = "stable-grid",
  targetTotal,
  poolColumnLabel = "Purchases",
}: LessonBucketSortGameProps<TBucket>) {
  const isSpentTotalLayout = layout === "spent-total";
  const isStatementSortLayout =
    !isSpentTotalLayout &&
    (layout === "default" ||
      layout === "stable-grid" ||
      layout === "statement-sort" ||
      layout === undefined);

  const itemById = useMemo(
    () => new Map(items.map((item) => [item.id, item])),
    [items],
  );

  const authoredIds = useMemo(() => items.map((item) => item.id), [items]);
  const itemSignature = authoredIds.join("\0");
  const [poolIds, setPoolIds] = useState<string[]>(() => items.map((item) => item.id));
  const playSeed = usePlaySeed([orderKey, isSpentTotalLayout ? "spent" : "pool"]);
  const authoredIdsRef = useRef(authoredIds);
  authoredIdsRef.current = authoredIds;

  useLayoutEffect(() => {
    if (isSpentTotalLayout || playSeed === null) return;
    const authored = authoredIdsRef.current;
    setPoolIds((current) => {
      if (current.length !== authored.length) return current;
      if (!authored.every((id) => current.includes(id))) return current;
      return seededShuffle(authored, playSeed);
    });
  }, [isSpentTotalLayout, itemSignature, playSeed]);
  const [bucketItems, setBucketItems] = useState<Record<string, string[]>>(() =>
    Object.fromEntries(buckets.map((bucket) => [bucket.id, []])),
  );
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [activeBucketId, setActiveBucketId] = useState<TBucket | null>(null);
  const [flyHomeId, setFlyHomeId] = useState<string | null>(null);
  const { shakingKey, shake } = useLessonShake();

  const poolIdsRef = useRef(poolIds);
  poolIdsRef.current = poolIds;
  const bucketItemsRef = useRef(bucketItems);
  bucketItemsRef.current = bucketItems;

  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const onMismatchRef = useRef(onMismatch);
  onMismatchRef.current = onMismatch;

  const pendingEffectsRef = useRef<PendingSideEffect[]>([]);
  const flushTimeoutRef = useRef<number | null>(null);

  const bucketRefs = useRef<Partial<Record<TBucket, HTMLDivElement | null>>>({});
  const chipRefs = useRef<Partial<Record<string, HTMLButtonElement | null>>>({});
  const boardRef = useRef<HTMLDivElement | null>(null);
  const captureTargetRef = useRef<HTMLElement | null>(null);
  const activePointerIdRef = useRef<number | null>(null);
  /** Written in pointerdown so pointerup can drop before React re-renders. */
  const dragStateRef = useRef<DragState | null>(null);
  const dragListenersRef = useRef<(() => void) | null>(null);

  const placedIdSet = useMemo(() => {
    const placed = new Set<string>();
    for (const ids of Object.values(bucketItems)) {
      for (const id of ids) placed.add(id);
    }
    return placed;
  }, [bucketItems]);

  const isComplete = placedIdSet.size === items.length;

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
    dragListenersRef.current?.();
    dragListenersRef.current = null;
    releasePointerCapture();
    dragStateRef.current = null;
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

  const resolveBucketAtPoint = useCallback(
    (clientX: number, clientY: number): TBucket | null => {
      const drag = dragStateRef.current;
      const bounds: DragBounds | null = drag
        ? { x: drag.x, y: drag.y, width: drag.width, height: drag.height }
        : null;
      const zones = buckets.flatMap((bucket) => {
        const node = bucketRefs.current[bucket.id];
        if (!node) return [];
        return [{ id: bucket.id, rect: domRectToDropRect(node.getBoundingClientRect()) }];
      });
      return bestDropZone(zones, bounds, clientX, clientY);
    },
    [buckets],
  );

  const resolveBucketAtPointRef = useRef(resolveBucketAtPoint);
  resolveBucketAtPointRef.current = resolveBucketAtPoint;

  const assignToBucket = useCallback(
    (itemId: string, bucketId: TBucket) => {
      const item = itemById.get(itemId);
      if (!item) return;

      const alreadyPlaced = Object.values(bucketItemsRef.current).some((ids) =>
        ids.includes(itemId),
      );
      if (alreadyPlaced) return;
      if (!poolIdsRef.current.includes(itemId)) return;

      if (item.bucket !== bucketId) {
        shake(itemId);
        onMismatchRef.current?.();
        setFlyHomeId(itemId);
        window.setTimeout(() => {
          setFlyHomeId(null);
        }, 350);
        return;
      }

      const nextPlacedCount =
        Object.values(bucketItemsRef.current).reduce(
          (count, ids) => count + ids.length,
          0,
        ) + 1;

      if (isSpentTotalLayout) {
        const nextPool = poolIdsRef.current.filter((id) => id !== itemId);
        poolIdsRef.current = nextPool;
        setPoolIds(nextPool);
      }

      setBucketItems((bucketCurrent) => {
        const placed = bucketCurrent[bucketId] ?? [];
        if (placed.includes(itemId)) return bucketCurrent;
        return {
          ...bucketCurrent,
          [bucketId]: [...placed, itemId],
        };
      });

      queueSideEffect({
        kind: "correct",
        willComplete: nextPlacedCount === items.length,
      });
    },
    [isSpentTotalLayout, itemById, items.length, queueSideEffect, shake],
  );

  const assignToBucketRef = useRef(assignToBucket);
  assignToBucketRef.current = assignToBucket;

  const placeDragAtPoint = (clientX: number, clientY: number) => {
    const current = dragStateRef.current;
    if (!current) return;
    const bucketId = resolveBucketAtPointRef.current(clientX, clientY);
    if (bucketId) {
      assignToBucketRef.current(current.itemId, bucketId);
    }
  };

  const finishPointer = (clientX: number, clientY: number) => {
    const current = dragStateRef.current;
    if (!current) return;
    const moved = Math.hypot(
      clientX - current.originX,
      clientY - current.originY,
    );
    if (moved < TAP_SELECT_PX) {
      setSelectedItemId(current.itemId);
      endDrag();
      return;
    }
    placeDragAtPoint(clientX, clientY);
    endDrag();
  };

  const activateBucket = (bucketId: TBucket) => {
    if (!selectedItemId) return;
    const item = itemById.get(selectedItemId);
    if (!item) return;
    assignToBucket(selectedItemId, bucketId);
    if (item.bucket === bucketId) setSelectedItemId(null);
  };

  const selectItemFromKeyboard = (
    event: { key: string; preventDefault: () => void },
    itemId: string,
  ) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    setSelectedItemId(itemId);
  };

  const bucketActivationProps = (bucket: LessonSortBucket<TBucket>) => ({
    role: "button" as const,
    tabIndex: 0,
    "aria-label": `Drop selected item in ${bucket.label}`,
    onClick: () => activateBucket(bucket.id),
    onKeyDown: (event: { key: string; preventDefault: () => void }) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      activateBucket(bucket.id);
    },
  });

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
    const nextDrag: DragState = {
      itemId,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height,
      originX: event.clientX,
      originY: event.clientY,
    };
    dragStateRef.current = nextDrag;
    activePointerIdRef.current = event.pointerId;

    const pointerId = event.pointerId;
    const onMove = (native: PointerEvent) => {
      if (native.pointerId !== pointerId) return;
      const current = dragStateRef.current;
      if (!current) return;
      native.preventDefault();
      const moved: DragState = {
        ...current,
        x: native.clientX - current.offsetX,
        y: native.clientY - current.offsetY,
      };
      dragStateRef.current = moved;
      setDragState(moved);
      setActiveBucketId(
        resolveBucketAtPointRef.current(native.clientX, native.clientY),
      );
    };
    const onUp = (native: PointerEvent) => {
      if (native.pointerId !== pointerId) return;
      native.preventDefault();
      finishPointer(native.clientX, native.clientY);
    };
    dragListenersRef.current?.();
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    dragListenersRef.current = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };

    const captureTarget = boardRef.current ?? event.currentTarget;
    captureTargetRef.current = captureTarget;
    try {
      captureTarget.setPointerCapture(event.pointerId);
    } catch {
      // Window listeners still receive the gesture when capture is unavailable.
    }
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    if (activePointerIdRef.current !== event.pointerId) return;
    const current = dragStateRef.current;
    if (!current) return;
    const moved: DragState = {
      ...current,
      x: event.clientX - current.offsetX,
      y: event.clientY - current.offsetY,
    };
    dragStateRef.current = moved;
    setDragState(moved);
    setActiveBucketId(resolveBucketAtPoint(event.clientX, event.clientY));
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLElement>) => {
    if (activePointerIdRef.current !== event.pointerId) return;
    finishPointer(event.clientX, event.clientY);
  };

  const handlePointerCancel = (event: ReactPointerEvent<HTMLElement>) => {
    if (
      activePointerIdRef.current === null ||
      activePointerIdRef.current === event.pointerId
    ) {
      finishPointer(event.clientX, event.clientY);
    }
    endDrag();
  };

  const draggedItem = dragState ? itemById.get(dragState.itemId) : null;

  const renderPoolChip = (itemId: string, stacked = false) => {
    const item = itemById.get(itemId);
    if (!item) return null;
    const isDragging = dragState?.itemId === itemId;

    if ((isStatementSortLayout && !stacked) || isSpentTotalLayout) {
      return (
        <LessonSortStatementCard
          key={itemId}
          ref={(node) => {
            chipRefs.current[itemId] = node;
          }}
          label={item.label}
          emoji={item.emoji}
          price={item.price}
          isDragging={isDragging}
          aria-pressed={selectedItemId === itemId}
          onKeyDown={(event) => selectItemFromKeyboard(event, itemId)}
          onPointerDown={(event) => handleChipPointerDown(itemId, event)}
          className={cn(
            flyHomeId === itemId &&
              "transition-transform duration-300 ease-out -translate-y-2.5",
            shakingKey === itemId && "lesson-tile-shake",
          )}
        />
      );
    }

    return (
      <button
        key={itemId}
        ref={(node) => {
          chipRefs.current[itemId] = node;
        }}
        type="button"
        aria-label={item.label}
        aria-pressed={selectedItemId === itemId}
        onKeyDown={(event) => selectItemFromKeyboard(event, itemId)}
        onPointerDown={(event) => handleChipPointerDown(itemId, event)}
        className={cn(
          stacked ? "w-full" : "w-full min-w-[8rem] max-w-full",
          lessonSortStatementCardClass,
          isDragging && "opacity-40",
          flyHomeId === itemId &&
            "transition-transform duration-300 ease-out -translate-y-2.5",
          shakingKey === itemId && "lesson-tile-shake",
        )}
        style={{ touchAction: "none" }}
      >
        {item.emoji && item.price !== undefined ? (
          <LessonPricedSortItemContent
            label={item.label}
            emoji={item.emoji}
            price={item.price}
            formatPrice={formatDollars}
          />
        ) : (
          <span className="flex w-full items-center justify-center gap-2 text-center">
            <AnswerEmojiLabel emoji={item.emoji} label={item.label} className="leading-snug" />
            {item.price !== undefined ? (
              <span className="shrink-0 font-heading font-extrabold text-[#0CC1E0]">
                {formatDollars(item.price)}
              </span>
            ) : null}
          </span>
        )}
      </button>
    );
  };

  const renderPlacedItem = (itemId: string) => {
    const item = itemById.get(itemId);
    if (!item) return null;

    if (isStatementSortLayout || isSpentTotalLayout) {
      return (
        <LessonSortStatementPlaced
          key={itemId}
          label={item.label}
          emoji={item.emoji}
          price={item.price}
        />
      );
    }

    return (
      <div key={itemId} className={lessonSortStatementPlacedClass}>
        {item.emoji && item.price !== undefined ? (
          <LessonPricedSortItemContent
            label={item.label}
            emoji={item.emoji}
            price={item.price}
            formatPrice={formatDollars}
          />
        ) : (
          <span className="flex items-center justify-between gap-2">
            <AnswerEmojiLabel emoji={item.emoji} label={item.label} className="min-w-0 leading-snug" />
            {item.price !== undefined ? (
              <span className="shrink-0 font-heading font-extrabold text-[#0CC1E0]">
                {formatDollars(item.price)}
              </span>
            ) : null}
          </span>
        )}
      </div>
    );
  };

  const renderBucket = (bucket: LessonSortBucket<TBucket>) => {
    const placedIds = bucketItems[bucket.id] ?? [];

    if (isStatementSortLayout) {
      return (
        <LessonSortBucket
          key={bucket.id}
          ref={(node) => {
            bucketRefs.current[bucket.id] = node;
          }}
          bucketId={bucket.id}
          label={bucket.label}
          tone={bucket.tone}
          icon={bucket.icon}
          active={activeBucketId === bucket.id}
          fillHeight
          {...bucketActivationProps(bucket)}
        >
          {placedIds.map((itemId) => renderPlacedItem(itemId))}
        </LessonSortBucket>
      );
    }

    return (
      <div
        key={bucket.id}
        ref={(node) => {
          bucketRefs.current[bucket.id] = node;
        }}
        {...bucketActivationProps(bucket)}
        className={cn(
          lessonSortBucketClass,
          isSpentTotalLayout && "min-h-[12rem] flex-1 p-3",
          activeBucketId === bucket.id && lessonSortBucketActiveClass,
        )}
      >
        <LessonColumnLabel tone="ink">{bucket.label}</LessonColumnLabel>
        <div className="mt-3 space-y-3">
          {placedIds.map((itemId) => renderPlacedItem(itemId))}
          {placedIds.length === 0 ? (
            <p className={cn("py-2 text-center opacity-60", lessonGameHintClass)}>
              Drop statements here
            </p>
          ) : null}
        </div>
      </div>
    );
  };

  if (isSpentTotalLayout) {
    const primaryBucket = buckets[0];
    if (!primaryBucket) return null;
    const isSpentTotalComplete =
      poolIds.length === 0 &&
      (targetTotal === undefined || totalSpent >= targetTotal);

    const spentIds = bucketItems[primaryBucket.id] ?? [];

    return (
      <div
        ref={boardRef}
        className="mt-3 flex h-full min-h-0 flex-1 touch-none flex-col"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div className="flex shrink-0 flex-col gap-4 py-1">
          {poolIds.map((itemId) => renderPoolChip(itemId, true))}
        </div>
        <div className="mb-2.5 h-px shrink-0 bg-[#C5D8E6]" />
        <div
          ref={(node) => {
            bucketRefs.current[primaryBucket.id] = node;
          }}
          className="flex min-h-0 w-full flex-1 flex-col"
          {...bucketActivationProps(primaryBucket)}
        >
          <h3 className="m-0 shrink-0 font-heading text-base font-bold text-[#031F82]">
            {primaryBucket.label}
          </h3>
          <div className="flex min-h-0 flex-1 flex-col gap-3.5 py-2.5">
            {spentIds.map((itemId) => renderPlacedItem(itemId))}
          </div>
          <LessonSpentTotalBar
            caption={poolColumnLabel}
            amount={formatDollars(totalSpent)}
            complete={isSpentTotalComplete}
            className="mt-auto shrink-0 pt-[18px]"
          />
          {isSpentTotalComplete ? (
            <div className="mt-3 flex justify-center">
              <LessonAnswerTick />
            </div>
          ) : null}
        </div>

        {draggedItem && dragState ? (
          <OverlayPortal className="overflow-visible">
            <div
              className={cn(
                lessonSortStatementCardClass,
                "pointer-events-none fixed",
              )}
              style={{
                left: dragState.x,
                top: dragState.y,
                width: dragState.width,
              }}
            >
              <LessonSortStatementPlaced
                label={draggedItem.label}
                emoji={draggedItem.emoji}
                price={draggedItem.price}
              />
            </div>
          </OverlayPortal>
        ) : null}
      </div>
    );
  }

  const renderDragGhost = () => {
    if (!draggedItem || !dragState) return null;

    return (
      <OverlayPortal className="overflow-visible">
        <div
          className={cn(
            lessonSortStatementCardClass,
            "pointer-events-none fixed",
          )}
          style={{
            left: dragState.x,
            top: dragState.y,
            width: dragState.width,
            minHeight: dragState.height,
          }}
        >
          {draggedItem.emoji && draggedItem.price !== undefined ? (
            <LessonPricedSortItemContent
              label={draggedItem.label}
              emoji={draggedItem.emoji}
              price={draggedItem.price}
              formatPrice={formatDollars}
            />
          ) : (
            <LessonSortStatementPlaced
              label={draggedItem.label}
              emoji={draggedItem.emoji}
              price={draggedItem.price}
            />
          )}
        </div>
      </OverlayPortal>
    );
  };

  if (isStatementSortLayout) {
    return (
      <div
        ref={boardRef}
        className={cn(
          lessonSortBoardClass,
          "flex min-h-0 flex-1 touch-none flex-col gap-1.5",
        )}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
      >
        <LessonSortPool isEmpty={isComplete} className="shrink-0">
          {poolIds.map((itemId) =>
            placedIdSet.has(itemId) ? (
              <div
                key={itemId}
                className={lessonSortPoolSlotPlaceholderClass}
                aria-hidden
              />
            ) : (
              renderPoolChip(itemId)
            ),
          )}
        </LessonSortPool>
        <div className="h-px shrink-0 bg-[#C5D8E6]" />
        <LessonSortBucketRow className="min-h-0 flex-1">
          {buckets.map((bucket) => renderBucket(bucket))}
        </LessonSortBucketRow>
        {isComplete ? (
          <div className="mt-3 flex justify-center">
            <LessonAnswerTick />
          </div>
        ) : null}

        {renderDragGhost()}
      </div>
    );
  }

  return null;
}
