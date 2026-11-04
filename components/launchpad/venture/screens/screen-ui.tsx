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
