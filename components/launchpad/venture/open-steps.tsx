import { COME_BACK_LATER_COPY } from "@/lib/launchpad/venture-test/come-back-later";

export type OpenStep = { taskId: string; title: string; onFinish: () => void };

/**
 * Wrap-up block for steps left with "Come back to this later": each one with
 * a "Finish this" link, and the line saying why the confirm button is off.
 * Renders nothing when no step is open.
 */
export function OpenSteps({ steps }: { steps: readonly OpenStep[] }) {
  if (steps.length === 0) return null;
  return (
    <div className="mx-5 mt-4 rounded-2xl bg-white px-4 py-3 shadow-[inset_0_0_0_2px_#ffa503]" data-open-steps="">
      <p className="font-heading text-[15px] font-bold text-nga-ink">{COME_BACK_LATER_COPY.wrapUpListHeading}</p>
      <ul className="mt-1">
        {steps.map((s) => (
          <li key={s.taskId} className="flex items-center justify-between gap-3 py-1.5" data-open-step={s.taskId}>
            <span className="min-w-0 text-[15px] text-nga-slate">{s.title}</span>
            <button
              type="button"
              onClick={s.onFinish}
              className="min-h-11 flex-none font-heading text-[15px] font-bold text-nga-ink underline underline-offset-4"
            >
              {COME_BACK_LATER_COPY.finishThis}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** The line under a disabled confirm button while steps are open. */
export function OpenStepsHint({ count, id }: { count: number; id: string }) {
  if (count === 0) return null;
  return (
    <p id={id} className="mb-2 text-center text-[13px] text-nga-slate" data-open-steps-hint="">
      {COME_BACK_LATER_COPY.wrapUpBlocked(count)}
    </p>
  );
}
