"use client";

import { useMemo, useState } from "react";
import {
  LessonGameBoard,
  LessonMatchColumnHeaders,
} from "@/components/academy/lesson/lesson-ui";
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
  onComplete: () => void;
  onSuccess?: () => void;
  onMismatch?: () => void;
};

const MATCH_CELL_BASE = cn(
  "flex h-[72px] w-full items-center justify-center rounded-[14px] border-0 px-2.5 py-2 text-center font-sans text-sm leading-[1.25] text-[#031F82] shadow-[inset_0_0_0_2px_#D7EAF3]",
);

const MATCH_DEFAULT_CLASS = "bg-[#E8F6FC]";

const MATCH_PAIR_FILL_CLASSES = [
  "bg-[#FFE7B8] shadow-[inset_0_0_0_3px_#FFA503]",
  "bg-[#E8D9F6] shadow-[inset_0_0_0_3px_#7B4FB5]",
  "bg-[#F8D4DE] shadow-[inset_0_0_0_3px_#E11D48]",
  "bg-[#DCFCE7] shadow-[inset_0_0_0_3px_#16A34A]",
] as const;

function shuffleIds(ids: readonly string[]): string[] {
  const next = [...ids];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j]!, next[i]!];
  }
  return next;
}

function shuffleBenefitsAwayFromEvents(
  pairIds: readonly string[],
  eventOrder: readonly string[],
): string[] {
  if (pairIds.length <= 1) return shuffleIds(pairIds);

  let benefitOrder = shuffleIds(pairIds);
  let attempts = 0;
  while (
    benefitOrder.some((id, index) => id === eventOrder[index]) &&
    attempts < 24
  ) {
    benefitOrder = shuffleIds(pairIds);
    attempts += 1;
  }
  return benefitOrder;
}

export function LessonLinkMatchGame({
  pairs,
  eventColumnLabel = "The Event",
  benefitColumnLabel = "The Win",
  onComplete,
  onSuccess,
  onMismatch,
}: LessonLinkMatchGameProps) {
  const pairIds = useMemo(() => pairs.map((pair) => pair.id), [pairs]);
  const pairById = useMemo(
    () => new Map(pairs.map((pair) => [pair.id, pair])),
    [pairs],
  );
  const fillById = useMemo(() => {
    const next = new Map<string, string>();
    pairIds.forEach((id, index) => {
      next.set(id, MATCH_PAIR_FILL_CLASSES[index % MATCH_PAIR_FILL_CLASSES.length]!);
    });
    return next;
  }, [pairIds]);

  const eventOrder = pairIds;
  const [benefitOrder] = useState(() =>
    shuffleBenefitsAwayFromEvents(pairIds, eventOrder),
  );
  const [lockedIds, setLockedIds] = useState<ReadonlySet<string>>(() => new Set());
  const [selected, setSelected] = useState<{
    id: string;
    side: "left" | "right";
  } | null>(null);

  const isComplete = lockedIds.size === pairIds.length;

  const lockPair = (pairId: string) => {
    setLockedIds((current) => {
      const next = new Set(current);
      next.add(pairId);
      if (next.size === pairIds.length) {
        window.requestAnimationFrame(() => onComplete());
      }
      return next;
    });
    setSelected(null);
    onSuccess?.();
  };

  const handleTap = (id: string, side: "left" | "right") => {
    if (isComplete || lockedIds.has(id)) return;

    if (!selected) {
      setSelected({ id, side });
      return;
    }

    if (selected.id === id && selected.side === side) return;

    if (selected.id === id) {
      lockPair(id);
      return;
    }

    setSelected(null);
    onMismatch?.();
  };

  const cellAppearance = (id: string, side: "left" | "right") => {
    if (lockedIds.has(id) || (selected?.id === id && selected.side === side)) {
      return fillById.get(id) ?? MATCH_DEFAULT_CLASS;
    }
    return MATCH_DEFAULT_CLASS;
  };

  return (
    <LessonGameBoard>
      <LessonMatchColumnHeaders
        left={eventColumnLabel}
        right={benefitColumnLabel}
      />

      <div className="mt-2 grid grid-cols-2 gap-x-3.5 gap-y-2">
        {eventOrder.map((eventId, rowIndex) => {
          const benefitId = benefitOrder[rowIndex];
          if (!benefitId) return null;

          const eventPair = pairById.get(eventId);
          const benefitPair = pairById.get(benefitId);
          if (!eventPair || !benefitPair) return null;

          const leftLocked = lockedIds.has(eventId);
          const rightLocked = lockedIds.has(benefitId);

          return (
            <div key={`match-row-${rowIndex}`} className="contents">
              <button
                type="button"
                disabled={isComplete || leftLocked}
                aria-pressed={selected?.id === eventId && selected.side === "left"}
                aria-label={`Event: ${eventPair.event}`}
                onClick={() => handleTap(eventId, "left")}
                className={cn(MATCH_CELL_BASE, cellAppearance(eventId, "left"))}
              >
                {eventPair.event}
              </button>

              <button
                type="button"
                disabled={isComplete || rightLocked}
                aria-pressed={
                  selected?.id === benefitId && selected.side === "right"
                }
                aria-label={`Win: ${benefitPair.benefit}`}
                onClick={() => handleTap(benefitId, "right")}
                className={cn(MATCH_CELL_BASE, cellAppearance(benefitId, "right"))}
              >
                {benefitPair.benefit}
              </button>
            </div>
          );
        })}
      </div>
    </LessonGameBoard>
  );
}
