import type { ReactNode } from "react";
import { VT } from "@/components/launchpad/venture-test/venture-test-colors";

export const BTN_BASE =
  "block rounded-full p-3.5 text-center font-heading text-[17px] font-bold leading-[1.5] disabled:cursor-not-allowed";
/**
 * Launchpad primary bottom button (Cath 4 Nov 9:59pm): compact 44px tap target,
 * auto width centered, dark navy (nga-ink #031f82, the heading color) with white
 * text (contrast about 13:1). Launchpad only; Academy buttons are untouched.
 */
/**
 * The one color for every Launchpad primary button (Cath, final 5 Nov: compact
 * navy). Change it here only.
 */
export const PRIMARY_BUTTON_COLOR = "bg-nga-ink";
const BTN_COMPACT_SHAPE =
  "mx-auto flex h-11 min-w-[140px] items-center justify-center rounded-full px-6 text-center font-heading text-[15px] font-bold leading-none text-white disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nga-ink";
export const BTN_PRIMARY = `${BTN_COMPACT_SHAPE} ${PRIMARY_BUTTON_COLOR}`;
/** The lift's "Go to Level N" (wrapup-binder-r5 screen D): compact aqua #0CC1E0, only as wide as its label. */
export const BTN_LIFT = "inline-flex h-11 items-center justify-center rounded-full bg-nga-secondary px-6 font-heading text-[15px] font-bold leading-none text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nga-ink";
/** Completed-step ticks: orange #FFA503 disc, white check (never gold). */
export const TICK_COLOR = "#FFA503";
export function TickBadge({ size = 16, className = "" }: { size?: number; className?: string }) {
  return (
    <span className={`inline-flex flex-none items-center justify-center rounded-full ${className}`} style={{ width: size, height: size, background: TICK_COLOR }} aria-hidden="true" data-tick="">
      <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12.5l4.5 4.5L19 7.5" />
      </svg>
    </span>
  );
}
/** Every Launchpad primary bottom button reads just "Continue". */
export const PRIMARY_LABEL = "Continue";
/** Older content copy still names the old label; show it as "Continue" on screen. */
export function continueCopy(text: string): string {
  return text.replace(/Confirm and continue/g, PRIMARY_LABEL);
}
export const BTN_CYAN = `${BTN_BASE} bg-nga-secondary text-white shadow-[0_4px_0_#099fb8]`;
/** Compact secondary buttons (workbook Previous/Next, inline editor Done): 44px tall, only as wide as the label. */
const BTN_COMPACT_SIDE =
  "inline-flex h-11 flex-none items-center justify-center rounded-full px-5 font-heading text-[15px] font-bold leading-none disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nga-ink";
export const BTN_CYAN_COMPACT = `${BTN_COMPACT_SIDE} bg-nga-secondary text-white`;
export const BTN_CYAN_OUTLINE_COMPACT = `${BTN_COMPACT_SIDE} bg-white text-nga-ink shadow-[inset_0_0_0_2px_#0cc1e0]`;
export const BTN_WHITE = `${BTN_BASE} bg-white text-nga-ink shadow-[inset_0_0_0_2px_#bde9fb]`;

export function LockIcon({ size = 12, color = VT.lockIcon }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" aria-hidden="true" className="inline-block align-[-1px]">
      <rect x="1.5" y="5" width="9" height="6.5" rx="1.5" fill={color} />
      <path d="M3.5 5V3.6a2.5 2.5 0 0 1 5 0V5" stroke={color} strokeWidth="1.6" fill="none" />
    </svg>
  );
}

export function CheckIcon({ size = 16, strokeWidth = 2.6 }: { size?: number; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
      <path d="M3 8.5l3 3 7-7" stroke="#fff" strokeWidth={strokeWidth} fill="none" strokeLinecap="round" />
    </svg>
  );
}

export function Heading({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <h1 className={`mx-5 mb-0.5 mt-1 font-heading text-2xl font-bold leading-[35px] text-nga-ink ${className}`}>{children}</h1>;
}

export function SubLine({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <p className={`mx-5 text-sm leading-[17px] text-nga-slate ${className}`}>{children}</p>;
}

const CRUMB = "mx-5 mt-1.5 whitespace-nowrap font-heading text-[13px] font-semibold leading-5 text-nga-slate";

/** "‹ Back to building" style single link. */
export function BackCrumb({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <nav aria-label="Breadcrumb" className={CRUMB}>
      <button type="button" onClick={onClick} className="text-nga-slate">
        ‹ {label}
      </button>
    </nav>
  );
}

/** "‹ Building · Level 1 corridor · <current>" — both links jump straight back. */
export function TrailCrumb({
  level,
  current,
  onBuilding,
  onCorridor,
}: {
  level: number;
  current: string;
  onBuilding: () => void;
  onCorridor: () => void;
}) {
  return (
    <nav aria-label="Breadcrumb" className={`${CRUMB} overflow-hidden text-ellipsis`}>
      ‹{" "}
      <button type="button" onClick={onBuilding} className="text-nga-secondary">
        Building
      </button>{" "}
      ·{" "}
      <button type="button" onClick={onCorridor} className="text-nga-secondary">
        Level {level} corridor
      </button>{" "}
      · <span className="text-nga-ink" aria-current="page">{current}</span>
    </nav>
  );
}
