"use client";

import { useAcademyMediaSrc } from "@/lib/academy/media/academy-media-context";
import { reportAcademyMediaFailed } from "@/lib/academy/media/media-failure-client";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { useLessonShake } from "@/components/academy/lesson/hooks/use-lesson-screen-flow";
import { AnswerEmoji } from "@/components/academy/lesson/answer-emoji";
import { LessonAnswerTick, LessonImagePlaceholder } from "@/components/academy/lesson/lesson-ui";
import { OverlayPortal } from "@/components/ui/overlay-portal";
import { visibleDragSourceLabel } from "@/lib/academy/lessons/drag-source-column";
import { dragPositionFromPointer } from "@/lib/academy/lessons/drag-position";
import { dragHitsZone, domRectToDropRect } from "@/lib/academy/lessons/drop-hit";
import { cn } from "@/lib/utils/cn";

type DragState = {
  coinIndex: number;
  originPointerX: number;
  originPointerY: number;
  originLeft: number;
  originTop: number;
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
  /**
   * Draw the dragged picture at a quarter of the target picture's width.
   * Used when a small item (a coin) sits beside a much larger target.
   */
  quarterSource?: boolean;
  onComplete: () => void;
  onSuccess?: () => void;
  onMiss?: () => void;
};

const TAP_SELECT_PX = 10;
const DRAG_TO_TARGET_MAX_COINS = 3;
const COIN_CHIP_CLASS =
  "grid size-11 place-items-center rounded-full bg-[#FFA503]";
const SINGLE_SOURCE_CLASS = "grid size-20 place-items-center";

