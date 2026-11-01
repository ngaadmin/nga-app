"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useLessonShake } from "@/components/academy/lesson/hooks/use-lesson-screen-flow";
import { usePlaySeed } from "@/components/academy/lesson/hooks/use-play-seed";
import { OverlayPortal } from "@/components/ui/overlay-portal";
import {
  itemsGroupedLikeZones,
  orderPairedZones,
  pairedZoneEmoji,
  sortPromptLines,
} from "@/lib/academy/lessons/paired-zone-sort";
import { seededShuffle } from "@/lib/academy/lessons/seeded-shuffle";
import { AnswerEmoji } from "@/components/academy/lesson/answer-emoji";
import { cn } from "@/lib/utils/cn";

type PairedItem = {
  id: string;
  label: string;
  emoji?: string;
  bucket: string;
};

type PairedBucket = {
  id: string;
  label: string;
  icon?: string;
};

type PairedZoneSortProps = {
  intro: string;
  items: readonly PairedItem[];
  buckets: readonly PairedBucket[];
  /** Screen id mixed into the item shuffle. */
  orderKey: string;
  /** Tap flies each item into its zone. Drag lets the learner choose. */
  mode: "tap" | "drag";
  /** Drop-zone min height. The pictured two-bucket sort uses a shorter zone so the picture fits. */
  zoneMinClassName?: string;
  onComplete: () => void;
  onMismatch?: () => void;
};

const ZONE_TINT = ["#FFF4DA", "#E3F4FB"] as const;
const ZONE_TINT_ACTIVE = ["#FFEBB8", "#CFEDF8"] as const;

function SortGlyph({
  item,
  shaking = false,
  selected = false,
}: {
  item: PairedItem;
  shaking?: boolean;
  selected?: boolean;
}) {
  // No tick on placed items: landing in the right zone is the feedback.
  return (
    <div
      className={cn(
        "sort-item relative flex min-h-24 w-[82px] flex-none flex-col items-center rounded-2xl text-center",
        shaking && "lesson-tile-shake",
        selected && "bg-[#EAF0FF] shadow-[inset_0_0_0_2px_#031F82]",
      )}
    >
      <AnswerEmoji emoji={item.emoji ?? "•"} />
      <span className="sort-label mt-1 w-full font-heading text-xs font-semibold leading-[1.25] text-[#031F82]">
        {item.label}
      </span>
    </div>
  );
}

const DRAG_START_PX = 8;

type DragState = {
  id: string;
  x: number;
  y: number;
  moved: boolean;
  /** Touch identifier for touch drags, pointer id for mouse and pen. */
  source: { kind: "touch"; id: number } | { kind: "pointer"; id: number };
};

