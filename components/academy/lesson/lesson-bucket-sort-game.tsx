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
  lessonSortBoardClass,
  lessonSortBucketClass,
  lessonSortBucketActiveClass,
  lessonSortStatementCardClass,
  lessonSortStatementPlacedClass,
  lessonSortItemEmojiClass,
  lessonSortPoolSlotPlaceholderClass,
  lessonGameHintClass,
} from "@/components/academy/lesson/lesson-shared-styles";
import {
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
import { cn } from "@/lib/utils/cn";
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
  onComplete: () => void;
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
};

type PendingSideEffect = { kind: "correct"; willComplete: boolean };

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

/** Extra pixels around bucket bounds so drops register more easily on touch devices. */
const BUCKET_DROP_HIT_PADDING_PX = 20;

export function LessonBucketSortGame<TBucket extends string>({
  items,
  buckets,
  onComplete,
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

  const [poolIds, setPoolIds] = useState<string[]>(() => {
    const ids = items.map((item) => item.id);
    return isSpentTotalLayout ? ids : shuffleIds(ids);
  });
  const [poolSlotIds] = useState<string[]>(() => poolIds);
  const [bucketItems, setBucketItems] = useState<Record<string, string[]>>(() =>
    Object.fromEntries(buckets.map((bucket) => [bucket.id, []])),
  );
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [activeBucketId, setActiveBucketId] = useState<TBucket | null>(null);
  const [flyHomeId, setFlyHomeId] = useState<string | null>(null);

  const poolIdsRef = useRef(poolIds);
  poolIdsRef.current = poolIds;
  const bucketItemsRef = useRef(bucketItems);
  bucketItemsRef.current = bucketItems;

  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const pendingEffectsRef = useRef<PendingSideEffect[]>([]);
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

      const currentPool = poolIdsRef.current;
      if (!currentPool.includes(itemId)) return;

      if (item.bucket !== bucketId) {
        setFlyHomeId(itemId);
        window.setTimeout(() => {
          setFlyHomeId(null);
        }, 350);
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
          onPointerDown={(event) => handleChipPointerDown(itemId, event)}
          className={cn(
            flyHomeId === itemId &&
              "transition-transform duration-300 ease-out -translate-y-2.5",
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
        onPointerDown={(event) => handleChipPointerDown(itemId, event)}
        className={cn(
          stacked ? "w-full" : "w-full min-w-[8rem] max-w-full",
          lessonSortStatementCardClass,
          isDragging && "opacity-40",
          flyHomeId === itemId &&
            "transition-transform duration-300 ease-out -translate-y-2.5",
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
            {item.emoji ? (
              <span className={lessonSortItemEmojiClass} aria-hidden>
                {item.emoji}
              </span>
            ) : null}
            <span className="leading-snug">{item.label}</span>
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
            <span className="flex min-w-0 items-center gap-2">
              {item.emoji ? (
                <span className={lessonSortItemEmojiClass} aria-hidden>
                  {item.emoji}
                </span>
              ) : null}
              <span className="min-w-0 leading-snug">{item.label}</span>
            </span>
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
        className="mt-3 flex h-full min-h-0 flex-1 flex-col"
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
            "pointer-events-none fixed shadow-lg ring-2 ring-[#0CC1E0]/40",
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
            <>
              {draggedItem.emoji ? (
                <span className={lessonSortItemEmojiClass} aria-hidden>
                  {draggedItem.emoji}
                </span>
              ) : null}
              <span className="min-w-0 flex-1 leading-snug">{draggedItem.label}</span>
              {draggedItem.price !== undefined ? (
                <span className="shrink-0 font-heading font-extrabold text-[#0CC1E0]">
                  {formatDollars(draggedItem.price)}
                </span>
              ) : null}
            </>
          )}
        </div>
      </OverlayPortal>
    );
  };

  if (isStatementSortLayout) {
    return (
      <div
        ref={boardRef}
        className={cn(lessonSortBoardClass, "flex min-h-0 flex-1 flex-col gap-1.5")}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
      >
        <LessonSortPool
          isEmpty={poolIds.length === 0}
          className="shrink-0"
        >
          {poolSlotIds.map((itemId) =>
            poolIds.includes(itemId) ? (
              renderPoolChip(itemId)
            ) : (
              <div
                key={itemId}
                className={cn(lessonSortPoolSlotPlaceholderClass, "min-h-[72px]")}
                aria-hidden
              />
            ),
          )}
        </LessonSortPool>
        <div className="mb-2.5 h-px shrink-0 bg-[#C5D8E6]" />
        <LessonSortBucketRow className="min-h-0 flex-1">
          {buckets.map((bucket) => renderBucket(bucket))}
        </LessonSortBucketRow>

        {renderDragGhost()}
      </div>
    );
  }

  return null;
}
