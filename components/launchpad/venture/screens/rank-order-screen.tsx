"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from "react";
import type { LaunchpadRankOrderScreen } from "@/lib/launchpad/content/types";
import { rankingAnswer, rankingOf } from "@/lib/launchpad/content/answers";
import { useCaptureAnswer } from "@/components/launchpad/venture/identity/answers-context";
import { ScreenGuidance, ScreenIntro, ScreenPrompt } from "@/components/launchpad/venture/screens/screen-ui";
import { OverlayPortal } from "@/components/ui/overlay-portal";

/** Moves `id` one place up (-1) or down (+1). */
export function moveRankItem(order: readonly string[], id: string, dir: -1 | 1): string[] {
  const i = order.indexOf(id);
  const j = i + dir;
  if (i === -1 || j < 0 || j >= order.length) return [...order];
  const next = [...order];
  [next[i], next[j]] = [next[j]!, next[i]!];
  return next;
}

/** Guidance on Find the why (Cath 4 Nov 10:05pm; arrows -> drag per AC3, 5 Nov). */
export const RANK_GUIDANCE =
  "Drag your reasons into order, with the most important at the top. If a reason doesn't apply to you, drag it below the line. You don't have to.";
export const BELOW_LINE_TITLE = "Doesn't apply to me";
export const BELOW_LINE_HINT = "Drag any reason that doesn't apply to you here. This is optional.";

type Split = { above: string[]; below: string[] };

/**
 * One arrow tap on the ranked list with a "Doesn't apply to me" zone below
 * the line. Above the line moves swap places; the last ranked tile's down
 * arrow drops it to the top of the zone; the top zone tile's up arrow lifts
 * it back to last place. Zone tiles swap among themselves (no ranking).
 */
export function moveAcrossLine({ above, below }: Split, id: string, dir: -1 | 1): Split {
  const a = above.indexOf(id);
  if (a !== -1) {
    if (dir === 1 && a === above.length - 1) return { above: above.slice(0, -1), below: [id, ...below] };
    return { above: moveRankItem(above, id, dir), below: [...below] };
  }
  const b = below.indexOf(id);
  if (b === -1) return { above: [...above], below: [...below] };
  if (dir === -1 && b === 0) return { above: [...above, id], below: below.slice(1) };
  return { above: [...above], below: moveRankItem(below, id, dir) };
}

/** The line between ranked reasons and the "Doesn't apply to me" zone, as one slot in the drag order. */
export const RANK_LINE = "__line__";

/** Above/below the line as one sequence with the line in it: [...above, LINE, ...below]. */
export function splitOf(seq: readonly string[]): Split {
  const i = seq.indexOf(RANK_LINE);
  return { above: seq.slice(0, i), below: seq.slice(i + 1) };
}

/** Moves `id` so it lands at `to` in the sequence without it (the drop slot). */
export function dropAt(seq: readonly string[], id: string, to: number): string[] {
  const rest = seq.filter((x) => x !== id);
  const at = Math.max(0, Math.min(rest.length, to));
  return [...rest.slice(0, at), id, ...rest.slice(at)];
}

/** Pointer travel (px) before a press becomes a drag, so a tap never reorders. */
const DRAG_SLOP = 6;

function Grip() {
  return (
    <svg width="14" height="18" viewBox="0 0 14 18" aria-hidden="true" fill="currentColor">
      {[3, 9, 15].map((y) => (
        <g key={y}>
          <circle cx="4" cy={y} r="1.6" />
          <circle cx="10" cy={y} r="1.6" />
        </g>
      ))}
    </svg>
  );
}

type Drag = {
  id: string;
  pointerId: number;
  startY: number;
  /** Pointer offset inside the tile, so the ghost stays under the finger. */
  dy: number;
  left: number;
  width: number;
  height: number;
  y: number;
  moved: boolean;
  seq: string[];
};

/**
 * Rank order (AC3): drag a reason by the tile to reorder it, or drop it below
 * the line into the "Doesn't apply to me" zone (it loses its number, turns
 * muted and saves as notApplicable). Touch-friendly (pointer events, the
 * tile is the handle, no page scroll while dragging). Keyboard fallback: focus
 * a tile and use Arrow Up / Arrow Down (one place per press, across the line
 * at the ends); each move is announced. Until the learner moves anything the
 * authored order stands (saved on Next). At least one reason must stay above.
 */
