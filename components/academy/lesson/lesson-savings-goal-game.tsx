"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { LessonAnswerTick } from "@/components/academy/lesson/lesson-ui";
import { AnswerEmoji } from "@/components/academy/lesson/answer-emoji";
import { OverlayPortal } from "@/components/ui/overlay-portal";
import {
  lessonCtaClass,
  lessonItemOrbClass,
  lessonSavingsGoalChipClass,
  lessonSavingsGoalDropActiveClass,
  lessonSavingsGoalDropClass,
  lessonSavingsGoalDropIdleClass,
  lessonSpentTotalAmountClass,
  lessonSpentTotalCaptionClass,
} from "@/components/academy/lesson/lesson-shared-styles";
import {
  GENEROUS_DROP_PAD_PX,
  dragHitsZone,
  domRectToDropRect,
  expandRect,
} from "@/lib/academy/lessons/drop-hit";
import { cn } from "@/lib/utils/cn";

export type SavingsGoalGameItem = {
  id: string;
  label: string;
  price: number;
  emoji?: string;
};

type DragOrigin = "pool" | "spent";

type DragState = {
  itemId: string;
  from: DragOrigin;
  offsetX: number;
  offsetY: number;
  x: number;
  y: number;
  width: number;
  height: number;
  startX: number;
  startY: number;
};

type LessonSavingsGoalGameProps = {
  meterLabel: string;
  targetAmount: number;
  showsRemaining?: boolean;
  poolColumnLabel: string;
  dropZoneLabel: string;
  items: readonly SavingsGoalGameItem[];
  workshopSignTitle: string;
  lockedLabel: string;
  unlockedLabel: string;
  goalAchievedLabel: string;
  onGoalReady: () => void;
  onGoalLost?: () => void;
  onAdvance: () => void;
  onItemSaved?: () => void;
  /** Drop released outside the box. */
  onMiss?: () => void;
};

function formatDollars(amount: number): string {
  return `$${amount}`;
}

/** Remaining / Left totals start at the available amount and fall as items are chosen. */
function meterCountsDown(label: string, showsRemaining: boolean): boolean {
  if (showsRemaining) return true;
  return /^(remaining|left)$/i.test(label.trim());
}

function renderItemChip(item: SavingsGoalGameItem) {
  const emoji = item.emoji?.trim();
  return (
    <>
      {emoji ? (
        <span className={lessonItemOrbClass} aria-hidden>
          <AnswerEmoji emoji={emoji} />
        </span>
      ) : null}
      <span>
        {item.label} · {formatDollars(item.price)}
      </span>
    </>
  );
}

