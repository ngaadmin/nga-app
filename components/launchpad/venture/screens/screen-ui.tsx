import type { ReactNode } from "react";

/** Question line over an interaction. */
export function ScreenPrompt({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <p id={id} className="mx-5 mt-1 font-heading text-[18px] font-semibold leading-[1.35] text-nga-ink">
      {children}
    </p>
  );
}

/** How-to line under the prompt. */
export function ScreenGuidance({ children }: { children: ReactNode }) {
  return <p className="mx-5 mt-1.5 text-[14px] leading-[1.45] text-nga-slate">{children}</p>;
}

/** Small uppercase line, e.g. "Goal 2 of 5" or "Real-world task". */
export function ScreenEyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="mx-5 mt-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B7280]" data-screen-eyebrow="">
      {children}
    </p>
  );
}

/**
 * Top of a one-screen capture page (load D21): the "why it matters" line, then
 * the how-to line on the light accent panel, as on the context page.
 */
export function ScreenIntro({ context, guidance }: { context: string; guidance?: string }) {
  return (
    <div className="mx-5 mb-4 mt-2 flex flex-col gap-3" data-screen-intro="">
      <p className="text-[16px] leading-[1.5] text-nga-ink">{context}</p>
      {guidance && (
        <p className="rounded-r-2xl border-l-4 border-nga-secondary bg-[#F7FAFD] px-4 py-3 text-[14px] leading-[1.5] text-nga-ink" data-guidance="">
          {guidance}
        </p>
      )}
    </div>
  );
}
