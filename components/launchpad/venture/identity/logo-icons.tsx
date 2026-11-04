import type { ReactElement } from "react";
import type { LogoIconId } from "@/lib/launchpad/content/identity";

/*
 * Logo glyphs from the r8 logo system (svg-r2 set; the dog face is
 * glyph-dogface-r2). Each draws in a 100 x 100 box and is always white,
 * flat, with details as cut-outs (masks). `uid` keeps mask ids unique when
 * several logos share a page.
 */
type Glyph = (props: { uid: string }) => ReactElement;

const W = "#FFFFFF";
const MASK = { maskUnits: "userSpaceOnUse", x: 0, y: 0, width: 100, height: 100 } as const;

const DOG_HEAD = (
  <>
    <ellipse cx="50" cy="43" rx="22" ry="22" />
    <ellipse cx="50" cy="66" rx="20" ry="15.5" />
  </>
);

const HEART = "M50 85C22 66 13 50 13 37C13 24 23 15 34 15C42 15 47 20 50 25C53 20 58 15 66 15C77 15 87 24 87 37C87 50 78 66 50 85Z";

const BEADS: readonly (readonly [number, number, number])[] = [
  [50, 21, 11],
  [68.64, 27.78, 8.6],
  [78.56, 44.96, 8.6],
  [75.11, 64.5, 8.6],
  [59.92, 77.25, 8.6],
  [40.08, 77.25, 8.6],
  [24.89, 64.5, 8.6],
  [21.44, 44.96, 8.6],
  [31.36, 27.78, 8.6],
];

export const LOGO_ICON_ART: Record<LogoIconId, Glyph> = {
  paw: () => (
    <g fill={W}>
      <circle cx="27" cy="42" r="9" />
      <circle cx="41" cy="27" r="9.5" />
      <circle cx="59" cy="27" r="9.5" />
      <circle cx="73" cy="42" r="9" />
      <path d="M50 49C62 49 77 62 77 73C77 83 67 85 59 83C55 82 45 82 41 83C33 85 23 83 23 73C23 62 38 49 50 49Z" />
    </g>
  ),
  bone: () => (
    <g fill={W} transform="rotate(-40 50 50)">
      <rect x="24" y="42" width="52" height="16" />
      <circle cx="24" cy="41" r="10.5" />
      <circle cx="24" cy="59" r="10.5" />
      <circle cx="76" cy="41" r="10.5" />
      <circle cx="76" cy="59" r="10.5" />
    </g>
  ),
  "dog-face": ({ uid }) => (
    <g>
      <defs>
        <mask id={`dfe-${uid}`} {...MASK}>
          <rect width="100" height="100" fill="#fff" />
          <g fill="#000" stroke="#000" strokeWidth="9">
            {DOG_HEAD}
          </g>
        </mask>
        <mask id={`dfh-${uid}`} {...MASK}>
          <rect width="100" height="100" fill="#fff" />
          <circle cx="40" cy="42" r="5.2" fill="#000" />
          <circle cx="60" cy="42" r="5.2" fill="#000" />
          <path d="M41 59Q41 55 45 55H55Q59 55 59 59Q59 64.5 50 68Q41 64.5 41 59Z" fill="#000" />
          <path d="M50 67V72.5M43.5 73Q50 78 56.5 73" fill="none" stroke="#000" strokeWidth="3" strokeLinecap="round" />
        </mask>
      </defs>
      <g fill={W} mask={`url(#dfe-${uid})`}>
        <path d="M37 23C25 20 13 27 11 43C9.5 56 12 70 20 72C27 73.5 30 64 31 52C31.5 42 33 31 37 23Z" />
        <path d="M63 23C75 20 87 27 89 43C90.5 56 88 70 80 72C73 73.5 70 64 69 52C68.5 42 67 31 63 23Z" />
      </g>
      <g fill={W} mask={`url(#dfh-${uid})`}>
        {DOG_HEAD}
      </g>
    </g>
  ),
  "bead-strand": () => (
    <g fill={W}>
      {BEADS.map(([cx, cy, r]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} />
      ))}
    </g>
  ),
  knot: ({ uid }) => (
    <g>
      <defs>
        <clipPath id={`kh0-${uid}`}>
          <rect x="0" y="50" width="100" height="50" />
        </clipPath>
        <clipPath id={`kh1-${uid}`}>
          <rect x="0" y="0" width="100" height="50" />
        </clipPath>
        <mask id={`ka-${uid}`} {...MASK}>
          <rect width="100" height="100" fill="#fff" />
          <circle cx="63" cy="50" r="17" fill="none" stroke="#000" strokeWidth="17" clipPath={`url(#kh0-${uid})`} />
        </mask>
        <mask id={`kb-${uid}`} {...MASK}>
          <rect width="100" height="100" fill="#fff" />
          <circle cx="37" cy="50" r="17" fill="none" stroke="#000" strokeWidth="17" clipPath={`url(#kh1-${uid})`} />
        </mask>
      </defs>
      <g mask={`url(#ka-${uid})`}>
        <circle cx="37" cy="50" r="17" fill="none" stroke={W} strokeWidth="9" />
      </g>
      <g mask={`url(#kb-${uid})`}>
        <circle cx="63" cy="50" r="17" fill="none" stroke={W} strokeWidth="9" />
      </g>
    </g>
  ),
  "heart-loop": ({ uid }) => (
    <g>
      <defs>
        <mask id={`hl-${uid}`} {...MASK}>
          <rect width="100" height="100" fill="#fff" />
          <path d={HEART} fill="#000" transform="translate(50 45) scale(.5) translate(-50 -45)" />
        </mask>
      </defs>
      <path d={HEART} fill={W} mask={`url(#hl-${uid})`} />
    </g>
  ),
};

/** Spoken names for screen readers, e.g. "Logo: circle, paw icon". */
export const LOGO_ICON_NAME: Record<LogoIconId, string> = {
  paw: "paw",
  bone: "bone",
  "dog-face": "dog face",
  "bead-strand": "bead strand",
  knot: "knot",
  "heart-loop": "heart loop",
};
