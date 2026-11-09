import type { ReactNode } from "react";
import { FREDOKA_HEADING_CLASS } from "@/components/launchpad/venture/identity/identity-fonts";

/*
 * Shared workbook paper art (handbook r4 + wrapup-binder-r1, 4 Nov): the warm
 * paper card, the spiral binding, hand-drawn dividers, accent labels with an
 * underline swash and tag chips. Used by the handbook pages and every
 * wrap-up screen so they all sit on the same page.
 */
export const PAPER_ACCENT = "#0CC1E0";

/** Workbook body: Inter 400, 16px, 24px line height, navy. Answers use WORKBOOK_ANSWER. */
export const WORKBOOK_BODY = "font-sans text-[16px] font-normal leading-[24px] text-[#19347D]";
/** A picked, typed, or calculated answer: Inter 600, 16px, 24px line height, navy. */
export const WORKBOOK_ANSWER = "font-sans text-[16px] font-semibold leading-[24px] text-[#19347D]";
/** Workbook subhead: Inter 600, 16px, 24px line height, aqua. */
export const WORKBOOK_SUB = "font-sans text-[16px] font-semibold leading-6 text-[#0CC1E0]";
/** Cost-group label on a workbook page: Inter 600, 16px, navy. */
export const WORKBOOK_GROUP = "font-sans text-[16px] font-semibold leading-6 text-[#19347D]";
/** Name and price on one line. The price column is fixed and left-aligned, so every amount starts at the same edge. */
export const WORKBOOK_PRICE_ROW = "grid grid-cols-[minmax(0,1fr)_7.5rem] items-baseline gap-x-3";
/** Workbook hint: Inter 400, 16px, 24px line height, slate. */
export const WORKBOOK_HINT = "font-sans text-[16px] font-normal leading-[24px] text-[#4A5568]";

/** r4 warm paper grain (a faint SVG noise tile over #FDFBF7). */
export const PAPER_NOISE =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 .45  0 0 0 0 .38  0 0 0 0 .28  0 0 0 .07 0'/></filter><rect width='160' height='160' filter='url(%23n)'/></svg>";

export const PAPER_BACKGROUND = `#FDFBF7 url("${PAPER_NOISE}")`;

/**
 * One binding repeat (34 x 22): an 8px punched hole (white, faint #D9DEE8 rim)
 * 24px into the tile, and a flat navy #19347D coil. The strip sits inside the
 * card (left 6px) so the whole coil is on the paper. No shading, no ruled lines.
 */
const COIL_TILE =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='34' height='22'><circle cx='24' cy='11' r='4' fill='%23fff' stroke='%23D9DEE8' stroke-width='1'/><path d='M23.5 10C17 3 3 3.5 2.5 11C2.5 15.5 7 15.5 10 14' fill='none' stroke='%2319347D' stroke-width='2.6' stroke-linecap='round'/></svg>";

/** Spiral binding down the left edge of a paper card (holes ~22px apart, full height). */
export function SpiralBinding() {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute bottom-3.5 left-1.5 top-3.5 z-raised w-[34px]"
      style={{ background: `url("${COIL_TILE}") 0 0 / 34px 22px`, backgroundRepeat: "no-repeat round" }}
      data-spiral-binding=""
    />
  );
}

/** Light-blue washi. Page 2 is top-right; page 6 is the corner. */
export function Washi({ page = 2 }: { page?: 2 | 6 }) {
  const place = page === 6 ? "right-[-10px] top-10 -rotate-[38deg]" : "right-3.5 top-[58px] rotate-[4deg]";
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute z-raised h-[22px] w-[84px] bg-[#5CC8E3] opacity-70 [clip-path:polygon(0_8%,6%_0,12%_10%,18%_0,82%_0,88%_12%,94%_0,100%_10%,100%_92%,94%_100%,88%_88%,82%_100%,18%_100%,12%_90%,6%_100%,0_88%)] ${place}`}
      data-washi=""
    />
  );
}

/**
 * The binder page every wrap-up sits on: one warm paper card with the spiral
 * binding down its left edge, and enough left padding that text clears the coils.
 */
export function BinderCard({ children, className = "", washi = false, ...data }: { children: ReactNode; className?: string; washi?: boolean } & Record<`data-${string}`, string | undefined>) {
  return (
    <div
      className={`relative ml-[22px] mr-4 rounded-2xl border border-[#EDE7DC] pb-[18px] pl-10 pr-[18px] pt-7 text-[#111827] ${className}`}
      style={{ background: PAPER_BACKGROUND }}
      data-binder-card=""
      {...data}
    >
      <SpiralBinding />
      {washi && <Washi />}
      {children}
    </div>
  );
}

/** Hand-drawn divider between sections. */
export function HandRule({ className = "mb-3.5 mt-5" }: { className?: string }) {
  return (
    <svg className={`block ${className}`} width="100%" height="10" viewBox="0 0 254 10" preserveAspectRatio="none" aria-hidden="true" data-hand-rule="">
      <path d="M2 6C30 2.5 52 8.5 84 5.2S140 2.8 170 6.4S226 8 252 4.6" fill="none" stroke="#D9D1C3" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

/** Accent section label (Fredoka heading weight, aqua) with the long curved swash. */
export function AccentLabel({ children, doodle, as: Tag = "h3" }: { children: ReactNode; doodle?: ReactNode; as?: "h2" | "h3" }) {
  return (
    <div className="mt-[38px] flex items-end gap-2 first:mt-2.5">
      <Tag className={`${FREDOKA_HEADING_CLASS} inline-flex flex-col gap-px text-[18px] font-bold leading-6 text-[#0CC1E0]`}>
        {children}
        <svg width="286" height="7" viewBox="0 0 74 7" preserveAspectRatio="none" aria-hidden="true">
          <path d="M2 4.6C18 2 40 2.2 72 3.4" fill="none" stroke="#0CC1E0" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      </Tag>
      {doodle}
    </div>
  );
}

/** Tag chip (a luggage tag with a punched hole). */
export function TagChip({ children, check = false }: { children: ReactNode; check?: boolean }) {
  return (
    <li
      className={`relative flex h-8 items-center gap-1.5 whitespace-nowrap rounded-r-lg bg-[#ECF8FB] pr-3 [clip-path:polygon(11px_0,100%_0,100%_100%,11px_100%,0_50%)] ${WORKBOOK_ANSWER} ${check ? "pl-[21px]" : "pl-[23px]"}`}
      data-tag-chip=""
    >
      <span aria-hidden="true" className="absolute left-[11px] top-1/2 -mt-[3px] size-1.5 rounded-full bg-[#FDFBF7]" />
      {check && (
        <span aria-hidden="true" className="inline-flex size-3.5 flex-none items-center justify-center rounded-full bg-[#FFA503]" data-tick="">
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        </span>
      )}
      {children}
    </li>
  );
}
