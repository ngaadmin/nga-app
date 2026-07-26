"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { OverlayPortal } from "@/components/ui/overlay-portal";
import {
  lessonSortBucketActiveClass,
  lessonSortBucketClass,
  lessonTwoColumnGridClass,
} from "@/components/academy/lesson/lesson-shared-styles";
import { LessonColumnLabel } from "@/components/academy/lesson/lesson-ui";
import { cn } from "@/lib/utils/cn";

type DragState = {
  offsetX: number;
  offsetY: number;
  x: number;
  y: number;
  width: number;
  height: number;
};

type LessonDragToTargetGameProps = {
  sourceLabel: string;
  targetLabel: string;
  itemEmoji?: string;
  coinCount?: number;
  onComplete: () => void;
  onSuccess?: () => void;
  onMiss?: () => void;
};

const TARGET_DROP_HIT_PADDING_PX = 24;

export function LessonDragToTargetGame({
  sourceLabel,
  targetLabel,
  itemEmoji = "🪙",
  coinCount = 5,
  onComplete,
  onSuccess,
  onMiss,
}: LessonDragToTargetGameProps) {
  const [deposited, setDeposited] = useState(false);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [isOverTarget, setIsOverTarget] = useState(false);
  const [missedDrop, setMissedDrop] = useState(false);

  const boardRef = useRef<HTMLDivElement | null>(null);
  const targetRef = useRef<HTMLDivElement | null>(null);
  const stackRef = useRef<HTMLButtonElement | null>(null);
  const captureTargetRef = useRef<HTMLElement | null>(null);
  const activePointerIdRef = useRef<number | null>(null);

  const onCompleteRef = useRef(onComplete);
  const onSuccessRef = useRef(onSuccess);
  const onMissRef = useRef(onMiss);
  onCompleteRef.current = onComplete;
  onSuccessRef.current = onSuccess;
  onMissRef.current = onMiss;

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
    setIsOverTarget(false);
  }, [releasePointerCapture]);

  useEffect(() => () => endDrag(), [endDrag]);

  const isPointOverTarget = useCallback((clientX: number, clientY: number) => {
    const node = targetRef.current;
    if (!node) return false;
    const rect = node.getBoundingClientRect();
    const pad = TARGET_DROP_HIT_PADDING_PX;
    return (
      clientX >= rect.left - pad &&
      clientX <= rect.right + pad &&
      clientY >= rect.top - pad &&
      clientY <= rect.bottom + pad
    );
  }, []);

  const completeDeposit = useCallback(() => {
    setDeposited(true);
    endDrag();
    onSuccessRef.current?.();
    window.setTimeout(() => onCompleteRef.current(), 0);
  }, [endDrag]);

  const handleStackPointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (deposited || dragState) return;
    const stack = stackRef.current;
    if (!stack) return;

    event.preventDefault();
    event.stopPropagation();

    const rect = stack.getBoundingClientRect();
    const captureTarget = boardRef.current ?? event.currentTarget;
    captureTargetRef.current = captureTarget;
    activePointerIdRef.current = event.pointerId;
    captureTarget.setPointerCapture(event.pointerId);

    setDragState({
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height,
    });
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    if (!dragState || deposited || activePointerIdRef.current !== event.pointerId) {
      return;
    }
    setDragState((current) =>
      current
        ? {
            ...current,
            x: event.clientX - current.offsetX,
            y: event.clientY - current.offsetY,
          }
        : null,
    );
    setIsOverTarget(isPointOverTarget(event.clientX, event.clientY));
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLElement>) => {
    if (activePointerIdRef.current !== event.pointerId) return;

    if (!dragState || deposited) {
      endDrag();
      return;
    }

    if (isPointOverTarget(event.clientX, event.clientY)) {
      completeDeposit();
      return;
    }

    onMissRef.current?.();
    setMissedDrop(true);
    window.setTimeout(() => setMissedDrop(false), 500);
    endDrag();
  };

  const handlePointerCancel = () => {
    endDrag();
  };

  const renderCoinStack = (interactive: boolean) => (
    <div className="relative h-20 w-20">
      {Array.from({ length: coinCount }, (_, index) => (
        <span
          key={index}
          className="absolute left-1/2 top-1/2 block -translate-x-1/2 -translate-y-1/2 text-3xl sm:text-4xl"
          style={{
            transform: `translate(calc(-50% + ${index * 2}px), calc(-50% - ${index * 4}px))`,
            zIndex: index,
          }}
          aria-hidden={index > 0}
        >
          {itemEmoji}
        </span>
      ))}
      {interactive ? (
        <span className="sr-only">Drag coins to the piggy bank</span>
      ) : null}
    </div>
  );

  return (
    <div
      ref={boardRef}
      className="mt-4 touch-none select-none"
      style={{ touchAction: "none" }}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
    >
      <div className={lessonTwoColumnGridClass}>
        <div
          className={cn(
            "flex min-h-[10rem] flex-col items-center justify-center gap-2 text-center transition-colors",
            missedDrop && "rounded-2xl ring-2 ring-[#F59E0B]/40",
          )}
        >
          <LessonColumnLabel>{sourceLabel}</LessonColumnLabel>
          {!deposited && !dragState ? (
            <button
              ref={stackRef}
              type="button"
              onPointerDown={handleStackPointerDown}
              className="cursor-grab rounded-full p-1 active:cursor-grabbing"
              aria-label={`Drag coins from ${sourceLabel}`}
              style={{ touchAction: "none" }}
            >
              {renderCoinStack(true)}
            </button>
          ) : deposited ? (
            <p className="font-sans text-sm text-[#1E3A5F]/60">Coins saved!</p>
          ) : (
            <div className="h-20 w-20" aria-hidden />
          )}
        </div>

        <div
          ref={targetRef}
          className={cn(
            lessonSortBucketClass,
            "flex min-h-[10rem] flex-col items-center justify-center gap-3 p-4 text-center transition-colors",
            (isOverTarget || deposited) && lessonSortBucketActiveClass,
          )}
        >
          <LessonColumnLabel>{targetLabel}</LessonColumnLabel>
          <div
            className={cn(
              "relative flex h-20 w-20 items-center justify-center rounded-full bg-[#FFF7ED] text-5xl transition-transform",
              isOverTarget && !deposited && "scale-105 ring-2 ring-[#0CC1E0]/50",
              deposited && "scale-110 ring-2 ring-[#0CC1E0]/60",
            )}
            aria-hidden
          >
            🐷
            {deposited ? (
              <div className="absolute inset-0 flex items-center justify-center text-xl">
                {renderCoinStack(false)}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {dragState && !deposited ? (
        <OverlayPortal>
          <div
            className="pointer-events-none fixed z-overlay cursor-grabbing"
            style={{
              left: dragState.x,
              top: dragState.y,
              width: dragState.width,
              height: dragState.height,
            }}
          >
            {renderCoinStack(false)}
          </div>
        </OverlayPortal>
      ) : null}
    </div>
  );
}
