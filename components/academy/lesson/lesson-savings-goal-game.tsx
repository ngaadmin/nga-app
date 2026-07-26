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
  lessonColumnLabelClass,
  lessonGoldClaimClass,
  lessonInteractiveTextClass,
  lessonSortBucketActiveClass,
  lessonSortRowClass,
} from "@/components/academy/lesson/lesson-shared-styles";
import { cn } from "@/lib/utils/cn";

export type SavingsGoalGameItem = {
  id: string;
  label: string;
  price: number;
  emoji?: string;
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

function shuffleIds(ids: readonly string[]): string[] {
  const next = [...ids];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j]!, next[i]!];
  }
  return next;
}

function renderItemLabel(item: SavingsGoalGameItem) {
  return (
    <>
      <span className={cn("min-w-0 flex-1 leading-snug", lessonInteractiveTextClass)}>
        {item.emoji ? `${item.emoji} ` : ""}
        {item.label}
      </span>
      <span className="shrink-0 font-heading text-sm font-extrabold text-[#0CC1E0] sm:text-base">
        {formatDollars(item.price)}
      </span>
    </>
  );
}

export function LessonSavingsGoalGame({
  meterLabel,
  targetAmount,
  poolColumnLabel,
  dropZoneLabel,
  items,
  workshopSignTitle,
  lockedLabel,
  unlockedLabel,
  goalAchievedLabel,
  onGoalReady,
  onAdvance,
  onItemSaved,
}: LessonSavingsGoalGameProps) {
  const itemById = useMemo(
    () => new Map(items.map((item) => [item.id, item])),
    [items],
  );

  const [poolIds, setPoolIds] = useState<string[]>(() =>
    shuffleIds(items.map((item) => item.id)),
  );
  const [depositedIds, setDepositedIds] = useState<string[]>([]);
  const [savedTotal, setSavedTotal] = useState(0);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [isOverDropZone, setIsOverDropZone] = useState(false);
  const [dropZoneGlow, setDropZoneGlow] = useState(false);
  const [goalAchieved, setGoalAchieved] = useState(false);

  const dropZoneRef = useRef<HTMLDivElement | null>(null);
  const chipRefs = useRef<Partial<Record<string, HTMLButtonElement | null>>>({});
  const captureTargetRef = useRef<HTMLElement | null>(null);
  const activePointerIdRef = useRef<number | null>(null);
  const glowTimeoutRef = useRef<number | null>(null);
  const onGoalReadyRef = useRef(onGoalReady);
  const onItemSavedRef = useRef(onItemSaved);
  onGoalReadyRef.current = onGoalReady;
  onItemSavedRef.current = onItemSaved;

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
    setIsOverDropZone(false);
  }, [releasePointerCapture]);

  useEffect(
    () => () => {
      endDrag();
      if (glowTimeoutRef.current !== null) {
        window.clearTimeout(glowTimeoutRef.current);
      }
    },
    [endDrag],
  );

  const isPointOverDropZone = useCallback((clientX: number, clientY: number) => {
    const node = dropZoneRef.current;
    if (!node) return false;
    const rect = node.getBoundingClientRect();
    return (
      clientX >= rect.left &&
      clientX <= rect.right &&
      clientY >= rect.top &&
      clientY <= rect.bottom
    );
  }, []);

  const triggerDropZoneGlow = useCallback(() => {
    setDropZoneGlow(true);
    if (glowTimeoutRef.current !== null) {
      window.clearTimeout(glowTimeoutRef.current);
    }
    glowTimeoutRef.current = window.setTimeout(() => {
      setDropZoneGlow(false);
      glowTimeoutRef.current = null;
    }, 700);
  }, []);

  const depositItem = useCallback(
    (itemId: string) => {
      const item = itemById.get(itemId);
      if (!item || goalAchieved) return;

      setPoolIds((current) => {
        if (!current.includes(itemId)) return current;
        return current.filter((id) => id !== itemId);
      });

      setDepositedIds((current) =>
        current.includes(itemId) ? current : [...current, itemId],
      );

      setSavedTotal((current) => {
        const next = current + item.price;
        if (next >= targetAmount) {
          window.setTimeout(() => {
            setGoalAchieved(true);
            onGoalReadyRef.current();
          }, 200);
        }
        return next;
      });

      triggerDropZoneGlow();
      onItemSavedRef.current?.();
    },
    [goalAchieved, itemById, targetAmount, triggerDropZoneGlow],
  );

  const handleChipPointerDown = (
    itemId: string,
    event: ReactPointerEvent<HTMLButtonElement>,
  ) => {
    if (goalAchieved) return;
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
    if (!dragState || goalAchieved) return;
    setDragState((current) =>
      current
        ? {
            ...current,
            x: event.clientX - current.offsetX,
            y: event.clientY - current.offsetY,
          }
        : null,
    );
    setIsOverDropZone(isPointOverDropZone(event.clientX, event.clientY));
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLElement>) => {
    if (!dragState || goalAchieved) {
      endDrag();
      return;
    }

    if (isPointOverDropZone(event.clientX, event.clientY)) {
      depositItem(dragState.itemId);
    }

    endDrag();
  };

  const draggedItem = dragState ? itemById.get(dragState.itemId) : null;
  const progressPercent = Math.min(100, (savedTotal / targetAmount) * 100);

  const columnShellClass =
    "flex min-h-0 flex-col gap-1.5 rounded-2xl border-2 border-dashed border-[#BDE9FB]/80 bg-[#F7FBFF]/50 p-2.5";

  return (
    <div
      className="flex min-h-0 flex-1 flex-col touch-none select-none"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={endDrag}
    >
      <div className="mb-2 shrink-0">
        <div className="flex items-center justify-between gap-2">
          <p className={lessonColumnLabelClass}>{meterLabel}</p>
          <p
            className="font-heading text-sm font-extrabold tabular-nums text-[#031F82]"
            aria-live="polite"
          >
            {formatDollars(savedTotal)} / {formatDollars(targetAmount)}
          </p>
        </div>
        <div
          className="mt-1 h-2 overflow-hidden rounded-full bg-[#BDE9FB]/50"
          role="progressbar"
          aria-valuenow={savedTotal}
          aria-valuemin={0}
          aria-valuemax={targetAmount}
          aria-label={`${meterLabel}: ${formatDollars(savedTotal)} of ${formatDollars(targetAmount)}`}
        >
          <div
            className="h-full rounded-full bg-[#0CC1E0] transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-2 gap-2">
        <div className={columnShellClass}>
          <p className={cn("shrink-0", lessonColumnLabelClass)}>{poolColumnLabel}</p>
          <div className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto">
            {poolIds.length > 0 ? (
              poolIds.map((itemId) => {
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
                      lessonSortRowClass,
                      "min-h-[3rem] justify-between px-3 py-2.5",
                      isDragging && "opacity-30",
                    )}
                  >
                    {renderItemLabel(item)}
                  </button>
                );
              })
            ) : (
              <p className="flex flex-1 items-center justify-center text-center font-heading text-sm font-bold text-[#22C55E]">
                All moved!
              </p>
            )}
          </div>
        </div>

        <div
          ref={dropZoneRef}
          className={cn(
            columnShellClass,
            "transition-all duration-300",
            (isOverDropZone || dropZoneGlow) && lessonSortBucketActiveClass,
            goalAchieved && "border-[#16A34A] bg-[#DCFCE7]/40 ring-2 ring-[#22C55E]/40",
          )}
        >
          <p className={cn("shrink-0", lessonColumnLabelClass)}>{dropZoneLabel}</p>
          <div className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto">
            {depositedIds.length > 0 ? (
              depositedIds.map((itemId) => {
                const item = itemById.get(itemId);
                if (!item) return null;
                return (
                  <div
                    key={itemId}
                    className="flex min-h-[3rem] items-center justify-between gap-2 rounded-full border border-[#BDE9FB] bg-white px-3 py-2.5 font-heading font-bold text-[#031F82]"
                  >
                    {renderItemLabel(item)}
                  </div>
                );
              })
            ) : (
              <p className="flex flex-1 items-center justify-center text-center font-sans text-sm text-[#1E3A5F]/50">
                Drop items here
              </p>
            )}
          </div>
        </div>
      </div>

      <div
        className={cn(
          "mt-2 shrink-0 rounded-xl border border-[#BDE9FB] bg-[#F7FBFF] px-3 py-2.5 text-center transition-all duration-300",
          goalAchieved && "border-[#22C55E] bg-[#DCFCE7]/45",
        )}
      >
        <p className="font-heading text-sm font-extrabold leading-snug text-[#031F82]">
          {workshopSignTitle}
        </p>
        <div className="mt-2 flex flex-col items-center gap-1.5">
          {goalAchieved ? (
            <p className="font-heading text-sm font-extrabold uppercase tracking-wide text-[#16A34A]">
              {goalAchievedLabel}
            </p>
          ) : null}
          {goalAchieved ? (
            <button
              type="button"
              onClick={onAdvance}
              className={cn(lessonGoldClaimClass, "h-auto min-h-0 w-full max-w-none py-2.5 text-sm")}
            >
              {unlockedLabel}
            </button>
          ) : (
            <span className="inline-flex items-center justify-center rounded-full border border-[#BDE9FB] bg-[#E8F6FC] px-3 py-1.5 font-heading text-sm font-bold uppercase tracking-wide text-[#1E3A5F]/50">
              {lockedLabel}
            </span>
          )}
        </div>
      </div>

      {draggedItem && dragState ? (
        <OverlayPortal>
          <div
            className={cn(
              lessonSortRowClass,
              "pointer-events-none fixed px-3 py-2.5 text-left shadow-lg",
            )}
            style={{
              left: dragState.x,
              top: dragState.y,
              width: dragState.width,
            }}
          >
            {renderItemLabel(draggedItem)}
          </div>
        </OverlayPortal>
      ) : null}
    </div>
  );
}
