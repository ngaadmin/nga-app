"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  lessonIntroClass,
  lessonRankOrderCardClass,
  lessonSubmitAnswerClass,
} from "@/components/academy/lesson/lesson-shared-styles";
import { OverlayPortal } from "@/components/ui/overlay-portal";
import { cn } from "@/lib/utils/cn";
import type { RankOrderItem } from "@/lib/academy/lessons/types/screens/rank-order";

type LessonRankOrderGameProps = {
  intro: string;
  dragHint?: string;
  axisLabel?: string;
  submitLabel?: string;
  items: readonly RankOrderItem[];
  correctOrder: readonly string[];
  errors: Record<string, string>;
  onComplete: () => void;
  onMistake: () => void;
  onSuccess?: () => void;
  onPersistentError?: (message: string) => void;
  onDismissError?: () => void;
};

/** Minimum pointer travel before a reorder swap fires. */
const RANK_DRAG_REORDER_THRESHOLD_PX = 28;

function resolveRankRowIndexFromPointer(
  clientY: number,
  order: readonly string[],
  rowElements: Partial<Record<string, HTMLDivElement | null>>,
): number {
  for (let index = 0; index < order.length; index += 1) {
    const row = rowElements[order[index]!];
    if (!row) continue;
    const rect = row.getBoundingClientRect();
    const midpoint = rect.top + rect.height / 2;
    if (clientY < midpoint) {
      return index;
    }
  }

  return order.length - 1;
}

