"use client";

import type { LaunchpadRankOrderScreen } from "@/lib/launchpad/content/types";
import { rankingAnswer, rankingOf } from "@/lib/launchpad/content/answers";
import { useCaptureAnswer } from "@/components/launchpad/venture/identity/answers-context";
import { ScreenGuidance, ScreenPrompt } from "@/components/launchpad/venture/screens/screen-ui";

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

/**
 * Rank order: up/down buttons move an item (no drag), and each item has a
 * "not applicable" toggle that strikes it out. Struck items keep their place
 * but get no number and are left off the goal loop and summaries. Until the
 * learner moves anything the authored order stands (saved on Next).
 */
export function RankOrderScreen({ screen }: { screen: LaunchpadRankOrderScreen }) {
  const { answers, save } = useCaptureAnswer(screen.answerKey);
  const saved = rankingOf(answers, screen.answerKey);
  const ids = screen.items.map((i) => i.id);
  const order = saved ? [...saved.order.filter((id) => ids.includes(id)), ...ids.filter((id) => !saved.order.includes(id))] : ids;
  const struck = saved?.notApplicable ?? [];
  let rank = 0;
  return (
    <div className="flex flex-col" data-screen-type="rank-order">
      <ScreenPrompt>{screen.prompt}</ScreenPrompt>
      {screen.guidance && <ScreenGuidance>{screen.guidance}</ScreenGuidance>}
      <ol className="mx-5 mb-4 mt-4 flex flex-col gap-2.5" aria-label="Your ranking">
        {order.map((id, i) => {
          const item = screen.items.find((x) => x.id === id)!;
          const off = struck.includes(id);
          if (!off) rank += 1;
          return (
            <li
              key={id}
              className={`flex items-center gap-2.5 rounded-2xl border-2 bg-white py-2 pl-3 pr-2 ${off ? "border-[#E5E7EB]" : "border-[#C5D4EA]"}`}
              data-rank-item={id}
              data-struck={off ? "" : undefined}
            >
              <span
                className={`flex size-8 flex-none items-center justify-center rounded-full font-heading text-[15px] font-bold ${off ? "bg-[#F3F4F6] text-[#9CA3AF]" : "bg-nga-secondary text-white"}`}
                aria-hidden="true"
              >
                {off ? "–" : rank}
              </span>
              <span className={`min-w-0 flex-1 text-[16px] font-semibold leading-tight ${off ? "text-[#9CA3AF] line-through" : "text-nga-ink"}`}>
                {item.label}
              </span>
              <button
                type="button"
                aria-pressed={off}
                aria-label={`${screen.notApplicableLabel}: ${item.label}`}
                onClick={() => save(rankingAnswer(order, off ? struck.filter((x) => x !== id) : [...struck, id]))}
                className={`rounded-full px-2.5 py-1.5 text-[12px] font-semibold ${off ? "bg-nga-ink text-white" : "bg-[#F3F4F6] text-nga-slate"}`}
              >
                N/A
              </button>
              <div className="flex flex-col">
                <button
                  type="button"
                  aria-label={`Move ${item.label} up`}
                  disabled={i === 0}
                  onClick={() => save(rankingAnswer(moveRankItem(order, id, -1), struck))}
                  className="flex h-6 w-9 items-center justify-center rounded-md text-nga-ink disabled:opacity-25"
                >
                  <Arrow dir="up" />
                </button>
                <button
                  type="button"
                  aria-label={`Move ${item.label} down`}
                  disabled={i === order.length - 1}
                  onClick={() => save(rankingAnswer(moveRankItem(order, id, 1), struck))}
                  className="flex h-6 w-9 items-center justify-center rounded-md text-nga-ink disabled:opacity-25"
                >
                  <Arrow dir="down" />
                </button>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
