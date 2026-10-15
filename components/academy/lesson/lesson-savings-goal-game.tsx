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
import { OverlayPortal } from "@/components/ui/overlay-portal";
import {
  lessonItemChipClass,
  lessonItemOrbClass,
  lessonSpentTotalAmountClass,
  lessonSpentTotalCaptionClass,
} from "@/components/academy/lesson/lesson-shared-styles";
import { dragHitsZone, domRectToDropRect } from "@/lib/academy/lessons/drop-hit";
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
          {emoji}
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

  const boardRef = useRef<HTMLDivElement | null>(null);
  const dropZoneRef = useRef<HTMLDivElement | null>(null);
  const chipRefs = useRef<Partial<Record<string, HTMLButtonElement | null>>>({});
  const captureTargetRef = useRef<HTMLElement | null>(null);
  const activePointerIdRef = useRef<number | null>(null);
  const dragStateRef = useRef<DragState | null>(null);
  const dragListenersRef = useRef<(() => void) | null>(null);

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
  }, [releasePointerCapture]);

  useEffect(() => () => endDrag(), [endDrag]);

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
    const board = boardRef.current;
    if (!zone) return false;
    const rect = zone.getBoundingClientRect();
    const boardRect = board?.getBoundingClientRect();
    const destination = domRectToDropRect(rect);
    if (boardRect) {
      destination.bottom = Math.max(destination.bottom, boardRect.bottom);
      destination.left = Math.min(destination.left, boardRect.left);
      destination.right = Math.max(destination.right, boardRect.right);
    }
    const drag = dragStateRef.current;
    return dragHitsZone(
      drag
        ? { x: drag.x, y: drag.y, width: drag.width, height: drag.height }
        : null,
      clientX,
      clientY,
      destination,
    );
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
    };
    dragStateRef.current = nextDrag;
    setDragState(nextDrag);

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
    };
    const onUp = (native: PointerEvent) => {
      if (native.pointerId !== pointerId) return;
      native.preventDefault();
      const current = dragStateRef.current;
      if (current && pointerInDropZone(native.clientX, native.clientY)) {
        depositItemRef.current(current.itemId);
      } else if (current?.from === "spent") {
        withdrawItemRef.current(current.itemId);
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
        className={cn(lessonItemChipClass, isDragging && "opacity-25")}
        style={{ touchAction: "none" }}
      >
        {renderItemChip(item)}
      </button>
    );
  };

  return (
    <div
      ref={boardRef}
      className="flex min-h-0 flex-1 flex-col touch-none select-none"
    >
      <div className="shrink-0 pb-4 text-center">
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

      <div className="flex shrink-0 flex-col gap-4">
        {poolIds.map((itemId) => renderDraggableChip(itemId, "pool"))}
      </div>

      <div
        ref={dropZoneRef}
        className="mt-10 flex min-h-48 flex-1 flex-col gap-2 border-0 bg-transparent pt-2"
      >
        <h3 className="m-0 shrink-0 font-heading text-base font-bold text-[#031F82]">
          {dropZoneLabel}
        </h3>
        <div className="flex min-h-0 flex-1 flex-col gap-3.5">
          {depositedIds.map((itemId) => renderDraggableChip(itemId, "spent"))}
        </div>
      </div>

      {draggedItem && dragState ? (
        <OverlayPortal>
          <div
            className={cn(
              lessonItemChipClass,
              "pointer-events-none fixed",
            )}
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