export function RankOrderScreen({ screen }: { screen: LaunchpadRankOrderScreen }) {
  const { answers, save } = useCaptureAnswer(screen.answerKey);
  const saved = rankingOf(answers, screen.answerKey);
  const ids = screen.items.map((i) => i.id);
  // Ids no longer on the screen (e.g. a retired item in an old saved ranking) are dropped.
  const order = saved ? [...saved.order.filter((id) => ids.includes(id)), ...ids.filter((id) => !saved.order.includes(id))] : ids;
  const savedBelow = (saved?.notApplicable ?? []).filter((id) => ids.includes(id));
  const savedSeq = [...order.filter((id) => !savedBelow.includes(id)), RANK_LINE, ...savedBelow];
  const [drag, setDrag] = useState<Drag | null>(null);
  const [announce, setAnnounce] = useState("");
  const rowRefs = useRef(new Map<string, HTMLElement>());
  const focusId = useRef<string | null>(null);
  const seq = drag?.moved ? drag.seq : savedSeq;
  const { above, below } = splitOf(seq);
  const total = ids.length;
  const label = (id: string) => screen.items.find((x) => x.id === id)?.label ?? id;

  const commit = (next: readonly string[]) => {
    const s = splitOf(next);
    save(rankingAnswer([...s.above, ...s.below], s.below));
  };
  const describe = (next: readonly string[], id: string) => {
    const s = splitOf(next);
    const a = s.above.indexOf(id);
    return a !== -1 ? `${label(id)} is now number ${a + 1}.` : `${label(id)} moved below the line: doesn't apply to me.`;
  };

  useEffect(() => {
    if (!focusId.current) return;
    rowRefs.current.get(focusId.current)?.focus();
    focusId.current = null;
  });

  const onKey = (id: string, e: KeyboardEvent) => {
    if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
    e.preventDefault();
    const s = moveAcrossLine({ above, below }, id, e.key === "ArrowUp" ? -1 : 1);
    if (s.above.length === 0) return; // keep one reason above the line
    const next = [...s.above, RANK_LINE, ...s.below];
    focusId.current = id;
    commit(next);
    setAnnounce(describe(next, id));
  };

  /** The drop slot for pointer y: how many other rows (and the line) sit above it. */
  const slotAt = (cur: readonly string[], id: string, y: number) => {
    let n = 0;
    for (const key of cur) {
      if (key === id) continue;
      const el = rowRefs.current.get(key);
      if (!el) continue;
      const r = el.getBoundingClientRect();
      if (y > r.top + r.height / 2) n += 1;
    }
    return n;
  };

  const onPointerDown = (id: string, e: ReactPointerEvent<HTMLElement>) => {
    if (e.button !== 0) return;
    const r = e.currentTarget.getBoundingClientRect();
    setDrag({ id, pointerId: e.pointerId, startY: e.clientY, dy: e.clientY - r.top, left: r.left, width: r.width, height: r.height, y: e.clientY, moved: false, seq: savedSeq });
  };

  // Window listeners while a press is down: the tile's DOM node moves as the
  // order changes, so it can't hold pointer capture through the drag.
  const latest = useRef({ drag, savedSeq, commit, describe, slotAt });
  latest.current = { drag, savedSeq, commit, describe, slotAt };
  const pressed = drag ? `${drag.id}:${drag.pointerId}` : null;
  useEffect(() => {
    if (!pressed) return;
    const move = (e: PointerEvent) => {
      const { drag: d, slotAt: slot } = latest.current;
      if (!d || e.pointerId !== d.pointerId) return;
      const moved = d.moved || Math.abs(e.clientY - d.startY) > DRAG_SLOP;
      if (!moved) return;
      e.preventDefault();
      let next = dropAt(d.seq, d.id, slot(d.seq, d.id, e.clientY));
      // The line can't lead: keep at least one reason above it.
      if (next[0] === RANK_LINE) next = dropAt(d.seq, d.id, 0);
      setDrag({ ...d, moved: true, y: e.clientY, seq: next });
    };
    const end = (e: PointerEvent) => {
      const { drag: d, savedSeq: before, commit: save, describe: say } = latest.current;
      if (!d || e.pointerId !== d.pointerId) return;
      if (d.moved && d.seq.join() !== before.join()) {
        save(d.seq);
        setAnnounce(say(d.seq, d.id));
      }
      setDrag(null);
    };
    window.addEventListener("pointermove", move, { passive: false });
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
    };
  }, [pressed]);

  const dragging = (id: string) => drag?.moved && drag.id === id;
  const tile = (id: string, n: number | null) => (
    <li
      key={id}
      ref={(el) => {
        if (el) rowRefs.current.set(id, el);
        else rowRefs.current.delete(id);
      }}
      tabIndex={0}
      aria-roledescription="draggable reason"
      aria-label={`${n !== null ? `Number ${n}: ` : ""}${label(id)}${n === null ? ", doesn't apply to me" : ""}. Drag to move, or use the up and down arrow keys.`}
      onKeyDown={(e) => onKey(id, e)}
      onPointerDown={(e) => onPointerDown(id, e)}
      style={{ touchAction: "none" }}
      className={`flex h-11 cursor-grab select-none items-center gap-2 rounded-2xl border-2 pl-2.5 pr-3 outline-none focus-visible:ring-2 focus-visible:ring-nga-ink ${
        dragging(id) ? "border-dashed border-[#C5D4EA] bg-[#F5F8FD] [&>*]:opacity-0" : n !== null ? "border-[#C5D4EA] bg-white" : "border-[#E5E7EB] bg-white"
      }`}
      data-rank-item={id}
      data-struck={n === null ? "" : undefined}
    >
      {n !== null && (
        <span className="flex size-7 flex-none items-center justify-center rounded-full bg-nga-secondary font-heading text-[14px] font-bold text-white" aria-hidden="true">
          {n}
        </span>
      )}
      <span className={`min-w-0 flex-1 text-[16px] font-semibold leading-tight ${n !== null ? "text-nga-ink" : "text-[#6B7280]"}`}>{label(id)}</span>
      <span className="flex-none text-[#9AA3B5]">
        <Grip />
      </span>
    </li>
  );

  const ghostId = drag?.moved ? drag.id : null;
  const ghostRanked = ghostId ? splitOf(drag!.seq).above.indexOf(ghostId) : -1;
  return (
    <div className="flex flex-col" data-screen-type="rank-order" data-dragging={ghostId ? "" : undefined}>
      {screen.context && <ScreenIntro context={screen.context} guidance={RANK_GUIDANCE} />}
      <ScreenPrompt>{screen.prompt}</ScreenPrompt>
      {!screen.context && <ScreenGuidance>{RANK_GUIDANCE}</ScreenGuidance>}
      <ol className="mx-5 mt-3 flex flex-col gap-1.5 short:mt-2" aria-label="Your ranking">
        {above.map((id, i) => tile(id, i + 1))}
      </ol>
      <section
        className="mx-5 mb-2 mt-3 short:mb-1 short:mt-2 rounded-2xl border-2 border-dashed border-[#D1D5DB] bg-[#F5F6F7] px-2.5 pb-2 pt-1.5"
        aria-labelledby="rank-below-title"
        data-below-line=""
      >
        <h3
          id="rank-below-title"
          ref={(el) => {
            if (el) rowRefs.current.set(RANK_LINE, el);
            else rowRefs.current.delete(RANK_LINE);
          }}
          className="font-heading text-[13px] font-bold text-nga-slate"
          data-rank-line=""
        >
          {BELOW_LINE_TITLE}
        </h3>
        {below.length === 0 ? (
          <p className="py-2 text-center text-[13px] text-[#9CA3AF] short:py-1 short:leading-[1.35]" data-below-line-hint="">
            {BELOW_LINE_HINT}
          </p>
        ) : (
          <ul className="mt-1.5 flex flex-col gap-1.5" aria-labelledby="rank-below-title">
            {below.map((id) => tile(id, null))}
          </ul>
        )}
      </section>
      <p className="sr-only" aria-live="polite" data-rank-announce="">
        {announce}
      </p>
      {above.length === 0 && total > 0 && (
        <p className="sr-only" role="status">
          Move at least one reason back above the line to keep going.
        </p>
      )}
      {ghostId && drag && (
        <OverlayPortal className="overflow-visible">
          <div
            className={`pointer-events-none fixed z-overlay flex items-center gap-2 rounded-2xl border-2 border-nga-secondary bg-white pl-2.5 pr-3 shadow-[0_10px_24px_rgba(3,31,130,0.18)]`}
            style={{ left: drag.left, width: drag.width, height: drag.height, top: drag.y - drag.dy }}
            data-rank-ghost=""
            aria-hidden="true"
          >
            {ghostRanked !== -1 && (
              <span className="flex size-7 flex-none items-center justify-center rounded-full bg-nga-secondary font-heading text-[14px] font-bold text-white">{ghostRanked + 1}</span>
            )}
            <span className="min-w-0 flex-1 text-[16px] font-semibold leading-tight text-nga-ink">{label(ghostId)}</span>
            <span className="flex-none text-[#9AA3B5]">
              <Grip />
            </span>
          </div>
        </OverlayPortal>
      )}
    </div>
  );
}