const CHARACTER_EMOJI: Record<string, string> = {
  mia: "👧",
  immi: "👧",
  senna: "👦",
  dash: "👦",
  max: "👦",
  pippa: "👧",
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
  "grid size-[22px] place-items-center rounded-full bg-[#FFA503]";
const DRAG_ILLUSTRATION_FRAME_CLASS =
  "relative h-[9rem] w-[9rem] shrink-0 sm:h-[11rem] sm:w-[11rem]";
const DRAG_ILLUSTRATION_IMAGE_CLASS =
  "absolute inset-0 h-full w-full object-contain object-center";
/**
 * Square gift art beside a tall portrait. `lg` is the sheet size.
 * Width is set on the frame. `w-auto` on the picture collapses to nothing
 * in mobile Safari, which leaves only the column label and no hit target.
 */
const PAIRED_SOURCE_FRAME_CLASS = {
  md: "relative h-[5rem] w-[5rem] shrink-0",
  lg: "relative h-[6rem] w-[6rem] shrink-0",
} as const;
const PAIRED_SOURCE_IMAGE_CLASS = {
  md: "absolute inset-0 h-full w-full object-contain object-center",
  lg: "absolute inset-0 h-full w-full object-contain object-center",
} as const;
const PAIRED_TARGET_FRAME_CLASS =
  "relative h-[11rem] w-[6.5rem] shrink-0 sm:h-[13rem] sm:w-[7.75rem]";
const PAIRED_TARGET_IMAGE_CLASS =
  "absolute inset-0 h-full w-full object-contain object-center";
const FITTED_IMAGE_CLASS = "block h-full w-full object-contain object-center";
/** Target width on the swipe screen. The coin is one quarter of this. */
const BANK_SIZE_CLASS = "[--bank-size:9rem] sm:[--bank-size:11rem]";
const BANK_FRAME_CLASS =
  "relative flex h-[var(--bank-size)] w-[var(--bank-size)] shrink-0 items-center justify-center";
const BANK_IMAGE_CLASS = "block h-full w-full object-contain object-center";
const COIN_FRAME_CLASS =
  "relative flex h-[calc(var(--bank-size)/4)] w-[calc(var(--bank-size)/4)] shrink-0 items-center justify-center";
const COIN_IMAGE_CLASS = "block h-full w-full object-contain object-center";

export function LessonDragToTargetGame({
  sourceLabel,
  targetLabel,
  itemEmoji = "🪙",
  itemSize = "lg",
  coinCount = 1,
  targetEmoji,
  sourceIllustrationSrc: localSourceIllustrationSrc,
  sourceIllustrationAlt,
  targetIllustrationSrc: localTargetIllustrationSrc,
  targetIllustrationAlt,
  targetImagePlaceholder,
  showZoneLabels = true,
  quarterSource = false,
  onComplete,
  onSuccess,
  onMiss,
}: LessonDragToTargetGameProps) {
  const sourceIllustrationSrc = useAcademyMediaSrc(localSourceIllustrationSrc);
  const targetIllustrationSrc = useAcademyMediaSrc(localTargetIllustrationSrc);
  const totalCoins = Math.min(
    DRAG_TO_TARGET_MAX_COINS,
    Math.max(1, coinCount),
  );
  const singleSource = totalCoins === 1 && !sourceIllustrationSrc;
  const sourceChipClass = singleSource ? SINGLE_SOURCE_CLASS : COIN_CHIP_CLASS;
  const characterEmoji = personEmojiForTargetLabel(targetLabel);
  const resolvedTargetEmoji = targetEmoji ?? characterEmoji ?? "🐷";
  const [remaining, setRemaining] = useState(totalCoins);
  const [landed, setLanded] = useState(0);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [selectedCoinIndex, setSelectedCoinIndex] = useState<number | null>(
    null,
  );
  const [targetImageFailed, setTargetImageFailed] = useState(false);
  const { shakingKey, shake } = useLessonShake();
  const [sourceImageFailed, setSourceImageFailed] = useState(false);

  const boardRef = useRef<HTMLDivElement | null>(null);
  const targetRef = useRef<HTMLButtonElement | null>(null);
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

  const hasSourceIllustration = Boolean(sourceIllustrationSrc);
  const showSourceIllustration = hasSourceIllustration && !sourceImageFailed;
  const pairedIllustrations =
    Boolean(sourceIllustrationSrc) && Boolean(targetIllustrationSrc) && !quarterSource;
  const pairedSize = itemSize === "md" ? "md" : "lg";
  const sourceFrameClass = pairedIllustrations
    ? PAIRED_SOURCE_FRAME_CLASS[pairedSize]
    : quarterSource
      ? COIN_FRAME_CLASS
      : DRAG_ILLUSTRATION_FRAME_CLASS;
  const sourceImageClass = pairedIllustrations
    ? PAIRED_SOURCE_IMAGE_CLASS[pairedSize]
    : quarterSource
      ? COIN_IMAGE_CLASS
      : DRAG_ILLUSTRATION_IMAGE_CLASS;
  const targetFrameClass = quarterSource
    ? BANK_FRAME_CLASS
    : pairedIllustrations
      ? PAIRED_TARGET_FRAME_CLASS
      : DRAG_ILLUSTRATION_FRAME_CLASS;
  const targetImageClass = quarterSource
    ? BANK_IMAGE_CLASS
    : pairedIllustrations
      ? PAIRED_TARGET_IMAGE_CLASS
      : DRAG_ILLUSTRATION_IMAGE_CLASS;

  const isPointOverTarget = useCallback((clientX: number, clientY: number) => {
    const node = targetRef.current;
    if (!node) return false;
    const drag = dragStateRef.current;
    return dragHitsZone(
      drag
        ? { x: drag.x, y: drag.y, width: drag.width, height: drag.height }
        : null,
      clientX,
      clientY,
      domRectToDropRect(node.getBoundingClientRect()),
    );
  }, []);

  const handleCoinPointerDown = (
    event: ReactPointerEvent<HTMLButtonElement>,
    coinIndex: number,
  ) => {
    if (remaining <= 0 || dragState || dragStateRef.current) return;
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

    const origin = {
      pointerX: event.clientX,
      pointerY: event.clientY,
      left: rect.left,
      top: rect.top,
    };
    const nextDrag: DragState = {
      coinIndex,
      originPointerX: origin.pointerX,
      originPointerY: origin.pointerY,
      originLeft: origin.left,
      originTop: origin.top,
      ...dragPositionFromPointer(origin, {
        x: event.clientX,
        y: event.clientY,
      }),
      width: rect.width,
      height: rect.height,
    };
    dragStateRef.current = nextDrag;
    setDragState(nextDrag);
  };

  const placeOneCoin = useCallback(() => {
    const next = Math.max(0, remainingRef.current - 1);
    remainingRef.current = next;
    setRemaining(next);
    setLanded((current) => current + 1);
    setSelectedCoinIndex(null);
    if (next === 0) {
      onSuccessRef.current?.();
      onCompleteRef.current();
    }
  }, []);

  const dropSelectedCoin = useCallback(() => {
    if (selectedCoinIndex === null || remainingRef.current <= 0) return;
    placeOneCoin();
  }, [placeOneCoin, selectedCoinIndex]);

  const handlePointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    if (activePointerIdRef.current !== event.pointerId) return;
    const current = dragStateRef.current;
    if (!current) return;
    const moved: DragState = {
      ...current,
      ...dragPositionFromPointer(
        {
          pointerX: current.originPointerX,
          pointerY: current.originPointerY,
          left: current.originLeft,
          top: current.originTop,
        },
        { x: event.clientX, y: event.clientY },
      ),
    };
    dragStateRef.current = moved;
    setDragState(moved);
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLElement>) => {
    if (activePointerIdRef.current !== event.pointerId) return;

    const current = dragStateRef.current;
    if (!current) {
      endDrag();
      return;
    }

    const moved = Math.hypot(
      event.clientX - current.originPointerX,
      event.clientY - current.originPointerY,
    );
    if (moved < TAP_SELECT_PX) {
      setSelectedCoinIndex(current.coinIndex);
      endDrag();
      return;
    }

    if (isPointOverTarget(event.clientX, event.clientY)) {
      placeOneCoin();
      endDrag();
      return;
    }

    shake("target");
    onMissRef.current?.();
    endDrag();
  };

  const selectCoinFromKeyboard = (
    event: ReactKeyboardEvent<HTMLButtonElement>,
    coinIndex: number,
  ) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    setSelectedCoinIndex(coinIndex);
  };

  const dropSelectedFromKeyboard = (
    event: ReactKeyboardEvent<HTMLButtonElement>,
  ) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    dropSelectedCoin();
  };

  const renderSourceIllustration = (fitted = false) =>
    sourceIllustrationSrc ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={sourceIllustrationSrc}
        alt=""
        className={cn(
          fitted ? FITTED_IMAGE_CLASS : sourceImageClass,
          sourceImageFailed && "hidden",
        )}
        loading="eager"
        fetchPriority="high"
        decoding="async"
        draggable={false}
        onError={() => {
          setSourceImageFailed(true);
          if (sourceIllustrationSrc) reportAcademyMediaFailed(sourceIllustrationSrc, "image");
        }}
      />
    ) : null;

  const renderJarStack = () => {
    if (landed <= 0) return null;
    if (showSourceIllustration) {
      return (
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          {quarterSource ? (
            <div className="h-1/4 w-1/4">{renderSourceIllustration(true)}</div>
          ) : pairedIllustrations ? (
            <div className="h-1/3 w-1/3">{renderSourceIllustration(true)}</div>
          ) : (
            renderSourceIllustration()
          )}
        </div>
      );
    }
    return (
      <div className="pointer-events-none absolute inset-0 flex flex-wrap content-center justify-center gap-0.5 p-[18px]">
        {Array.from({ length: landed }, (_, index) => (
          <span key={index} className={LANDED_COIN_CLASS} aria-hidden>
            <AnswerEmoji emoji={itemEmoji} />
          </span>
        ))}
      </div>
    );
  };

  const renderTargetVisual = () => {
    if (targetIllustrationSrc) {
      return (
        <div className={targetFrameClass} aria-label={targetIllustrationAlt ?? targetLabel}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={targetIllustrationSrc}
            alt=""
            className={cn(targetImageClass, targetImageFailed && "hidden")}
            loading="eager"
            fetchPriority="high"
            decoding="async"
            draggable={false}
            onError={() => {
              setTargetImageFailed(true);
              if (targetIllustrationSrc) reportAcademyMediaFailed(targetIllustrationSrc, "image");
            }}
          />
          {targetImageFailed ? (
            <span className="grid h-full w-full place-items-center text-6xl" aria-hidden>
              <AnswerEmoji emoji={resolvedTargetEmoji} />
            </span>
          ) : null}
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
          className="relative grid size-[104px] place-items-center rounded-full bg-[#E8F6FC]"
          aria-label={targetLabel}
        >
          <AnswerEmoji emoji={resolvedTargetEmoji} />
          {renderJarStack()}
        </div>
      </div>
    );
  };

  const sourceColumnLabel = visibleDragSourceLabel({
    remaining,
    showZoneLabels,
    sourceLabel,
  });

  const renderSourceCoins = () => {
    if (remaining <= 0) return null;

    return (
      <div className="flex gap-2">
        {Array.from({ length: remaining }, (_, index) => (
          <button
            key={index}
            type="button"
            onPointerDown={(event) => handleCoinPointerDown(event, index)}
            onKeyDown={(event) => selectCoinFromKeyboard(event, index)}
            aria-pressed={selectedCoinIndex === index}
            className={cn(
              "cursor-grab bg-transparent p-0 active:cursor-grabbing",
              hasSourceIllustration ? sourceFrameClass : sourceChipClass,
              dragState?.coinIndex === index && "opacity-25",
              selectedCoinIndex === index && "opacity-80",
            )}
            aria-label={`Select ${sourceIllustrationAlt ?? sourceLabel} ${index + 1} to drop on ${targetLabel}`}
            style={{ touchAction: "none" }}
          >
            {hasSourceIllustration ? renderSourceIllustration() : null}
            {showSourceIllustration ? null : (
              <span
                className={cn(hasSourceIllustration && "grid h-full w-full place-items-center")}
                aria-hidden={hasSourceIllustration}
              >
                <AnswerEmoji emoji={itemEmoji} />
              </span>
            )}
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
          pairedIllustrations && "min-h-[12rem] sm:min-h-[14rem]",
          quarterSource && BANK_SIZE_CLASS,
        )}
      >
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center">{renderSourceCoins()}</div>
          {sourceColumnLabel ? (
            <p className="max-w-[9rem] text-center font-heading text-sm font-bold text-[#031F82]">
              {sourceColumnLabel}
            </p>
          ) : null}
        </div>
        <div className="flex flex-col items-center gap-2">
          <button
            ref={targetRef}
            type="button"
            aria-label={`Drop selected ${sourceLabel} on ${targetLabel}`}
            onClick={dropSelectedCoin}
            onKeyDown={dropSelectedFromKeyboard}
            className={cn(
              "relative cursor-pointer border-0 bg-transparent p-0",
              shakingKey === "target" && "lesson-tile-shake",
            )}
          >
            {renderTargetVisual()}
            {remaining <= 0 ? (
              <LessonAnswerTick className="absolute -right-1 -top-1" />
            ) : null}
          </button>
          {showZoneLabels ? (
            <p className="max-w-[9rem] text-center font-heading text-sm font-bold text-[#031F82]">
              {targetLabel}
            </p>
          ) : null}
        </div>
      </div>

      {dragState ? (
        <OverlayPortal>
          {/*
            Position is inline so a frame class cannot override it. Those
            frames are `relative`, and Tailwind lets `relative` beat `fixed`.
            A relative ghost then stretches to the screen and the picture,
            centered in that strip, jumps to the right.
          */}
          <div
            data-drag-ghost=""
            className={cn(
              "pointer-events-none z-overlay",
              showSourceIllustration
                ? "flex items-center justify-center"
                : sourceChipClass,
            )}
            style={{
              position: "fixed",
              left: dragState.x,
              top: dragState.y,
              width: dragState.width,
              height: dragState.height,
            }}
          >
            {showSourceIllustration
              ? renderSourceIllustration(true)
              : <AnswerEmoji emoji={itemEmoji} />}
          </div>
        </OverlayPortal>
      ) : null}
    </div>
  );
}
