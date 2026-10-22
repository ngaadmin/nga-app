"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { useLessonShake } from "@/components/academy/lesson/hooks/use-lesson-screen-flow";
import {
  lessonIntroClass,
  lessonRankOrderCardClass,
  lessonSubmitAnswerClass,
} from "@/components/academy/lesson/lesson-shared-styles";
import { AnswerEmoji } from "@/components/academy/lesson/answer-emoji";
import { LessonAnswerTick, LessonPromptParagraphs } from "@/components/academy/lesson/lesson-ui";
import { OverlayPortal } from "@/components/ui/overlay-portal";
import {
  firstRankOrderError,
  openingRankOrder,
  rankOrderMatches,
} from "@/lib/academy/lessons/rank-order";
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
  onIncomplete?: () => void;
  onMistake: () => void;
  onSuccess?: () => void;
  onPersistentError?: (message: string) => void;
  onDismissError?: () => void;
};

/** Minimum pointer travel before a reorder swap fires. */
const RANK_DRAG_REORDER_THRESHOLD_PX = 12;

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
  items,
  correctOrder,
  errors,
  onComplete,
  onIncomplete,
  onMistake,
  onSuccess,
  onPersistentError,
  onDismissError,
}: LessonRankOrderGameProps) {
  type ItemId = string;

  const [rankOrder, setRankOrder] = useState<ItemId[]>(() =>
    openingRankOrder(
      items.map((item) => item.id),
      correctOrder,
    ),
  );
  const itemSignature = items.map((item) => item.id).join("|");
  const correctSignature = correctOrder.join("|");
  const [rankSubmitted, setRankSubmitted] = useState(false);
  const [dragRankId, setDragRankId] = useState<ItemId | null>(null);
  const [dragGhost, setDragGhost] = useState<{
    x: number;
    y: number;
    width: number;
    label: string;
    emoji: string;
  } | null>(null);

  const rankOrderRef = useRef(rankOrder);
  rankOrderRef.current = rankOrder;
  const rowRefs = useRef<Partial<Record<ItemId, HTMLDivElement | null>>>({});
  const boardRef = useRef<HTMLDivElement | null>(null);
  const captureTargetRef = useRef<HTMLElement | null>(null);
  const activePointerIdRef = useRef<number | null>(null);
  const lastReorderYRef = useRef<number | null>(null);
  const solvedRef = useRef(false);
  const { shakingKey, shake } = useLessonShake();
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const correctOrderRef = useRef(correctOrder);
  correctOrderRef.current = correctOrder;
  const onIncompleteRef = useRef(onIncomplete);
  onIncompleteRef.current = onIncomplete;

  useLayoutEffect(() => {
    const ids = itemsRef.current.map((item) => item.id);
    setRankOrder(openingRankOrder(ids, correctOrderRef.current));
    solvedRef.current = false;
    setRankSubmitted(false);
    onIncompleteRef.current?.();
  }, [correctSignature, itemSignature]);

  const checkOrder = () => {
    if (rankSubmitted || solvedRef.current) return;
    if (rankOrderMatches(rankOrderRef.current, correctOrder)) {
      solvedRef.current = true;
      setRankSubmitted(true);
      onDismissError?.();
      onSuccess?.();
      onComplete();
      return;
    }
    onMistake();
    shake("board");
    const message = firstRankOrderError(errors);
    if (message) onPersistentError?.(message);
    else onDismissError?.();
  };

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

  useEffect(() => {
    if (!dragRankId) return;
    const finish = () => endDrag();
    window.addEventListener("pointerup", finish);
    window.addEventListener("pointercancel", finish);
    return () => {
      window.removeEventListener("pointerup", finish);
      window.removeEventListener("pointercancel", finish);
    };
  }, [dragRankId, endDrag]);

  const moveRankItem = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (fromIndex === toIndex || rankSubmitted) return;
      onDismissError?.();
      setRankOrder((current) => {
        const next = [...current];
        const [moved] = next.splice(fromIndex, 1);
        if (!moved) return current;
        next.splice(toIndex, 0, moved);
        rankOrderRef.current = next;
        return next;
      });
    },
    [onDismissError, rankSubmitted],
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
    try {
      captureTarget.setPointerCapture(event.pointerId);
    } catch {
      captureTargetRef.current = null;
    }
    const pointerId = event.pointerId;
    const finishDrag = (pointerEvent: PointerEvent) => {
      if (pointerEvent.pointerId !== pointerId) return;
      window.removeEventListener("pointerup", finishDrag);
      window.removeEventListener("pointercancel", finishDrag);
      endDrag();
    };
    window.addEventListener("pointerup", finishDrag);
    window.addEventListener("pointercancel", finishDrag);
    lastReorderYRef.current = event.clientY;
    const item = items.find((entry) => entry.id === itemId);
    setDragRankId(itemId);
    setDragGhost({
      x: event.clientX - 40,
      y: event.clientY - 24,
      width: event.currentTarget.getBoundingClientRect().width,
      label: item?.label ?? "",
      emoji: item?.emoji ?? "📌",
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

  return (
    <>
      <LessonPromptParagraphs text={intro} className={cn("mb-5", lessonIntroClass())} />
      <div
        ref={boardRef}
        className={cn("flex flex-col gap-2", shakingKey === "board" && "lesson-tile-shake")}
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
              <AnswerEmoji emoji={item.emoji ?? "📌"} className="justify-self-center" />
              <span className="min-w-0 whitespace-normal break-normal leading-snug">
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
      {rankSubmitted ? (
        <div className="mt-3 flex justify-center">
          <LessonAnswerTick />
        </div>
      ) : (
        <button type="button" className={lessonSubmitAnswerClass} onClick={checkOrder}>
          Check order
        </button>
      )}
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
            <AnswerEmoji emoji={dragGhost.emoji} className="justify-self-center" />
            <span className="min-w-0 whitespace-normal break-normal leading-snug">
              {dragGhost.label}
            </span>
          </div>
        </OverlayPortal>
      ) : null}
    </>
  );
}
