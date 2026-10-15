"use client";

import { useEffect, useRef, useState } from "react";
import {
  playLessonSelectTap,
  playLessonSuccessPing,
  playLessonWrongBuzzer,
} from "@/lib/academy/lessons/utils";
import { cn } from "@/lib/utils/cn";

export type LessonLinkMatchPair = {
  id: string;
  event: string;
  benefit: string;
};

type LessonLinkMatchGameProps = {
  pairs: readonly LessonLinkMatchPair[];
  eventColumnLabel?: string;
  benefitColumnLabel?: string;
  /** Existing lesson hint. Empty copy does not render a bubble. */
  hint?: string | null;
  className?: string;
  onComplete: () => void;
  onMismatch?: () => void;
};

/** Pair tints and dots, in match order. Selected uses the next tint only. */
const PAIR_COLOURS = [
  { tint: "#E6ECFA", strong: "#031F82" },
  { tint: "#FFF4DA", strong: "#FFB822" },
  { tint: "#E3F6F8", strong: "#2BB3C0" },
  { tint: "#FFEAF0", strong: "#FF7A9A" },
] as const;

/**
 * Decorative icons from the approved match mockup.
 * They are not part of the lesson copy and are not written into the labels.
 */
const EVENT_EMOJI = ["💔", "🎂", "🏷️"] as const;
const BENEFIT_EMOJI = ["🤝", "🎁", "🛍️"] as const;

type Side = "left" | "right";

function benefitOrderFor(ids: readonly string[]): string[] {
  if (ids.length <= 1) return [...ids];
  return ids.map((_, index) => ids[(index + 1) % ids.length]!);
}

function tileKey(side: Side, id: string): string {
  return `${side}:${id}`;
}

function MatchHintBubble({ text }: { text: string }) {
  return (
    <p
      role="status"
      className="pointer-events-none absolute right-0 top-full z-raised mt-2 w-max max-w-[260px] rounded-2xl bg-[#FFF4DA] px-3.5 py-2 text-left font-sans text-[15px] font-medium leading-snug text-[#14213D]"
    >
      <span
        aria-hidden
        className="absolute -top-2 right-8 size-0 border-x-8 border-b-8 border-x-transparent border-b-[#FFF4DA]"
      />
      {text}
    </p>
  );
}

function MatchTile({
  label,
  emoji,
  fill,
  dot,
  pressed,
  disabled,
  shaking,
  hint,
  onClick,
}: {
  label: string;
  emoji?: string;
  fill?: string;
  dot?: string;
  pressed: boolean;
  disabled: boolean;
  shaking: boolean;
  hint?: string | null;
  onClick: () => void;
}) {
  return (
    <div className="relative mb-2">
      <button
        type="button"
        disabled={disabled}
        aria-pressed={pressed}
        aria-label={label}
        onClick={onClick}
        className={cn(
          "relative flex h-20 max-h-20 min-h-20 w-full items-center gap-2 rounded-2xl border-0 py-0 pl-2.5 pr-[22px] text-left transition-[background-color] duration-150 ease-out",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#031F82]",
          "disabled:cursor-default",
          shaking && "lesson-match-shake",
        )}
        style={{ backgroundColor: fill ?? "transparent" }}
      >
        {emoji ? (
          <span
            className="grid size-6 shrink-0 place-items-center text-[22px] leading-none"
            aria-hidden
          >
            {emoji}
          </span>
        ) : (
          <span className="size-6 shrink-0" aria-hidden />
        )}
        <span className="line-clamp-3 min-w-0 flex-1 font-sans text-[15px] font-semibold leading-[1.25] text-[#14213D]">
          {label}
        </span>
        {dot ? (
          <span
            aria-hidden
            className="absolute right-2 top-1/2 size-2.5 -mt-[5px] rounded-full"
            style={{ backgroundColor: dot }}
          />
        ) : null}
      </button>
      {hint ? <MatchHintBubble text={hint} /> : null}
    </div>
  );
}

