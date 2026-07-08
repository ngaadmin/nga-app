"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { lessonCardClass } from "@/components/academy/lesson/academy-lesson-shell";
import {
  lessonChoiceBaseClass,
  lessonChoiceStateClass,
} from "@/components/academy/lesson/lesson-shared-styles";
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
  onMistake: () => void;
  onSuccess?: () => void;
};

type PendingSideEffect =
  | { kind: "wrong" }
  | { kind: "correct"; willComplete: boolean };

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
  onMistake,
  onSuccess,
}: LessonLinkMatchGameProps) {
  const pairIds = useMemo(() => pairs.map((pair) => pair.id), [pairs]);
  const pairById = useMemo(
    () => new Map(pairs.map((pair) => [pair.id, pair])),
    [pairs],
  );

  const [columnOrder] = useState(() => {
    const events = shuffleIds(pairIds);
    const benefits = shuffleBenefitsAwayFromEvents(pairIds, events);
    return { events, benefits };
  });
  const eventOrder = columnOrder.events;
  const benefitOrder = columnOrder.benefits;

  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [matchedIds, setMatchedIds] = useState<Set<string>>(() => new Set());
  const [wrongBenefitId, setWrongBenefitId] = useState<string | null>(null);

  const onCompleteRef = useRef(onComplete);
  const onMistakeRef = useRef(onMistake);
  const onSuccessRef = useRef(onSuccess);
  onCompleteRef.current = onComplete;
  onMistakeRef.current = onMistake;
  onSuccessRef.current = onSuccess;

  const pendingEffectsRef = useRef<PendingSideEffect[]>([]);
  const flushTimeoutRef = useRef<number | null>(null);

  const flushPendingEffects = useCallback(() => {
    flushTimeoutRef.current = null;
    const effects = pendingEffectsRef.current.splice(0);

    for (const effect of effects) {
      if (effect.kind === "wrong") {
        onMistakeRef.current();
        continue;
      }

      onSuccessRef.current?.();
      if (effect.willComplete) {
        onCompleteRef.current();
      }
    }
  }, []);

  const queueSideEffect = useCallback(
    (effect: PendingSideEffect) => {
      pendingEffectsRef.current.push(effect);
      if (flushTimeoutRef.current !== null) return;
      flushTimeoutRef.current = window.setTimeout(flushPendingEffects, 0);
    },
    [flushPendingEffects],
  );

  const handleEventTap = (pairId: string) => {
    if (matchedIds.has(pairId)) return;
    setSelectedEventId((current) => (current === pairId ? null : pairId));
    setWrongBenefitId(null);
  };

  const handleBenefitTap = (pairId: string) => {
    if (matchedIds.has(pairId) || !selectedEventId) return;

    if (selectedEventId !== pairId) {
      setWrongBenefitId(pairId);
      window.setTimeout(() => setWrongBenefitId(null), 500);
      setSelectedEventId(null);
      queueSideEffect({ kind: "wrong" });
      return;
    }

    const nextMatched = new Set(matchedIds);
    nextMatched.add(pairId);
    setMatchedIds(nextMatched);
    setSelectedEventId(null);
    setWrongBenefitId(null);
    queueSideEffect({
      kind: "correct",
      willComplete: nextMatched.size === pairs.length,
    });
  };

  const renderEventCard = (pairId: string) => {
    const pair = pairById.get(pairId);
    if (!pair) return null;
    const isMatched = matchedIds.has(pairId);
    const isSelected = selectedEventId === pairId;

    return (
      <button
        key={`event-${pairId}`}
        type="button"
        disabled={isMatched}
        onClick={() => handleEventTap(pairId)}
        className={cn(
          lessonChoiceBaseClass,
          "py-3 text-sm",
          isMatched && "border-[#16A34A] bg-[#DCFCE7]/80 opacity-80",
          isSelected &&
            "translate-y-[3px] border-b-0 border-[#099FB8] bg-[#7AD4E8]/45 shadow-[inset_0_4px_8px_rgba(3,31,130,0.24)]",
        )}
      >
        {pair.event}
      </button>
    );
  };

  const renderBenefitCard = (pairId: string) => {
    const pair = pairById.get(pairId);
    if (!pair) return null;
    const isMatched = matchedIds.has(pairId);
    const isWrong = wrongBenefitId === pairId;
    const canLink = selectedEventId !== null && !isMatched;

    return (
      <button
        key={`benefit-${pairId}`}
        type="button"
        disabled={isMatched}
        onClick={() => handleBenefitTap(pairId)}
        className={cn(
          lessonChoiceBaseClass,
          "py-3 text-sm",
          isMatched && lessonChoiceStateClass(true, "correct"),
          isMatched && "opacity-80",
          isWrong && lessonChoiceStateClass(true, "wrong"),
          canLink && !isWrong && "ring-2 ring-[#0CC1E0]/40",
        )}
      >
        {pair.benefit}
      </button>
    );
  };

  const isComplete = matchedIds.size === pairs.length;

  return (
    <div className="mt-5 grid grid-cols-2 gap-3">
      <div className={cn(lessonCardClass, "space-y-2")}>
        <p className="font-heading text-[10px] font-bold uppercase tracking-wide text-[#0CC1E0]">
          {eventColumnLabel}
        </p>
        <div className="flex flex-col gap-2">
          {eventOrder.map((pairId) => renderEventCard(pairId))}
        </div>
      </div>

      <div className={cn(lessonCardClass, "space-y-2")}>
        <p className="font-heading text-[10px] font-bold uppercase tracking-wide text-[#0CC1E0]">
          {benefitColumnLabel}
        </p>
        <div className="flex flex-col gap-2">
          {benefitOrder.map((pairId) => renderBenefitCard(pairId))}
        </div>
      </div>

      {selectedEventId && !isComplete ? (
        <p className="col-span-2 text-center font-sans text-xs text-[#1E3A5F]/80">
          Tap the matching win on the right.
        </p>
      ) : null}

      {isComplete ? (
        <p className="col-span-2 text-center font-heading text-sm font-bold text-[#22C55E]">
          All matched!
        </p>
      ) : null}
    </div>
  );
}
