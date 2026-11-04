"use client";

import type { LaunchpadRankOrderScreen } from "@/lib/launchpad/content/types";
import { rankingAnswer, rankingOf } from "@/lib/launchpad/content/answers";
import { useCaptureAnswer } from "@/components/launchpad/venture/identity/answers-context";
import { ScreenGuidance, ScreenIntro, ScreenPrompt } from "@/components/launchpad/venture/screens/screen-ui";

/** Moves `id` one place up (-1) or down (+1). */
export function moveRankItem(order: readonly string[], id: string, dir: -1 | 1): string[] {
  const i = order.indexOf(id);
  const j = i + dir;
  if (i === -1 || j < 0 || j >= order.length) return [...order];
  const next = [...order];
  [next[i], next[j]] = [next[j]!, next[i]!];
  return next;
}

function Arrow({ dir }: { dir: "up" | "down" }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d={dir === "up" ? "M6 15l6-6 6 6" : "M6 9l6 6 6-6"} />
    </svg>
  );
}

/** Guidance on Find the why (Cath 4 Nov 10:05pm). */
export const RANK_GUIDANCE =
  "Use the arrows to put your reasons in order, with the most important at the top. If a reason doesn't apply to you, move it below the line. You don't have to.";
export const BELOW_LINE_TITLE = "Doesn't apply to me";
export const BELOW_LINE_HINT = "Move any reason that doesn't apply to you here. This is optional.";

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

/**
 * Rank order: up/down buttons move a reason (no drag). Below the numbered
 * list, a line and a "Doesn't apply to me" zone: tiles moved there lose
 * their number and turn muted, and save as notApplicable (same answer
 * shape as before). Until the learner moves anything the authored order
 * stands (saved on Next). At least one reason must stay above the line.
 */
export function RankOrderScreen({ screen }: { screen: LaunchpadRankOrderScreen }) {
  const { answers, save } = useCaptureAnswer(screen.answerKey);
  const saved = rankingOf(answers, screen.answerKey);
  const ids = screen.items.map((i) => i.id);
  // Ids no longer on the screen (e.g. a retired item in an old saved ranking) are dropped.
  const order = saved ? [...saved.order.filter((id) => ids.includes(id)), ...ids.filter((id) => !saved.order.includes(id))] : ids;
  const naRaw = (saved?.notApplicable ?? []).filter((id) => ids.includes(id));
  const below = naRaw;
  const above = order.filter((id) => !below.includes(id));
  const total = ids.length;
  const move = (id: string, dir: -1 | 1) => {
    const next = moveAcrossLine({ above, below }, id, dir);
    save(rankingAnswer([...next.above, ...next.below], next.below));
  };
  const label = (id: string) => screen.items.find((x) => x.id === id)!.label;
  const arrows = (id: string, upOff: boolean, downOff: boolean, where: string) => (
    <div className="flex flex-none">
      <button
        type="button"
        aria-label={`Move ${label(id)} up${where}`}
        disabled={upOff}
        onClick={() => move(id, -1)}
        className="flex size-11 items-center justify-center rounded-lg text-nga-ink disabled:opacity-25"
      >
        <Arrow dir="up" />
      </button>
      <button
        type="button"
        aria-label={`Move ${label(id)} down${where}`}
        disabled={downOff}
        onClick={() => move(id, 1)}
        className="flex size-11 items-center justify-center rounded-lg text-nga-ink disabled:opacity-25"
      >
        <Arrow dir="down" />
      </button>
    </div>
  );
  return (
    <div className="flex flex-col" data-screen-type="rank-order">
      {screen.context && <ScreenIntro context={screen.context} guidance={RANK_GUIDANCE} />}
      <ScreenPrompt>{screen.prompt}</ScreenPrompt>
      {!screen.context && <ScreenGuidance>{RANK_GUIDANCE}</ScreenGuidance>}
      <ol className="mx-5 mt-4 flex flex-col gap-2" aria-label="Your ranking">
        {above.map((id, i) => (
          <li
            key={id}
            className="flex h-[52px] items-center gap-2 rounded-2xl border-2 border-[#C5D4EA] bg-white pl-2.5 pr-0.5"
            data-rank-item={id}
          >
            <span className="flex size-7 flex-none items-center justify-center rounded-full bg-nga-secondary font-heading text-[14px] font-bold text-white" aria-hidden="true">
              {i + 1}
            </span>
            <span className="min-w-0 flex-1 text-[16px] font-semibold leading-tight text-nga-ink">
              <span className="sr-only">{`Number ${i + 1}: `}</span>
              {label(id)}
            </span>
            {arrows(id, i === 0, false, "")}
          </li>
        ))}
      </ol>
      <hr className="mx-5 mt-4 border-t-2 border-[#D1D5DB]" data-rank-line="" />
      <section
        className="mx-5 mb-4 mt-4 rounded-2xl border-2 border-dashed border-[#D1D5DB] bg-[#F5F6F7] px-2.5 pb-2.5 pt-2"
        aria-labelledby="rank-below-title"
        data-below-line=""
      >
        <h3 id="rank-below-title" className="font-heading text-[13px] font-bold text-nga-slate">
          {BELOW_LINE_TITLE}
        </h3>
        {below.length === 0 ? (
          <p className="py-3 text-center text-[13px] text-[#9CA3AF]" data-below-line-hint="">
            {BELOW_LINE_HINT}
          </p>
        ) : (
          <ul className="mt-2 flex flex-col gap-2" aria-labelledby="rank-below-title">
            {below.map((id, j) => (
              <li
                key={id}
                className="flex h-[52px] items-center gap-2 rounded-2xl border-2 border-[#E5E7EB] bg-white pl-3 pr-0.5"
                data-rank-item={id}
                data-struck=""
              >
                <span className="min-w-0 flex-1 text-[16px] font-semibold leading-tight text-[#6B7280]">{label(id)}</span>
                {arrows(id, false, j === below.length - 1, ", doesn't apply to me")}
              </li>
            ))}
          </ul>
        )}
      </section>
      {above.length === 0 && total > 0 && (
        <p className="sr-only" role="status">
          Move at least one reason back above the line to keep going.
        </p>
      )}
    </div>
  );
}
