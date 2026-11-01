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
  placed = false,
  shaking = false,
}: {
  item: PairedItem;
  placed?: boolean;
  shaking?: boolean;
}) {
  return (
    <div
      className={cn(
        "sort-item relative flex min-h-24 w-[82px] flex-none flex-col items-center text-center",
        shaking && "lesson-tile-shake",
      )}
    >
      {placed ? (
        <span
          className="lesson-tick-pop absolute top-[-4px] left-[calc(50%+14px)] grid size-[22px] place-items-center rounded-full bg-[#FFB822] font-heading text-[11px] font-extrabold leading-none text-[#031F82]"
          aria-hidden
        >
          ✓
        </span>
      ) : null}
      <AnswerEmoji emoji={item.emoji ?? "•"} />
      <span className="sort-label mt-1 w-full font-heading text-xs font-semibold leading-[1.25] text-[#031F82]">
        {item.label}
      </span>
    </div>
  );
}

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
  const dragRef = useRef<{ id: string; x: number; y: number; moved: boolean } | null>(null);
  const handledPointerRef = useRef(false);
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

      <div className="mt-4 flex flex-wrap items-start gap-2">
        {orderedItems.map((item) =>
          placed.has(item.id) ? (
            <span key={item.id} className="invisible h-24 w-[82px] flex-none" aria-hidden />
          ) : (
            <button
              key={item.id}
              type="button"
              aria-pressed={selectedId === item.id}
              className="flex-none touch-none border-0 bg-transparent p-0"
              onPointerDown={(event) => {
                handledPointerRef.current = false;
                event.currentTarget.setPointerCapture(event.pointerId);
                dragRef.current = {
                  id: item.id,
                  x: event.clientX,
                  y: event.clientY,
                  moved: false,
                };
              }}
              onPointerMove={(event) => {
                const drag = dragRef.current;
                if (!drag || drag.id !== item.id) return;
                if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
                if (Math.hypot(event.clientX - drag.x, event.clientY - drag.y) > 8) {
                  drag.moved = true;
                }
                if (!drag.moved) return;
                setGhost({ id: item.id, x: event.clientX, y: event.clientY });
                setActiveZoneId(zoneAt(event.clientX, event.clientY));
              }}
              onPointerUp={(event) => {
                const drag = dragRef.current;
                dragRef.current = null;
                setGhost(null);
                setActiveZoneId(null);
                if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                  event.currentTarget.releasePointerCapture(event.pointerId);
                }
                if (!drag) return;
                handledPointerRef.current = true;
                if (!drag.moved) {
                  activateItem(drag.id);
                  return;
                }
                const zoneId = zoneAt(event.clientX, event.clientY);
                if (zoneId) placeItem(drag.id, zoneId);
              }}
              onPointerCancel={() => {
                dragRef.current = null;
                setGhost(null);
                setActiveZoneId(null);
              }}
              onClick={() => {
                if (handledPointerRef.current) {
                  handledPointerRef.current = false;
                  return;
                }
                activateItem(item.id);
              }}
            >
              <SortGlyph item={item} shaking={shakingKey === item.id} />
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
                  <SortGlyph key={item.id} item={item} placed />
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
