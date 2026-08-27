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
  lessonInlineMediaImageClass,
  lessonTwoColumnGridClass,
} from "@/components/academy/lesson/lesson-shared-styles";
import {
  LessonColumnLabel,
  LessonImagePlaceholder,
} from "@/components/academy/lesson/lesson-ui";
import { cn } from "@/lib/utils/cn";

type DragState = {
  offsetX: number;
  offsetY: number;
  x: number;
  y: number;
  width: number;
  height: number;
};

type DragItemSize = "md" | "lg";

type LessonDragToTargetGameProps = {
  sourceLabel: string;
  targetLabel: string;
  itemEmoji?: string;
  itemSize?: DragItemSize;
  coinCount?: number;
  targetEmoji?: string;
  targetIllustrationSrc?: string;
  targetIllustrationAlt?: string;
  targetImagePlaceholder?: {
    label: string;
    alt?: string;
  };
  sourceEmptyMessage?: string;
  /** When false, hide visible zone labels (keep them in aria text). Default true. */
  showZoneLabels?: boolean;
  onComplete: () => void;
  onSuccess?: () => void;
  onMiss?: () => void;
};

const TARGET_DROP_HIT_PADDING_PX = 24;

const ITEM_BOX_CLASS: Record<DragItemSize, string> = {
  md: "relative h-20 w-20",
  lg: "relative h-36 w-36 sm:h-40 sm:w-40",
};

const ITEM_EMOJI_CLASS: Record<DragItemSize, string> = {
  md: "absolute left-1/2 top-1/2 block -translate-x-1/2 -translate-y-1/2 text-3xl sm:text-4xl",
  lg: "absolute left-1/2 top-1/2 block -translate-x-1/2 -translate-y-1/2 text-7xl sm:text-8xl",
};

export function LessonDragToTargetGame({
  sourceLabel,
  targetLabel,
  itemEmoji = "🪙",
  itemSize = "md",
  coinCount = 5,
  targetEmoji = "🐷",
  targetIllustrationSrc,
  targetIllustrationAlt,
  targetImagePlaceholder,
  sourceEmptyMessage = "Coins saved!",
  showZoneLabels = true,
  onComplete,
  onSuccess,
  onMiss,
}: LessonDragToTargetGameProps) {
  const [deposited, setDeposited] = useState(false);
  const [dragState, setDragState] = useState<DragState | null>(null);

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
    endDrag();
  };

  const handlePointerCancel = () => {
    endDrag();
  };

  const renderCoinStack = (interactive: boolean) => (
    <div className={ITEM_BOX_CLASS[itemSize]}>
      {Array.from({ length: coinCount }, (_, index) => (
        <span
          key={index}
          className={ITEM_EMOJI_CLASS[itemSize]}
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
        <span className="sr-only">{`Drag ${sourceLabel.toLowerCase()} to ${targetLabel}`}</span>
      ) : null}
    </div>
  );

  const renderDepositedOverlay = () =>
    deposited ? (
      <div className="pointer-events-none absolute inset-0 flex items-end justify-center pb-2">
        {renderCoinStack(false)}
      </div>
    ) : null;

  const renderTargetVisual = (size: "md" | "lg" = "md") => {
    const isLarge = size === "lg";
    if (targetIllustrationSrc) {
      return (
        <div
          className={cn(
            "relative w-full min-w-0 shrink-0",
            isLarge
              ? "max-w-[18rem] sm:max-w-[20rem]"
              : "max-w-[10rem] sm:max-w-[12rem]",
          )}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={targetIllustrationSrc}
            alt={targetIllustrationAlt ?? targetLabel}
            className={cn(
              lessonInlineMediaImageClass,
              isLarge
                ? "max-h-[18rem] sm:max-h-[20rem]"
                : "max-h-[10rem] sm:max-h-[12rem]",
            )}
            decoding="async"
            draggable={false}
          />
          {renderDepositedOverlay()}
        </div>
      );
    }

    if (targetImagePlaceholder) {
      return (
        <div className="relative w-full min-w-0 max-w-full shrink-0">
          <LessonImagePlaceholder
            label={targetImagePlaceholder.label}
            alt={targetImagePlaceholder.alt}
            size="compact"
          />
          {renderDepositedOverlay()}
        </div>
      );
    }

    return (
      <div className="relative flex h-20 w-20 items-center justify-center text-5xl">
        {targetEmoji}
        {deposited ? (
          <div className="absolute inset-0 flex items-center justify-center text-xl">
            {renderCoinStack(false)}
          </div>
        ) : null}
      </div>
    );
  };

  const renderSourceControl = () => {
    if (!deposited && !dragState) {
      return (
        <button
          ref={stackRef}
          type="button"
          onPointerDown={handleStackPointerDown}
          className="cursor-grab rounded-full p-1 active:cursor-grabbing"
          aria-label={`Drag ${sourceLabel.toLowerCase()} to ${targetLabel}`}
          style={{ touchAction: "none" }}
        >
          {renderCoinStack(true)}
        </button>
      );
    }

    if (deposited) {
      return (
        <p className="font-sans text-sm text-[#1E3A5F]/60">{sourceEmptyMessage}</p>
      );
    }

    return <div className={ITEM_BOX_CLASS[itemSize]} aria-hidden />;
  };

  const renderDragGhost = () =>
    dragState && !deposited ? (
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
    ) : null;

  return (
    <div
      ref={boardRef}
      className={cn(
        "touch-none select-none",
        showZoneLabels ? "mt-4" : "relative mt-4 min-h-[16.5rem] sm:min-h-[18.5rem]",
      )}
      style={{ touchAction: "none" }}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
    >
      {showZoneLabels ? (
        <div className={lessonTwoColumnGridClass}>
          <div className="flex min-h-[8rem] flex-col items-center justify-center gap-2 text-center">
            <LessonColumnLabel>{sourceLabel}</LessonColumnLabel>
            {renderSourceControl()}
          </div>

          <div
            ref={targetRef}
            className="flex min-h-[8rem] flex-col items-center justify-center gap-2 text-center"
          >
            <LessonColumnLabel>{targetLabel}</LessonColumnLabel>
            {renderTargetVisual("md")}
          </div>
        </div>
      ) : (
        <>
          <div
            ref={targetRef}
            className="absolute bottom-0 right-0 flex w-[72%] max-w-[20rem] items-end justify-end"
          >
            {renderTargetVisual("lg")}
          </div>
          <div className="absolute bottom-[3%] left-[20%] z-raised flex items-end justify-center sm:left-[22%]">
            {renderSourceControl()}
          </div>
        </>
      )}

      {renderDragGhost()}
    </div>
  );
}
