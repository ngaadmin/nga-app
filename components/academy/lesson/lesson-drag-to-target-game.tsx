"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { OverlayPortal } from "@/components/ui/overlay-portal";
import { lessonInlineMediaImageClass } from "@/components/academy/lesson/lesson-shared-styles";
import { LessonImagePlaceholder } from "@/components/academy/lesson/lesson-ui";
import { cn } from "@/lib/utils/cn";

type DragState = {
  coinIndex: number;
  offsetX: number;
  offsetY: number;
  x: number;
  y: number;
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
  showZoneLabels?: boolean;
  onComplete: () => void;
  onSuccess?: () => void;
  onMiss?: () => void;
};

const TARGET_DROP_HIT_PADDING_PX = 24;
const COIN_CHIP_CLASS =
  "grid size-11 place-items-center rounded-full bg-[#FFA503] text-xl";
const LANDED_COIN_CLASS =
  "grid size-[22px] place-items-center rounded-full bg-[#FFA503] text-[12px]";

export function LessonDragToTargetGame({
  sourceLabel,
  targetLabel,
  itemEmoji = "🪙",
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
  const totalCoins = Math.max(1, coinCount);
  const [remaining, setRemaining] = useState(totalCoins);
  const [landed, setLanded] = useState(0);
  const [dragState, setDragState] = useState<DragState | null>(null);

  const boardRef = useRef<HTMLDivElement | null>(null);
  const targetRef = useRef<HTMLDivElement | null>(null);
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

  const handleCoinPointerDown = (
    event: ReactPointerEvent<HTMLButtonElement>,
    coinIndex: number,
  ) => {
    if (remaining <= 0 || dragState) return;
    event.preventDefault();
    event.stopPropagation();

    const rect = event.currentTarget.getBoundingClientRect();
    const captureTarget = boardRef.current ?? event.currentTarget;
    captureTargetRef.current = captureTarget;
    activePointerIdRef.current = event.pointerId;
    captureTarget.setPointerCapture(event.pointerId);

    setDragState({
      coinIndex,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      x: rect.left,
      y: rect.top,
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
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLElement>) => {
    if (activePointerIdRef.current !== event.pointerId) return;

    if (!dragState) {
      endDrag();
      return;
    }

    if (isPointOverTarget(event.clientX, event.clientY)) {
      setRemaining((current) => {
        const next = Math.max(0, current - 1);
        if (next === 0) {
          onSuccessRef.current?.();
          window.setTimeout(() => onCompleteRef.current(), 0);
        }
        return next;
      });
      setLanded((current) => current + 1);
      endDrag();
      return;
    }

    onMissRef.current?.();
    endDrag();
  };

  const renderJarStack = () => (
    <div className="pointer-events-none absolute inset-0 flex flex-wrap content-center justify-center gap-0.5 p-[18px]">
      {Array.from({ length: landed }, (_, index) => (
        <span key={index} className={LANDED_COIN_CLASS} aria-hidden>
          {itemEmoji}
        </span>
      ))}
    </div>
  );

  const renderTargetVisual = () => {
    if (targetIllustrationSrc) {
      return (
        <div className="relative w-full min-w-0 max-w-[10rem] shrink-0 sm:max-w-[12rem]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={targetIllustrationSrc}
            alt={targetIllustrationAlt ?? targetLabel}
            className={cn(lessonInlineMediaImageClass, "max-h-[10rem] sm:max-h-[12rem]")}
            decoding="async"
            draggable={false}
          />
          {renderJarStack()}
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
          {renderJarStack()}
        </div>
      );
    }

    return (
      <div
        className="relative grid size-[104px] place-items-center rounded-full bg-[#E8F6FC] text-4xl"
        aria-label={targetLabel}
      >
        {targetEmoji}
        {renderJarStack()}
      </div>
    );
  };

  const renderSourceCoins = () => {
    if (remaining <= 0) {
      return (
        <p className="font-sans text-sm text-[#1E3A5F]/60">{sourceEmptyMessage}</p>
      );
    }

    return (
      <div className="flex gap-2">
        {Array.from({ length: remaining }, (_, index) => (
          <button
            key={index}
            type="button"
            onPointerDown={(event) => handleCoinPointerDown(event, index)}
            className={cn(
              COIN_CHIP_CLASS,
              "cursor-grab active:cursor-grabbing",
              dragState?.coinIndex === index && "opacity-25",
            )}
            aria-label={`Drag ${sourceLabel.toLowerCase()} to ${targetLabel}`}
            style={{ touchAction: "none" }}
          >
            {itemEmoji}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div
      ref={boardRef}
      className="mt-4 touch-none select-none"
      style={{ touchAction: "none" }}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={endDrag}
    >
      <div
        className={cn(
          "flex min-h-[120px] items-center justify-between gap-3 py-4",
          !showZoneLabels && "min-h-[10.5rem]",
        )}
      >
        <div className="flex items-center">{renderSourceCoins()}</div>
        <div ref={targetRef}>{renderTargetVisual()}</div>
      </div>

      {dragState ? (
        <OverlayPortal>
          <div
            className={cn(COIN_CHIP_CLASS, "pointer-events-none fixed z-overlay")}
            style={{
              left: dragState.x,
              top: dragState.y,
            }}
          >
            {itemEmoji}
          </div>
        </OverlayPortal>
      ) : null}
    </div>
  );
}
