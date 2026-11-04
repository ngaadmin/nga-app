import Image from "next/image";
import { VT } from "@/components/launchpad/venture-test/venture-test-colors";

/*
 * Handbook art from Jasper's handbook r2 sketch (4 Nov): the book icon, the
 * silver DONE stamp and small prop pictures. Props only, NEVER Academy
 * characters. The sketch's prop SVGs are redrawn in the existing brand
 * tokens (no new colors).
 */

/** Book button icon (handbook-icon-r1.svg). */
export function HandbookIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" fill={VT.ink}>
      <path d="M12 6.2C10.2 4.9 7.6 4.3 4.6 4.4c-.6 0-1.1.5-1.1 1.1v11.6c0 .6.5 1.1 1.1 1.1 2.9-.1 5.3.5 7.4 1.9V6.2z" />
      <path
        d="M12 6.2c1.8-1.3 4.4-1.9 7.4-1.8.6 0 1.1.5 1.1 1.1v11.6c0 .6-.5 1.1-1.1 1.1-2.9-.1-5.3.5-7.4 1.9V6.2z"
        opacity=".6"
      />
      <path d="M15.2 4.6h2.4v5.6l-1.2-.9-1.2.9z" fill={VT.secondary} />
    </svg>
  );
}

export function PencilIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 20l1-4.5L15.5 5a2.1 2.1 0 0 1 3 3L8 18.5z" fill={VT.cta} stroke={VT.ink} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M13.5 7l3 3" stroke={VT.ink} strokeWidth="1.8" />
      <path d="M4 20l1-4.5 3.5 3z" fill={VT.ink} />
    </svg>
  );
}

/** The silver DONE stamp on a completed silver's page. */
export function DoneStamp() {
  return (
    <span
      role="img"
      aria-label="Silver done"
      className="pointer-events-none absolute right-2 top-[62px] z-raised flex size-[58px] rotate-[14deg] flex-col items-center justify-center rounded-full border-[3px] border-nga-accent bg-white font-heading leading-[1.05] text-nga-ink"
      data-done-stamp=""
    >
      <span className="text-[8px] font-semibold tracking-[0.5px]">SILVER</span>
      <b className="text-[13px] font-extrabold">DONE</b>
      <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
        <path d="M5 0l1.5 3.3 3.5.4-2.6 2.4.7 3.5L5 7.9 1.9 9.6l.7-3.5L0 3.7l3.5-.4z" fill={VT.accent} />
      </svg>
    </span>
  );
}

const PAW_TICKET = "/assets/illustrations/characters/pairs/prop-pf-m1-paw-ticket-r2.webp";

function PawTicket() {
  return <Image src={PAW_TICKET} alt="" width={78} height={58} className="rotate-6" aria-hidden="true" />;
}

function Clock() {
  return (
    <svg width="46" height="46" viewBox="0 0 46 46" aria-hidden="true">
      <circle cx="23" cy="23" r="21" fill={VT.cta} />
      <circle cx="23" cy="23" r="16" fill="#fff" />
      <rect x="21.5" y="11" width="3" height="13" fill={VT.ink} />
      <rect x="22" y="21.5" width="10" height="3" fill={VT.secondary} />
    </svg>
  );
}

function LeashBowl() {
  return (
    <span className="flex items-end">
      <svg width="46" height="42" viewBox="0 0 56 50" aria-hidden="true">
        <path d="M8 8 Q40 0 44 26 Q46 40 30 44" stroke={VT.ink} strokeWidth="5" fill="none" />
        <circle cx="10" cy="9" r="7" fill={VT.cta} />
        <rect x="24" y="40" width="12" height="8" rx="2" fill={VT.secondary} />
      </svg>
      <svg width="52" height="34" viewBox="0 0 62 40" aria-hidden="true">
        <ellipse cx="31" cy="14" rx="24" ry="6" fill={VT.slate} />
        <path d="M5 14h52l-6 22H11z" fill={VT.secondary} />
        <rect x="9" y="33" width="44" height="5" rx="2" fill={VT.ink} />
      </svg>
    </span>
  );
}

function Beads() {
  return (
    <svg width="66" height="44" viewBox="0 0 66 44" aria-hidden="true">
      {[VT.secondary, VT.cta, VT.accent, VT.ink, VT.secondary, VT.cta].map((c, i) => (
        <circle key={i} cx={8 + i * 10} cy={i % 2 ? 28 : 18} r="6" fill={c} />
      ))}
    </svg>
  );
}

function Bracelet() {
  return (
    <svg width="52" height="40" viewBox="0 0 52 40" aria-hidden="true">
      <ellipse cx="26" cy="20" rx="22" ry="14" fill="none" stroke={VT.secondary} strokeWidth="5" />
      <circle cx="26" cy="34" r="5" fill={VT.cta} />
      <circle cx="14" cy="31" r="4" fill={VT.ink} />
      <circle cx="38" cy="31" r="4" fill={VT.accent} />
    </svg>
  );
}

function Spool() {
  return (
    <svg width="44" height="50" viewBox="0 0 44 50" aria-hidden="true">
      <rect x="4" y="2" width="36" height="7" rx="2" fill={VT.accent} />
      <rect x="9" y="9" width="26" height="32" fill={VT.cta} />
      <rect x="9" y="17" width="26" height="3" fill={VT.ink} opacity=".35" />
      <rect x="9" y="28" width="26" height="3" fill={VT.ink} opacity=".35" />
      <rect x="4" y="41" width="36" height="7" rx="2" fill={VT.accent} />
    </svg>
  );
}

const PROPS = {
  "dog-walking": [PawTicket, Clock, LeashBowl],
  "friendship-bracelets": [Beads, Bracelet, Spool],
} as const;

/** A small prop picture for a page block, picked by business (dog walking art as the fallback). */
export function HandbookProp({ ventureId, index }: { ventureId: string; index: number }) {
  const set = ventureId in PROPS ? PROPS[ventureId as keyof typeof PROPS] : PROPS["dog-walking"];
  const Prop = set[index % set.length]!;
  return (
    <span className="pointer-events-none absolute bottom-1.5 right-1.5" data-handbook-prop="">
      <Prop />
    </span>
  );
}