export function LessonSavingsGoalGame({
  meterLabel,
  targetAmount,
  showsRemaining = false,
  dropZoneLabel,
  items,
  onGoalReady,
  onGoalLost,
  onMiss,
}: LessonSavingsGoalGameProps) {
  const itemById = useMemo(
    () => new Map(items.map((item) => [item.id, item])),
    [items],
  );

  const [poolIds, setPoolIds] = useState<string[]>(() =>
    items.map((item) => item.id),
  );
  const [depositedIds, setDepositedIds] = useState<string[]>([]);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [overDrop, setOverDrop] = useState(false);
  const [shakingId, setShakingId] = useState<string | null>(null);

  const boardRef = useRef<HTMLDivElement | null>(null);
  const dropZoneRef = useRef<HTMLDivElement | null>(null);
  const chipRefs = useRef<Partial<Record<string, HTMLButtonElement | null>>>({});
  const captureTargetRef = useRef<HTMLElement | null>(null);
  const activePointerIdRef = useRef<number | null>(null);
  const dragStateRef = useRef<DragState | null>(null);
  const dragListenersRef = useRef<(() => void) | null>(null);
  const shakeTimerRef = useRef<number | null>(null);

  const savedTotal = depositedIds.reduce(
    (sum, itemId) => sum + (itemById.get(itemId)?.price ?? 0),
    0,
  );
  const shownTotal = meterCountsDown(meterLabel, showsRemaining)
    ? Math.max(0, targetAmount - savedTotal)
    : savedTotal;
  const goalReached = targetAmount > 0 && savedTotal >= targetAmount;
  const onGoalReadyRef = useRef(onGoalReady);
  onGoalReadyRef.current = onGoalReady;
  const onGoalLostRef = useRef(onGoalLost);
  onGoalLostRef.current = onGoalLost;
  const onMissRef = useRef(onMiss);
  onMissRef.current = onMiss;

  useEffect(() => {
    if (goalReached) onGoalReadyRef.current();
    else onGoalLostRef.current?.();
  }, [goalReached]);

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
    setOverDrop(false);
  }, [releasePointerCapture]);

  useEffect(
    () => () => {
      endDrag();
      if (shakeTimerRef.current !== null) window.clearTimeout(shakeTimerRef.current);
    },
    [endDrag],
  );

  const depositItem = useCallback((itemId: string) => {
    setPoolIds((current) => {
      if (!current.includes(itemId)) return current;
      return current.filter((id) => id !== itemId);
    });
    setDepositedIds((current) =>
      current.includes(itemId) ? current : [...current, itemId],
    );
  }, []);

  const withdrawItem = useCallback((itemId: string) => {
    setDepositedIds((current) => {
      if (!current.includes(itemId)) return current;
      return current.filter((id) => id !== itemId);
    });
    setPoolIds((current) =>
      current.includes(itemId) ? current : [...current, itemId],
    );
  }, []);

  const depositItemRef = useRef(depositItem);
  depositItemRef.current = depositItem;
  const withdrawItemRef = useRef(withdrawItem);
  withdrawItemRef.current = withdrawItem;

  const pointerInDropZone = (clientX: number, clientY: number) => {
    const zone = dropZoneRef.current;
    if (!zone) return false;
    // Near misses above and beside the well still land. The total sits just
    // under the well, so the pointer has to be inside this rect — a tall card
    // hanging over the total is not a drop.
    const destination = expandRect(
      domRectToDropRect(zone.getBoundingClientRect()),
      GENEROUS_DROP_PAD_PX,
    );
    destination.bottom -= GENEROUS_DROP_PAD_PX;
    return dragHitsZone(null, clientX, clientY, destination, 0);
  };

  const handleChipPointerDown = (
    itemId: string,
    from: DragOrigin,
    event: ReactPointerEvent<HTMLButtonElement>,
  ) => {
    const chip = chipRefs.current[itemId];
    if (!chip) return;

    event.preventDefault();
    event.stopPropagation();

    const rect = chip.getBoundingClientRect();
    const captureTarget = boardRef.current ?? event.currentTarget;
    captureTargetRef.current = captureTarget;
    activePointerIdRef.current = event.pointerId;
    try {
      captureTarget.setPointerCapture(event.pointerId);
    } catch {
      captureTargetRef.current = null;
    }

    const nextDrag: DragState = {
      itemId,
      from,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height,
      startX: event.clientX,
      startY: event.clientY,
    };
    dragStateRef.current = nextDrag;
    setDragState(nextDrag);
    setOverDrop(pointerInDropZone(event.clientX, event.clientY));

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
      const hovering = pointerInDropZone(native.clientX, native.clientY);
      setOverDrop((currentOver) => (currentOver === hovering ? currentOver : hovering));
    };
    const onUp = (native: PointerEvent) => {
      if (native.pointerId !== pointerId) return;
      native.preventDefault();
      const current = dragStateRef.current;
      if (current && pointerInDropZone(native.clientX, native.clientY)) {
        depositItemRef.current(current.itemId);
      } else if (current?.from === "spent") {
        withdrawItemRef.current(current.itemId);
      } else if (current?.from === "pool") {
        const moved =
          Math.hypot(native.clientX - current.startX, native.clientY - current.startY) > 8;
        if (!moved) {
          depositItemRef.current(current.itemId);
          endDrag();
          return;
        }
        setShakingId(current.itemId);
        if (shakeTimerRef.current !== null) window.clearTimeout(shakeTimerRef.current);
        shakeTimerRef.current = window.setTimeout(() => {
          setShakingId((shaking) => (shaking === current.itemId ? null : shaking));
          shakeTimerRef.current = null;
        }, 360);
        onMissRef.current?.();
      }
      endDrag();
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
  };

  const draggedItem = dragState ? itemById.get(dragState.itemId) : null;

  const renderDraggableChip = (itemId: string, from: DragOrigin) => {
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
        onPointerDown={(event) => handleChipPointerDown(itemId, from, event)}
        onKeyDown={(event) => {
          if (event.key !== "Enter" && event.key !== " ") return;
          event.preventDefault();
          if (from === "pool") depositItemRef.current(itemId);
          else withdrawItemRef.current(itemId);
        }}
        aria-grabbed={isDragging}
        className={cn(
          lessonSavingsGoalChipClass,
          isDragging && "opacity-25",
          shakingId === itemId && "lesson-tile-shake",
        )}
      >
        {renderItemChip(item)}
      </button>
    );
  };

  return (
    <div ref={boardRef} className="flex min-h-0 flex-1 flex-col select-none">
      <div className="flex shrink-0 flex-col gap-1.5">
        {poolIds.map((itemId) => renderDraggableChip(itemId, "pool"))}
      </div>

      <div className="mt-3 flex min-h-0 flex-1 flex-col">
        <h2 className={cn("m-0 shrink-0", lessonCtaClass)}>{dropZoneLabel}</h2>
        <div
          ref={dropZoneRef}
          data-testid="savings-drop-zone"
          data-drop-active={overDrop ? "true" : "false"}
          className={cn(
            "mt-1.5",
            lessonSavingsGoalDropClass,
            overDrop ? lessonSavingsGoalDropActiveClass : lessonSavingsGoalDropIdleClass,
          )}
        >
          {depositedIds.map((itemId) => renderDraggableChip(itemId, "spent"))}
        </div>
      </div>

      <div className="shrink-0 pt-1 text-center">
        <p className={lessonSpentTotalCaptionClass}>{meterLabel}</p>
        <p className={lessonSpentTotalAmountClass} aria-live="polite">
          {formatDollars(shownTotal)}
        </p>
        {goalReached ? (
          <div className="mt-2 flex justify-center">
            <LessonAnswerTick />
          </div>
        ) : null}
      </div>

      {draggedItem && dragState ? (
        <OverlayPortal>
          <div
            className={cn(lessonSavingsGoalChipClass, "pointer-events-none fixed")}
            style={{
              left: dragState.x,
              top: dragState.y,
              width: dragState.width,
            }}
          >
            {renderItemChip(draggedItem)}
          </div>
        </OverlayPortal>
      ) : null}
    </div>
  );
}
