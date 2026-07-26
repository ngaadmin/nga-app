"use client";

import { useMemo, useState } from "react";
import {
  LessonGameBoard,
  LessonGameHint,
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

/** Same as top prompt — text-base font-medium */
const MATCH_OPTION_TEXT =
  "text-center text-base font-medium leading-snug text-[#031F82]";

const MATCH_CELL_BASE = cn(
  "flex min-h-[4.25rem] w-full items-center justify-center rounded-2xl px-2.5 py-2 transition-colors sm:min-h-[4.5rem] sm:px-3 sm:py-2.5",
  MATCH_OPTION_TEXT,
);

const MATCH_DEFAULT_CLASS = "bg-white shadow-sm ring-1 ring-inset ring-[#BDE9FB]";

/** Left item awaiting a right-side pair — solid cyan, no border. */
const MATCH_SELECTED_CLASS = "bg-[#0CC1E0] text-[#031F82] shadow-md";

/** High-contrast brand palette — each locked pair gets the next colour. */
const MATCH_PAIR_FILL_CLASSES = [
  "bg-[#3B82F6] text-white",
  "bg-[#F59E0B] text-[#031F82]",
  "bg-[#8B5CF6] text-white",
  "bg-[#EC4899] text-white",
  "bg-[#10B981] text-[#031F82]",
  "bg-[#F97316] text-white",
  "bg-[#6366F1] text-white",
  "bg-[#14B8A6] text-[#031F82]",
] as const;

const MATCH_LOCKED_BASE =
  "cursor-default border-0 text-[#031F82] shadow-none active:scale-100";

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

  const eventOrder = pairIds;

  const [benefitOrder] = useState(() =>
    shuffleBenefitsAwayFromEvents(pairIds, eventOrder),
  );
  const [lockedIds, setLockedIds] = useState<ReadonlySet<string>>(() => new Set());
  const [pairFillById, setPairFillById] = useState<ReadonlyMap<string, string>>(
    () => new Map(),
  );
  const [selectedLeftId, setSelectedLeftId] = useState<string | null>(null);

  const isComplete = lockedIds.size === pairIds.length;

  const lockPair = (pairId: string) => {
    setPairFillById((current) => {
      const next = new Map(current);
      if (!next.has(pairId)) {
        const fillClass =
          MATCH_PAIR_FILL_CLASSES[next.size % MATCH_PAIR_FILL_CLASSES.length]!;
        next.set(pairId, fillClass);
      }
      return next;
    });
    setLockedIds((current) => {
      const next = new Set(current);
      next.add(pairId);
      if (next.size === pairIds.length) {
        window.requestAnimationFrame(() => onComplete());
      }
      return next;
    });
    setSelectedLeftId(null);
    onSuccess?.();
  };

  const handleLeftTap = (leftId: string) => {
    if (isComplete || lockedIds.has(leftId)) return;
    setSelectedLeftId(leftId);
  };

  const handleRightTap = (rightId: string) => {
    if (isComplete || lockedIds.has(rightId) || !selectedLeftId) return;

    if (selectedLeftId === rightId) {
      lockPair(rightId);
      return;
    }

    setSelectedLeftId(null);
    onMismatch?.();
  };

  const cellAppearance = (id: string, side: "left" | "right") => {
    if (lockedIds.has(id)) {
      return cn(MATCH_LOCKED_BASE, pairFillById.get(id));
    }
    if (side === "left" && selectedLeftId === id) {
      return MATCH_SELECTED_CLASS;
    }
    return MATCH_DEFAULT_CLASS;
  };

  return (
    <LessonGameBoard>
      <LessonMatchColumnHeaders
        left={eventColumnLabel}
        right={benefitColumnLabel}
      />

      <div className="grid grid-cols-2 gap-x-2.5 gap-y-2">
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
                aria-pressed={selectedLeftId === eventId}
                aria-label={`Event: ${eventPair.event}`}
                onClick={() => handleLeftTap(eventId)}
                className={cn(
                  MATCH_CELL_BASE,
                  cellAppearance(eventId, "left"),
                  !leftLocked && !isComplete && "active:scale-[0.98]",
                )}
              >
                {eventPair.event}
              </button>

              <button
                type="button"
                disabled={isComplete || rightLocked}
                aria-label={`Win: ${benefitPair.benefit}`}
                onClick={() => handleRightTap(benefitId)}
                className={cn(
                  MATCH_CELL_BASE,
                  cellAppearance(benefitId, "right"),
                  !rightLocked && !isComplete && "active:scale-[0.98]",
                )}
              >
                {benefitPair.benefit}
              </button>
            </div>
          );
        })}
      </div>

      {!isComplete ? (
        <LessonGameHint>
          Tap an event to select it, then tap the matching possibility.
        </LessonGameHint>
      ) : null}
    </LessonGameBoard>
  );
}
