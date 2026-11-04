import type { ReactElement } from "react";
import type { LogoIconId } from "@/lib/launchpad/content/identity";

/*
 * PLACEHOLDER icon art, simple stand-ins pending Jasper's icons. Each draws
 * in a 100 x 100 box around the center and is always white: it sits on the
 * learner's color as its own layer and is never recolored.
 */
export const LOGO_ICON_ART: Record<LogoIconId, () => ReactElement> = {
  paw: () => (
    <g fill="#fff">
      <ellipse cx="50" cy="60" rx="15" ry="12" />
      <circle cx="32" cy="45" r="6.5" />
      <circle cx="43" cy="35" r="6.5" />
      <circle cx="57" cy="35" r="6.5" />
      <circle cx="68" cy="45" r="6.5" />
    </g>
  ),
  leash: () => (
    <g fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round">
      <circle cx="50" cy="31" r="10" />
      <path d="M50 41v19" />
      <rect x="44" y="60" width="12" height="9" rx="3" fill="#fff" stroke="none" />
      <circle cx="50" cy="75" r="5" strokeWidth="4.5" />
    </g>
  ),
  bone: () => (
    <g fill="#fff">
      <rect x="32" y="44" width="36" height="12" rx="3" />
      <circle cx="32" cy="43" r="7.5" />
      <circle cx="32" cy="57" r="7.5" />
      <circle cx="68" cy="43" r="7.5" />
      <circle cx="68" cy="57" r="7.5" />
    </g>
  ),
  bead: () => (
    <path
      fill="#fff"
      fillRule="evenodd"
      d="M33 50a17 17 0 1 0 34 0a17 17 0 1 0-34 0ZM45 50a5 5 0 1 0 10 0a5 5 0 1 0-10 0Z"
    />
  ),
  heart: () => (
    <path fill="#fff" d="M50 71C29 57 27 45 33 38c6-7 14-4 17 3c3-7 11-10 17-3c6 7 4 19-17 33Z" />
  ),
  braid: () => (
    <g fill="none" stroke="#fff" strokeWidth="5.5">
      <ellipse cx="50" cy="50" rx="20" ry="10" transform="rotate(45 50 50)" />
      <ellipse cx="50" cy="50" rx="20" ry="10" transform="rotate(-45 50 50)" />
    </g>
  ),
};

export const LOGO_ICON_NAME: Record<LogoIconId, string> = {
  paw: "paw",
  leash: "leash",
  bone: "dog bone",
  bead: "bead",
  heart: "heart",
  braid: "braided loop",
};
