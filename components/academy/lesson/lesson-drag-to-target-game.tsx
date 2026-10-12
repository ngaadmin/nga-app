"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { OverlayPortal } from "@/components/ui/overlay-portal";
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
  sourceIllustrationSrc?: string;
  sourceIllustrationAlt?: string;
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
const DRAG_TO_TARGET_MAX_COINS = 3;
const COIN_CHIP_CLASS =
  "grid size-11 place-items-center rounded-full bg-[#FFA503] text-xl";
const SINGLE_SOURCE_CLASS = "grid size-20 place-items-center text-5xl";

const CHARACTER_EMOJI: Record<string, string> = {
  mia: "👧",
  immi: "👧",
  senna: "👦",
  dash: "👦",
  max: "👦",
};

/** Person emoji for a target written as a name, including “Share with Mia”. */
export function personEmojiForTargetLabel(label: string): string | undefined {
  const words = label.match(/[A-Za-z][A-Za-z'-]*/g) ?? [];
  for (const word of words) {
    const known = CHARACTER_EMOJI[word.toLowerCase()];
    if (known) return known;
  }
  if (/\b(?:with|to)\s+[A-Z][a-z]+\b/.test(label)) return "🧒";
  if (/^[A-Z][a-z]+$/.test(label.trim())) return "🧒";
  return undefined;
}
const LANDED_COIN_CLASS =
  "grid size-[22px] place-items-center rounded-full bg-[#FFA503] text-[12px]";
const DRAG_ILLUSTRATION_FRAME_CLASS =
  "relative flex h-[9rem] shrink-0 items-center justify-center sm:h-[11rem]";
const DRAG_ILLUSTRATION_IMAGE_CLASS =
  "block h-[9rem] w-auto object-contain object-center sm:h-[11rem]";

export function LessonDragToTargetGame({
  sourceLabel,
  targetLabel,
  itemEmoji = "🪙",
  coinCount = 1,
  targetEmoji = "🐷",
  sourceIllustrationSrc,
  sourceIllustrationAlt,
  targetIllustrationSrc,
  targetIllustrationAlt,
  targetImagePlaceholder,
  sourceEmptyMessage = "Coins saved!",
  showZoneLabels = true,
  onComplete,
  onSuccess,
  onMiss,
}: LessonDragToTargetGameProps) {
  const totalCoins = Math.min(
    DRAG_TO_TARGET_MAX_COINS,
    Math.max(1, coinCount),
  );
  const singleSource = totalCoins === 1 && !sourceIllustrationSrc;
  const sourceChipClass = singleSource ? SINGLE_SOURCE_CLASS : COIN_CHIP_CLASS;
  const characterEmoji = personEmojiForTargetLabel(targetLabel);
  const resolvedTargetEmoji = characterEmoji ?? targetEmoji;
  const [remaining, setRemaining] = useState(totalCoins);
  const [landed, setLanded] = useState(0);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [targetImageFailed, setTargetImageFailed] = useState(false);
  const [sourceImageFailed, setSourceImageFailed] = useState(false);

  const boardRef = useRef<HTMLDivElement | null>(null);
  const targetRef = useRef<HTMLDivElement | null>(null);
  const captureTargetRef = useRef<HTMLElement | null>(null);
  const activePointerIdRef = useRef<number | null>(null);
  const dragStateRef = useRef<DragState | null>(null);
  const remainingRef = useRef(totalCoins);

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
    dragStateRef.current = null;
    setDragState(null);
  }, [releasePointerCapture]);

  useEffect(() => () => endDrag(), [endDrag]);

  useEffect(() => {
    setTargetImageFailed(false);
  }, [targetIllustrationSrc]);

  useEffect(() => {
    setSourceImageFailed(false);
  }, [sourceIllustrationSrc]);

  const showSourceIllustration = Boolean(
    sourceIllustrationSrc && !sourceImageFailed,
  );

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
    try {
      captureTarget.setPointerCapture(event.pointerId);
    } catch {
      captureTargetRef.current = null;
    }

    const nextDrag: DragState = {
      coinIndex,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      x: rect.left,
      y: rect.top,
    };
    dragStateRef.current = nextDrag;
    setDragState(nextDrag);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    if (activePointerIdRef.current !== event.pointerId) return;
    const current = dragStateRef.current;
    if (!current) return;
    const moved: DragState = {
      ...current,
      x: event.clientX - current.offsetX,
      y: event.clientY - current.offsetY,
    };
    dragStateRef.current = moved;
    setDragState(moved);
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLElement>) => {
    if (activePointerIdRef.current !== event.pointerId) return;

    if (!dragStateRef.current) {
      endDrag();
      return;
    }

    if (isPointOverTarget(event.clientX, event.clientY)) {
      const next = Math.max(0, remainingRef.current - 1);
      remainingRef.current = next;
      setRemaining(next);
      setLanded((current) => current + 1);
      if (next === 0) {
        onSuccessRef.current?.();
        onCompleteRef.current();
      }
      endDrag();
      return;
    }

    onMissRef.current?.();
    endDrag();
  };

  const renderSourceIllustration = (alt: string) =>
    sourceIllustrationSrc ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={sourceIllustrationSrc}
        alt={alt}
        className={DRAG_ILLUSTRATION_IMAGE_CLASS}
        decoding="async"
        draggable={false}
        onError={() => setSourceImageFailed(true)}
      />
    ) : null;

  const renderJarStack = () => {
    if (landed <= 0) return null;
    if (showSourceIllustration) {
      return (
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          {renderSourceIllustration("")}
        </div>
      );
    }
    return (
      <div className="pointer-events-none absolute inset-0 flex flex-wrap content-center justify-center gap-0.5 p-[18px]">
        {Array.from({ length: landed }, (_, index) => (
          <span key={index} className={LANDED_COIN_CLASS} aria-hidden>
            {itemEmoji}
          </span>
        ))}
      </div>
    );
  };

  const renderTargetVisual = () => {
    if (targetIllustrationSrc && !targetImageFailed) {
      return (
        <div className={DRAG_ILLUSTRATION_FRAME_CLASS}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={targetIllustrationSrc}
            alt={targetIllustrationAlt ?? targetLabel}
            className={DRAG_ILLUSTRATION_IMAGE_CLASS}
            decoding="async"
            draggable={false}
            onError={() => setTargetImageFailed(true)}
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
      <div className="flex flex-col items-center gap-2">
        <div
          className="relative grid size-[104px] place-items-center rounded-full bg-[#E8F6FC] text-4xl"
          aria-label={targetLabel}
        >
          {resolvedTargetEmoji}
          {renderJarStack()}
        </div>
        {characterEmoji ? (
          <p className="max-w-[9rem] text-center font-heading text-sm font-bold text-[#031F82]">
            {targetLabel}
          </p>
        ) : null}
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
              "cursor-grab bg-transparent p-0 active:cursor-grabbing",
              showSourceIllustration
                ? DRAG_ILLUSTRATION_FRAME_CLASS
                : sourceChipClass,
              dragState?.coinIndex === index && "opacity-25",
            )}
            aria-label={`Drag ${sourceLabel.toLowerCase()} to ${targetLabel}`}
            style={{ touchAction: "none" }}
          >
            {showSourceIllustration
              ? renderSourceIllustration(sourceIllustrationAlt ?? sourceLabel)
              : itemEmoji}
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
          "flex min-h-[120px] items-center justify-center gap-6 py-4",
          !showZoneLabels && "min-h-[10.5rem]",
        )}
      >
        <div className="flex items-center">{renderSourceCoins()}</div>
        <div ref={targetRef}>{renderTargetVisual()}</div>
      </div>

      {dragState ? (
        <OverlayPortal>
          <div
            className={cn(
              "pointer-events-none fixed z-overlay",
              showSourceIllustration
                ? DRAG_ILLUSTRATION_FRAME_CLASS
                : sourceChipClass,
            )}
            style={{
              left: dragState.x,
              top: dragState.y,
            }}
          >
            {showSourceIllustration
              ? renderSourceIllustration("")
              : itemEmoji}
          </div>
        </OverlayPortal>
      ) : null}
    </div>
  );
}
