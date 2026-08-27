"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { OverlayPortal } from "@/components/ui/overlay-portal";
import {
  lessonItemChipClass,
  lessonItemOrbClass,
  lessonSpentTotalAmountClass,
  lessonSpentTotalCaptionClass,
} from "@/components/academy/lesson/lesson-shared-styles";
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
  poolColumnLabel: string;
  dropZoneLabel: string;
  items: readonly SavingsGoalGameItem[];
  workshopSignTitle: string;
  lockedLabel: string;
  unlockedLabel: string;
  goalAchievedLabel: string;
  onGoalReady: () => void;
  onAdvance: () => void;
  onItemSaved?: () => void;
};

function formatDollars(amount: number): string {
  return `$${amount}`;
}

function itemGlyph(item: SavingsGoalGameItem) {
  return item.emoji?.trim() || item.label.trim().charAt(0) || "?";
}

function renderItemChip(item: SavingsGoalGameItem) {
  return (
    <>
      <span className={lessonItemOrbClass} aria-hidden>
        {itemGlyph(item)}
      </span>
      <span>
        {item.label} · {formatDollars(item.price)}
      </span>
    </>
  );
}

export function LessonSavingsGoalGame({
  meterLabel,
  dropZoneLabel,
  items,
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
  const hairlineRef = useRef<HTMLDivElement | null>(null);
  const chipRefs = useRef<Partial<Record<string, HTMLButtonElement | null>>>({});
  const captureTargetRef = useRef<HTMLElement | null>(null);
  const activePointerIdRef = useRef<number | null>(null);
  const dragStateRef = useRef<DragState | null>(null);
  dragStateRef.current = dragState;

  const savedTotal = depositedIds.reduce(
    (sum, itemId) => sum + (itemById.get(itemId)?.price ?? 0),
    0,
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
    captureTarget.setPointerCapture(event.pointerId);

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
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    if (activePointerIdRef.current !== event.pointerId) return;
    if (!dragStateRef.current) return;
    setDragState((current) =>
      current
        ? {
            ...current,
            x: event.clientX - current.offsetX,
            y: event.clientY - current.offsetY,
          }
        : null,
    );
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLElement>) => {
    if (activePointerIdRef.current !== event.pointerId) return;

    const drag = dragStateRef.current;
    if (!drag) {
      endDrag();
      return;
    }

    const hairlineY = hairlineRef.current?.getBoundingClientRect().top;
    const belowHairline =
      hairlineY !== undefined && event.clientY >= hairlineY;

    if (belowHairline) {
      depositItem(drag.itemId);
    } else {
      withdrawItem(drag.itemId);
    }

    endDrag();
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
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={endDrag}
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex flex-col gap-4 pb-12 pt-1">
          {poolIds.map((itemId) => renderDraggableChip(itemId, "pool"))}
        </div>
        <div
          ref={hairlineRef}
          className="h-px shrink-0 bg-[#C5D8E6]"
        />
        <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pt-4">
          <h3 className="m-0 shrink-0 font-heading text-base font-bold text-[#031F82]">
            {dropZoneLabel}
          </h3>
          <div className="flex min-h-0 flex-1 flex-col gap-3.5">
            {depositedIds.map((itemId) => renderDraggableChip(itemId, "spent"))}
          </div>
        </div>
      </div>

      <div className="shrink-0 pb-5 pt-8 text-center">
        <p className={lessonSpentTotalCaptionClass}>{meterLabel}</p>
        <p className={lessonSpentTotalAmountClass} aria-live="polite">
          {formatDollars(savedTotal)}
        </p>
      </div>

      {draggedItem && dragState ? (
        <OverlayPortal>
          <div
            className={cn(
              lessonItemChipClass,
              "pointer-events-none fixed shadow-lg",
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
