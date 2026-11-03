import type { ReactNode } from "react";
import { VT } from "@/components/launchpad/venture-test/venture-test-colors";

export const BTN_BASE =
  "block rounded-full p-3.5 text-center font-heading text-[17px] font-bold leading-[1.5] disabled:cursor-not-allowed";
export const BTN_ORANGE = `${BTN_BASE} bg-nga-cta text-white shadow-[0_4px_0_#c88202]`;
export const BTN_CYAN = `${BTN_BASE} bg-nga-secondary text-white shadow-[0_4px_0_#099fb8]`;
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