export function PairedZoneSort({
  intro,
  items,
  buckets,
  orderKey,
  mode,
  zoneMinClassName = "min-h-[316px]",
  onComplete,
  onMismatch,
}: PairedZoneSortProps) {
  const zones = orderPairedZones(buckets);
  const [orderedItems, setOrderedItems] = useState<readonly PairedItem[]>(items);
  const itemSignature = items.map((item) => `${item.id}:${item.bucket}`).join("|");
  const zoneSignature = zones.map((zone) => zone.id).join("|");
  const playSeed = usePlaySeed([orderKey, mode]);
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const zoneIdsRef = useRef(zones.map((zone) => zone.id));
  zoneIdsRef.current = zones.map((zone) => zone.id);

  useLayoutEffect(() => {
    const source = itemsRef.current;
    if (playSeed === null) {
      setOrderedItems(source);
      return;
    }
    const zoneIds = zoneIdsRef.current;
    setOrderedItems(
      seededShuffle(source, playSeed, {
        avoid:
          mode === "drag"
            ? (shuffled) => itemsGroupedLikeZones(shuffled, zoneIds)
            : undefined,
      }),
    );
  }, [itemSignature, mode, playSeed, zoneSignature]);
  const lines = sortPromptLines(intro);
  const [placedIds, setPlacedIds] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeZoneId, setActiveZoneId] = useState<string | null>(null);
  const [ghost, setGhost] = useState<{ id: string; x: number; y: number } | null>(null);
  const { shakingKey, shake } = useLessonShake();
  const zoneRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const dragRef = useRef<DragState | null>(null);
  const handledPointerRef = useRef(false);
  const poolRef = useRef<HTMLDivElement | null>(null);
  const reportedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const onMismatchRef = useRef(onMismatch);
  onMismatchRef.current = onMismatch;

  const placed = new Set(placedIds);
  const complete = items.length > 0 && items.every((item) => placed.has(item.id));

  useEffect(() => {
    if (!complete || reportedRef.current) return;
    reportedRef.current = true;
    onCompleteRef.current();
  }, [complete]);

  const zoneAt = (x: number, y: number): string | null => {
    for (const zone of zones) {
      const node = zoneRefs.current[zone.id];
      if (!node) continue;
      const rect = node.getBoundingClientRect();
      if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
        return zone.id;
      }
    }
    return null;
  };

  const placeItem = (itemId: string, zoneId: string) => {
    const item = items.find((entry) => entry.id === itemId);
    if (!item || placed.has(itemId)) return;
    if (item.bucket !== zoneId) {
      shake(itemId);
      setSelectedId(null);
      onMismatchRef.current?.();
      return;
    }
    setPlacedIds((current) => (current.includes(itemId) ? current : [...current, itemId]));
    setSelectedId(null);
  };

  const activateItem = (itemId: string) => {
    if (placed.has(itemId)) return;
    if (mode === "tap") {
      const item = items.find((entry) => entry.id === itemId);
      if (!item) return;
      setPlacedIds((current) => (current.includes(itemId) ? current : [...current, itemId]));
      return;
    }
    setSelectedId(itemId);
  };

  const moveDrag = (x: number, y: number) => {
    const drag = dragRef.current;
    if (!drag) return;
    if (!drag.moved && Math.hypot(x - drag.x, y - drag.y) > DRAG_START_PX) {
      drag.moved = true;
    }
    if (!drag.moved) return;
    setGhost({ id: drag.id, x, y });
    setActiveZoneId(zoneAt(x, y));
  };

  const endDrag = (x: number, y: number, cancelled: boolean) => {
    const drag = dragRef.current;
    dragRef.current = null;
    setGhost(null);
    setActiveZoneId(null);
    if (!drag || cancelled) return;
    // A mouse release is followed by a click; a handled touch never is.
    handledPointerRef.current = drag.source.kind === "pointer";
    if (!drag.moved) {
      activateItem(drag.id);
      return;
    }
    const zoneId = zoneAt(x, y);
    if (zoneId) placeItem(drag.id, zoneId);
  };

  // Handlers change every render; the native listeners read the latest ones.
  const dragApiRef = useRef({ moveDrag, endDrag });
  dragApiRef.current = { moveDrag, endDrag };
  const completeRef = useRef(complete);
  completeRef.current = complete;

  // Touch drag runs on native touch events. iOS Safari can drop pointer
  // capture or cancel the pointer inside a scrolling lesson pane, which left
  // items stuck in place; non-passive touch listeners keep the gesture ours.
  useEffect(() => {
    const pool = poolRef.current;
    if (!pool) return;

    const findTouch = (list: TouchList, id: number): Touch | null => {
      for (let index = 0; index < list.length; index += 1) {
        const touch = list[index];
        if (touch && touch.identifier === id) return touch;
      }
      return null;
    };

    const onTouchMove = (event: TouchEvent) => {
      const drag = dragRef.current;
      if (!drag || drag.source.kind !== "touch") return;
      const touch = findTouch(event.changedTouches, drag.source.id);
      if (!touch) return;
      if (event.cancelable) event.preventDefault();
      dragApiRef.current.moveDrag(touch.clientX, touch.clientY);
    };

    const finish = (event: TouchEvent, cancelled: boolean) => {
      const drag = dragRef.current;
      if (!drag || drag.source.kind !== "touch") return;
      const touch = findTouch(event.changedTouches, drag.source.id);
      if (!touch) return;
      if (event.cancelable) event.preventDefault();
      detach();
      // A cancelled touch that was already dragging still drops where it is.
      dragApiRef.current.endDrag(
        touch.clientX,
        touch.clientY,
        cancelled && !drag.moved,
      );
    };
    const onTouchEnd = (event: TouchEvent) => finish(event, false);
    const onTouchCancel = (event: TouchEvent) => finish(event, true);

    const detach = () => {
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchCancel);
    };

    const onTouchStart = (event: TouchEvent) => {
      if (completeRef.current || dragRef.current) return;
      const target = event.target instanceof Element ? event.target : null;
      const button = target?.closest<HTMLElement>("[data-sort-item-id]");
      const id = button?.dataset.sortItemId;
      const touch = event.changedTouches[0];
      if (!button || !id || !touch) return;
      // Stops the long-press callout, text selection and page scroll.
      if (event.cancelable) event.preventDefault();
      handledPointerRef.current = false;
      dragRef.current = {
        id,
        x: touch.clientX,
        y: touch.clientY,
        moved: false,
        source: { kind: "touch", id: touch.identifier },
      };
      window.addEventListener("touchmove", onTouchMove, { passive: false });
      window.addEventListener("touchend", onTouchEnd, { passive: false });
      window.addEventListener("touchcancel", onTouchCancel, { passive: false });
    };

    pool.addEventListener("touchstart", onTouchStart, { passive: false });
    return () => {
      pool.removeEventListener("touchstart", onTouchStart);
      detach();
    };
  }, []);

  return (
    <div className="flex min-h-0 flex-col">
      <div className="min-w-0 space-y-2">
        {lines.map((line, index) => {
          const instruction = lines.length > 1 && index === lines.length - 1;
          return (
            <p
              key={line}
              className={cn(
                "font-heading text-[17px] leading-[1.35] text-[#031F82]",
                instruction ? "font-extrabold" : "font-bold",
              )}
            >
              {line}
            </p>
          );
        })}
      </div>

      <div ref={poolRef} className="mt-4 flex flex-wrap items-start gap-2">
        {orderedItems.map((item) =>
          placed.has(item.id) ? (
            // Same glyph, hidden, so the pool keeps its exact size and the
            // zones below never move as items leave it.
            <div key={item.id} className="invisible flex-none" aria-hidden>
              <SortGlyph item={item} />
            </div>
          ) : (
            <button
              key={item.id}
              type="button"
              data-sort-item-id={item.id}
              aria-pressed={selectedId === item.id}
              className={cn(
                "lesson-touch-target flex-none border-0 bg-transparent p-0",
                ghost?.id === item.id && "opacity-30",
              )}
              onContextMenu={(event) => event.preventDefault()}
              onPointerDown={(event) => {
                // Touch runs on the native touch listeners above.
                if (event.pointerType === "touch") return;
                handledPointerRef.current = false;
                event.currentTarget.setPointerCapture(event.pointerId);
                dragRef.current = {
                  id: item.id,
                  x: event.clientX,
                  y: event.clientY,
                  moved: false,
                  source: { kind: "pointer", id: event.pointerId },
                };
              }}
              onPointerMove={(event) => {
                const drag = dragRef.current;
                if (!drag || drag.source.kind !== "pointer") return;
                if (drag.source.id !== event.pointerId) return;
                moveDrag(event.clientX, event.clientY);
              }}
              onPointerUp={(event) => {
                const drag = dragRef.current;
                if (!drag || drag.source.kind !== "pointer") return;
                if (drag.source.id !== event.pointerId) return;
                if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                  event.currentTarget.releasePointerCapture(event.pointerId);
                }
                endDrag(event.clientX, event.clientY, false);
              }}
              onPointerCancel={(event) => {
                const drag = dragRef.current;
                if (!drag || drag.source.kind !== "pointer") return;
                endDrag(event.clientX, event.clientY, true);
              }}
              onClick={() => {
                if (handledPointerRef.current) {
                  handledPointerRef.current = false;
                  return;
                }
                activateItem(item.id);
              }}
            >
              <SortGlyph
                item={item}
                shaking={shakingKey === item.id}
                selected={mode === "drag" && selectedId === item.id}
              />
            </button>
          ),
        )}
      </div>

      <div className="mt-4 flex min-w-0 flex-wrap gap-2">
        {zones.map((zone, index) => {
          const tint = ZONE_TINT[index] ?? ZONE_TINT[1];
          const activeTint = ZONE_TINT_ACTIVE[index] ?? ZONE_TINT_ACTIVE[1];
          const active = activeZoneId === zone.id;
          const zoneItems = items.filter(
            (item) => item.bucket === zone.id && placed.has(item.id),
          );
          const emoji = pairedZoneEmoji(zone.id) ?? zone.icon;
          return (
            <div
              key={zone.id}
              ref={(node) => {
                zoneRefs.current[zone.id] = node;
              }}
              role="button"
              tabIndex={0}
              aria-label={`Drop selected item in ${zone.label}`}
              onClick={() => {
                if (selectedId) placeItem(selectedId, zone.id);
              }}
              onKeyDown={(event) => {
                if (event.key !== "Enter" && event.key !== " ") return;
                event.preventDefault();
                if (selectedId) placeItem(selectedId, zone.id);
              }}
              className={cn(
                "flex min-w-0 flex-1 basis-0 flex-col items-center rounded-[20px] px-2 py-[14px] text-center transition-transform duration-150",
                zoneMinClassName,
                active && "scale-[1.02]",
              )}
              style={{ backgroundColor: active ? activeTint : tint }}
            >
              <AnswerEmoji emoji={emoji} />
              <h3 className="zone-heading-label sort-label m-0 w-full font-heading font-extrabold text-[#031F82]">
                {zone.label}
              </h3>
              <div className="mt-3 flex flex-col items-center gap-1">
                {zoneItems.map((item) => (
                  <SortGlyph key={item.id} item={item} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {ghost ? (
        <OverlayPortal>
          <div
            className="absolute"
            style={{ left: ghost.x, top: ghost.y, transform: "translate(-50%, -50%)" }}
          >
            <SortGlyph item={items.find((item) => item.id === ghost.id) ?? items[0]!} />
          </div>
        </OverlayPortal>
      ) : null}
    </div>
  );
}