export function LessonRankOrderGame({
  intro,
  dragHint = "Drag the choices into the best order, starting with the strongest option at the top.",
  axisLabel = "Best → Avoid",
  submitLabel = "Submit Answer",
  items,
  correctOrder,
  errors,
  onComplete,
  onMistake,
  onSuccess,
  onPersistentError,
  onDismissError,
}: LessonRankOrderGameProps) {
  type ItemId = string;

  const [rankOrder, setRankOrder] = useState<ItemId[]>(() =>
    [...items].map((item) => item.id).reverse(),
  );
  const [rankSubmitted, setRankSubmitted] = useState(false);
  const [dragRankId, setDragRankId] = useState<ItemId | null>(null);
  const [dragGhost, setDragGhost] = useState<{
    x: number;
    y: number;
    width: number;
    label: string;
    index: number;
  } | null>(null);

  const rankOrderRef = useRef(rankOrder);
  rankOrderRef.current = rankOrder;
  const rowRefs = useRef<Partial<Record<ItemId, HTMLDivElement | null>>>({});
  const boardRef = useRef<HTMLDivElement | null>(null);
  const captureTargetRef = useRef<HTMLElement | null>(null);
  const activePointerIdRef = useRef<number | null>(null);
  const lastReorderYRef = useRef<number | null>(null);

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
    setDragRankId(null);
    setDragGhost(null);
    lastReorderYRef.current = null;
  }, [releasePointerCapture]);

  useEffect(() => () => endDrag(), [endDrag]);

  const moveRankItem = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (fromIndex === toIndex || rankSubmitted) return;
      setRankOrder((current) => {
        const next = [...current];
        const [moved] = next.splice(fromIndex, 1);
        if (!moved) return current;
        next.splice(toIndex, 0, moved);
        rankOrderRef.current = next;
        return next;
      });
    },
    [rankSubmitted],
  );

  const reorderDraggedRank = useCallback(
    (clientY: number) => {
      if (!dragRankId || rankSubmitted) return;

      const lastY = lastReorderYRef.current;
      if (lastY !== null && Math.abs(clientY - lastY) < RANK_DRAG_REORDER_THRESHOLD_PX) {
        return;
      }

      const fromIndex = rankOrderRef.current.indexOf(dragRankId);
      if (fromIndex < 0) return;

      const toIndex = resolveRankRowIndexFromPointer(
        clientY,
        rankOrderRef.current,
        rowRefs.current,
      );

      if (toIndex >= 0 && fromIndex !== toIndex) {
        moveRankItem(fromIndex, toIndex);
        lastReorderYRef.current = clientY;
      }
    },
    [dragRankId, moveRankItem, rankSubmitted],
  );

  const handleRankPointerDown = (
    event: ReactPointerEvent<HTMLDivElement>,
    itemId: ItemId,
  ) => {
    if (rankSubmitted) return;
    event.preventDefault();
    event.stopPropagation();
    const captureTarget = boardRef.current ?? event.currentTarget;
    captureTargetRef.current = captureTarget;
    activePointerIdRef.current = event.pointerId;
    captureTarget.setPointerCapture(event.pointerId);
    lastReorderYRef.current = event.clientY;
    setDragRankId(itemId);
    setDragGhost({
      x: event.clientX - 40,
      y: event.clientY - 24,
      width: event.currentTarget.getBoundingClientRect().width,
      label: items.find((entry) => entry.id === itemId)?.label ?? "",
      index: rankOrderRef.current.indexOf(itemId),
    });
  };

  const handleBoardPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragRankId || activePointerIdRef.current !== event.pointerId) return;
    setDragGhost((current) =>
      current
        ? { ...current, x: event.clientX - 40, y: event.clientY - 24 }
        : null,
    );
    reorderDraggedRank(event.clientY);
  };

  const handleBoardPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (activePointerIdRef.current !== event.pointerId) return;
    endDrag();
  };

  const getRankSubmitError = (order: ItemId[]): string | undefined => {
    for (let i = 0; i < correctOrder.length; i += 1) {
      if (order[i] !== correctOrder[i]) {
        const wrongId = order[i];
        if (wrongId && errors[wrongId]?.trim()) return errors[wrongId]!.trim();
        break;
      }
    }
    return Object.values(errors).find((entry) => entry?.trim())?.trim();
  };

  const handleSubmit = () => {
    if (rankSubmitted) return;
    const valid =
      rankOrder.length === correctOrder.length &&
      rankOrder.every((id, index) => id === correctOrder[index]);

    if (valid) {
      onDismissError?.();
      setRankSubmitted(true);
      onSuccess?.();
      onComplete();
      return;
    }

    onMistake();
    onPersistentError?.(getRankSubmitError(rankOrder) ?? "");
  };

  return (
    <>
      <p className={cn("mb-5", lessonIntroClass())}>{intro}</p>
      <div
        ref={boardRef}
        className="flex flex-col gap-2"
        onPointerMove={handleBoardPointerMove}
        onPointerUp={handleBoardPointerUp}
        onPointerCancel={handleBoardPointerUp}
      >
        {rankOrder.map((itemId, index) => {
          const item = items.find((entry) => entry.id === itemId);
          if (!item) return null;
          const isDragging = dragRankId === itemId;
          return (
            <div
              key={itemId}
              ref={(node) => {
                rowRefs.current[itemId] = node;
              }}
              role="button"
              tabIndex={rankSubmitted ? -1 : 0}
              aria-grabbed={isDragging}
              aria-label={`Reorder: ${item.label}`}
              onPointerDown={(event) => handleRankPointerDown(event, itemId)}
              onKeyDown={(event) => {
                if (rankSubmitted) return;
                if (event.key === "ArrowUp" && index > 0) {
                  event.preventDefault();
                  moveRankItem(index, index - 1);
                }
                if (event.key === "ArrowDown" && index < rankOrder.length - 1) {
                  event.preventDefault();
                  moveRankItem(index, index + 1);
                }
              }}
              className={cn(
                lessonRankOrderCardClass,
                !rankSubmitted && "cursor-grab active:cursor-grabbing",
                isDragging && "invisible",
              )}
              style={{ touchAction: rankSubmitted ? "auto" : "none" }}
            >
              <span className="text-center font-extrabold text-[#031F82]" aria-hidden>
                {index + 1}
              </span>
              <span>{item.label}</span>
            </div>
          );
        })}
      </div>
      {dragGhost ? (
        <OverlayPortal className="overflow-visible">
          <div
            className={cn(
              lessonRankOrderCardClass,
              "pointer-events-none fixed z-overlay shadow-[0_10px_24px_rgba(3,31,130,0.18)]",
            )}
            style={{
              left: dragGhost.x,
              top: dragGhost.y,
              width: dragGhost.width,
            }}
          >
            <span className="text-center font-extrabold text-[#031F82]" aria-hidden>
              {rankOrder.indexOf(dragRankId ?? "") + 1}
            </span>
            <span>{dragGhost.label}</span>
          </div>
        </OverlayPortal>
      ) : null}
      {!rankSubmitted ? (
        <div className="mt-3 flex w-full justify-center">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              handleSubmit();
            }}
            className={lessonSubmitAnswerClass}
          >
            {submitLabel}
          </button>
        </div>
      ) : null}
    </>
  );
}