export function LessonLinkMatchGame({
  pairs,
  eventColumnLabel = "Events",
  benefitColumnLabel = "Possibilities",
  hint,
  className,
  onComplete,
  onMismatch,
}: LessonLinkMatchGameProps) {
  const pairIds = pairs.map((pair) => pair.id);
  const pairIndex = new Map(pairs.map((pair, index) => [pair.id, index]));
  const pairById = new Map(pairs.map((pair) => [pair.id, pair]));
  const eventOrder = pairIds;
  const benefitOrder = benefitOrderFor(pairIds);
  const [locked, setLocked] = useState<Readonly<Record<string, number>>>({});
  const [selected, setSelected] = useState<{ id: string; side: Side } | null>(null);
  const [shaking, setShaking] = useState<ReadonlySet<string>>(() => new Set());
  const [hintAnchor, setHintAnchor] = useState<string | null>(null);
  const completedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  const shakeTimer = useRef<number | null>(null);
  onCompleteRef.current = onComplete;
  const hintText = hint?.trim() ? hint.trim() : null;
  const lockedCount = Object.keys(locked).length;
  const isComplete = pairIds.length > 0 && lockedCount === pairIds.length;
  const nextColour = PAIR_COLOURS[lockedCount % PAIR_COLOURS.length]!;

  useEffect(() => {
    if (!isComplete || completedRef.current) return;
    completedRef.current = true;
    onCompleteRef.current();
  }, [isComplete]);

  useEffect(
    () => () => {
      if (shakeTimer.current !== null) window.clearTimeout(shakeTimer.current);
    },
    [],
  );

  const triggerShake = (keys: readonly string[]) => {
    if (shakeTimer.current !== null) {
      window.clearTimeout(shakeTimer.current);
    }
    setShaking(new Set());
    window.requestAnimationFrame(() => {
      setShaking(new Set(keys));
      shakeTimer.current = window.setTimeout(() => {
        setShaking(new Set());
        shakeTimer.current = null;
      }, 360);
    });
  };

  const lockPair = (pairId: string) => {
    setSelected(null);
    setHintAnchor(null);
    setLocked((current) => {
      if (current[pairId] !== undefined) return current;
      return { ...current, [pairId]: Object.keys(current).length };
    });
    playLessonSuccessPing();
  };

  const handleTap = (id: string, side: Side) => {
    if (isComplete || locked[id] !== undefined) return;

    if (!selected) {
      setHintAnchor(null);
      playLessonSelectTap();
      setSelected({ id, side });
      return;
    }

    if (selected.side === side) {
      setHintAnchor(null);
      if (selected.id === id) {
        setSelected(null);
        return;
      }
      playLessonSelectTap();
      setSelected({ id, side });
      return;
    }

    if (selected.id === id) {
      lockPair(id);
      return;
    }

    const leftId = side === "left" ? id : selected.id;
    const rightId = side === "right" ? id : selected.id;
    setSelected(null);
    setHintAnchor(hintText ? rightId : null);
    triggerShake([tileKey("left", leftId), tileKey("right", rightId)]);
    playLessonWrongBuzzer();
    onMismatch?.();
  };

  const renderColumn = (ids: readonly string[], side: Side) =>
    ids.map((id) => {
      const pair = pairById.get(id);
      if (!pair) return null;
      const index = pairIndex.get(id) ?? 0;
      const label = side === "left" ? pair.event : pair.benefit;
      const emoji =
        side === "left" ? EVENT_EMOJI[index] : BENEFIT_EMOJI[index];
      const colourIndex = locked[id];
      const matched = colourIndex !== undefined;
      const colour = matched ? PAIR_COLOURS[colourIndex % PAIR_COLOURS.length] : undefined;
      const isSelected = selected?.id === id && selected.side === side;

      return (
        <MatchTile
          key={tileKey(side, id)}
          label={label}
          emoji={emoji}
          fill={matched ? colour?.tint : isSelected ? nextColour.tint : undefined}
          dot={matched ? colour?.strong : undefined}
          pressed={isSelected || matched}
          disabled={matched || isComplete}
          shaking={shaking.has(tileKey(side, id))}
          hint={side === "right" && hintAnchor === id ? hintText : null}
          onClick={() => handleTap(id, side)}
        />
      );
    });

  return (
    <div className={cn("overflow-x-hidden", className)}>
      <div className="grid grid-cols-2 gap-x-3">
        <h2 className="mb-4 flex min-h-[50px] items-center font-heading text-[21px] font-bold leading-[1.15] text-[#031F82]">
          {eventColumnLabel}
        </h2>
        <h2 className="mb-4 flex min-h-[50px] items-center font-heading text-[21px] font-bold leading-[1.15] text-[#031F82]">
          {benefitColumnLabel}
        </h2>
        <div>{renderColumn(eventOrder, "left")}</div>
        <div className={hintAnchor ? "pb-20" : undefined}>
          {renderColumn(benefitOrder, "right")}
        </div>
      </div>
    </div>
  );
}
