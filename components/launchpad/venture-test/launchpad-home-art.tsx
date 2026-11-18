// GENERATED from Jasper's build_home_r12.py (r12 Launchpad home). Flat, 2-3 tone
// shop-front art; do not hand-edit shapes, regenerate instead.
import type { ReactNode } from "react";

export type ShopIconTones = { a: string; b: string; c: string; w: string };

export const LIVE_ICON_TONES: ShopIconTones = {
  a: "#031f82",
  b: "#ffa503",
  c: "#fff",
  w: "#bde9fb",
};
export const LOCKED_ICON_TONES: ShopIconTones = {
  a: "#4f5f74",
  b: "#75869b",
  c: "#a3b0c0",
  w: "#eef2f6",
};

export type ShopIconKey =
  | "paw"
  | "leaf"
  | "rattle"
  | "scissors"
  | "lemon"
  | "chair"
  | "sprout"
  | "cookie"
  | "tshirt"
  | "book"
  | "page"
  | "sticker"
  | "palette"
  | "board";

export const SHOP_ICONS: Record<ShopIconKey, (t: ShopIconTones) => ReactNode> =
  {
    paw: (t) => (
      <>
        <ellipse cx="24" cy="31" rx="10.5" ry="9" fill={t.a} />
        <circle cx="13" cy="20" r="4.3" fill={t.a} />
        <circle cx="19.5" cy="12.5" r="4.6" fill={t.a} />
        <circle cx="28.5" cy="12.5" r="4.6" fill={t.a} />
        <circle cx="35" cy="20" r="4.3" fill={t.a} />
      </>
    ),
    leaf: (t) => (
      <>
        <path
          d="M30 25 41 7"
          stroke={t.a}
          strokeWidth="3.2"
          strokeLinecap="round"
        />
        <rect
          x="37"
          y="4"
          width="9"
          height="4.5"
          rx="2.2"
          fill={t.b}
          transform="rotate(-58 41.5 6.2)"
        />
        <path d="M8 34c0-6 4-10 10-10h12c4 0 6 3 6 6v4z" fill={t.b} />
        <rect x="8" y="31" width="28" height="4" fill={t.a} />
        <rect x="14" y="27" width="10" height="3" rx="1.5" fill={t.c} />
        <circle cx="14" cy="37" r="5.5" fill={t.a} />
        <circle cx="14" cy="37" r="2" fill={t.w} />
        <circle cx="32" cy="37" r="5.5" fill={t.a} />
        <circle cx="32" cy="37" r="2" fill={t.w} />
        <path
          d="M1 46l2-7 2 7 2-6 2 6zM37 46l2-7 2 7 2-6 2 6 2-8 1 8z"
          fill={t.c}
        />
      </>
    ),
    rattle: (t) => (
      <>
        <path d="M17 6c0-3 6-3 6 0v4h-6z" fill={t.b} />
        <rect x="13" y="10" width="14" height="5" rx="2" fill={t.a} />
        <rect x="12" y="15" width="16" height="28" rx="6" fill={t.c} />
        <path d="M12 26h16v11a6 6 0 0 1-6 6h-4a6 6 0 0 1-6-6z" fill={t.b} />
        <rect x="16" y="19" width="5" height="2" rx="1" fill={t.a} />
        <rect x="16" y="31" width="5" height="2" rx="1" fill={t.w} />
        <rect x="16" y="36" width="3.5" height="2" rx="1" fill={t.w} />
        <path
          d="M38 24c-4.5-3-9-6.5-9-11a4.5 4.5 0 0 1 9-1 4.5 4.5 0 0 1 9 1c0 4.5-4.5 8-9 11z"
          fill={t.a}
        />
      </>
    ),
    scissors: (t) => (
      <>
        <circle cx="31" cy="32" r="12" fill={t.b} />
        <path
          d="M21 27c6-2 14-1 21 4M20 33c7-2 15-1 22 4M24 41c5-4 11-6 18-6"
          stroke={t.c}
          strokeWidth="2"
          fill="none"
        />
        <path
          d="M30 20 44 6"
          stroke={t.w}
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M42 44c3 1 5 0 5-2"
          stroke={t.b}
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M6 6 22 28"
          stroke={t.a}
          strokeWidth="3.2"
          strokeLinecap="round"
        />
        <path
          d="M22 6 6 28"
          stroke={t.a}
          strokeWidth="3.2"
          strokeLinecap="round"
        />
        <circle cx="8" cy="31" r="5" fill={t.a} />
        <circle cx="8" cy="31" r="2.2" fill={t.w} />
        <circle cx="20" cy="31" r="5" fill={t.a} />
        <circle cx="20" cy="31" r="2.2" fill={t.w} />
        <circle cx="14" cy="17" r="1.6" fill={t.w} />
      </>
    ),
    lemon: (t) => (
      <>
        <path
          d="M28 4 22 16"
          stroke={t.a}
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path d="M9 15h26l-3.5 29h-19z" fill={t.c} />
        <path d="M10.6 23h22.8l-2.4 21h-18z" fill={t.b} />
        <circle cx="17" cy="30" r="2" fill={t.w} />
        <circle cx="24" cy="36" r="1.6" fill={t.w} />
        <rect x="9" y="15" width="26" height="3" fill={t.a} />
        <path d="M28 20a11 11 0 0 1 19-9z" fill={t.a} />
        <path d="M30.6 18.2a8 8 0 0 1 13.6-6.4z" fill={t.w} />
        <path
          d="M37.4 15 34 18M37.4 15l1.2-4.4"
          stroke={t.a}
          strokeWidth="1.2"
        />
      </>
    ),
    chair: (t) => (
      <>
        <rect x="9" y="5" width="22" height="20" rx="4" fill={t.b} />
        <rect x="13" y="9" width="14" height="12" rx="2" fill={t.c} />
        <rect x="6" y="25" width="28" height="7" rx="3" fill={t.a} />
        <rect x="9" y="32" width="4" height="13" rx="1.5" fill={t.a} />
        <rect x="27" y="32" width="4" height="13" rx="1.5" fill={t.a} />
        <rect x="12" y="38" width="16" height="3" fill={t.b} />
        <path
          d="M41 16l1.6 4.4L47 22l-4.4 1.6L41 28l-1.6-4.4L35 22l4.4-1.6z"
          fill={t.b}
        />
        <path
          d="M42 33a4 4 0 0 0-5 5l-3 6 3 1 3-6a4 4 0 0 0 4-5l-2 2-2-1z"
          fill={t.a}
        />
      </>
    ),
    sprout: (t) => (
      <>
        <rect x="22.5" y="14" width="3" height="18" fill={t.a} />
        <path d="M24 22C22 12 15 8 5 9c1 9 8 14 19 13z" fill={t.b} />
        <path d="M24 17c2-8 9-12 18-11-1 8-8 12-18 11z" fill={t.c} />
        <path
          d="M14.5 21C18 19 22 20 24 22"
          stroke={t.c}
          strokeWidth="1.6"
          fill="none"
        />
        <path d="M10 33h28l-3.5 13h-21z" fill={t.b} />
        <rect x="8" y="29" width="32" height="6" rx="2" fill={t.a} />
        <rect x="16" y="38" width="16" height="3" rx="1.5" fill={t.c} />
      </>
    ),
    cookie: (t) => (
      <>
        <path d="M10 27h28l-4 18H14z" fill={t.b} />
        <rect
          x="15"
          y="27"
          width="2.4"
          height="18"
          fill={t.a}
          transform="skewX(4.0)"
        />
        <rect
          x="21"
          y="27"
          width="2.4"
          height="18"
          fill={t.a}
          transform="skewX(1.0)"
        />
        <rect
          x="27"
          y="27"
          width="2.4"
          height="18"
          fill={t.a}
          transform="skewX(-2.0)"
        />
        <rect
          x="33"
          y="27"
          width="2.4"
          height="18"
          fill={t.a}
          transform="skewX(-5.0)"
        />
        <path
          d="M8 28c-2-6 3-10 7-9 0-6 6-9 9-8 3-3 10-1 10 5 5 0 8 5 6 12z"
          fill={t.c}
        />
        <path
          d="M14 24c4 2 9 2 13 0"
          stroke={t.w}
          strokeWidth="2.2"
          fill="none"
          strokeLinecap="round"
        />
        <circle cx="28" cy="9" r="4.5" fill={t.a} />
        <path
          d="M29 5c1-3 4-4 6-3"
          stroke={t.a}
          strokeWidth="1.6"
          fill="none"
          strokeLinecap="round"
        />
        <circle cx="26.5" cy="7.6" r="1.2" fill={t.w} />
      </>
    ),
    tshirt: (t) => (
      <>
        <path
          d="M16 5 3 12l5 10 5-2.5V44h22V19.5l5 2.5 5-10L32 5c-1 4-4 6-8 6s-7-2-8-6z"
          fill={t.b}
        />
        <path
          d="M16 5c1 4 4 6 8 6s7-2 8-6h-3c-1 2-3 3-5 3s-4-1-5-3z"
          fill={t.a}
        />
        <path d="M3 12l5 10 2-1-5-10z" fill={t.a} />
        <path d="M45 12l-5 10-2-1 5-10z" fill={t.a} />
        <path
          d="M24 19l2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z"
          fill={t.w}
        />
        <rect x="17" y="38" width="14" height="2.4" rx="1.2" fill={t.c} />
      </>
    ),
    book: (t) => (
      <>
        <g transform="rotate(-10 20 25)">
          <rect x="10" y="5" width="25" height="36" rx="3" fill={t.w} />
          <rect x="7" y="4" width="25" height="37" rx="3" fill={t.b} />
          <rect x="7" y="4" width="6" height="37" rx="2" fill={t.a} />
          <circle cx="23" cy="17" r="6" fill={t.c} />
          <rect x="16" y="27" width="13" height="3" rx="1.5" fill={t.c} />
          <rect x="18" y="32" width="9" height="2.4" rx="1.2" fill={t.a} />
          <path d="M26 40v8l2.5-2.5 2.5 2.5v-8z" fill={t.a} />
        </g>
        <g transform="rotate(22 40 26)">
          <rect x="37" y="9" width="6" height="5" rx="1.5" fill={t.a} />
          <rect x="37" y="14" width="6" height="22" fill={t.c} />
          <rect x="39" y="14" width="2" height="22" fill={t.w} />
          <path d="M37 36h6l-3 7z" fill={t.b} />
          <path d="M39 40.7h2l-1 2.3z" fill={t.a} />
        </g>
      </>
    ),
    page: (t) => (
      <>
        <rect x="11" y="3" width="26" height="26" rx="2" fill={t.c} />
        <rect x="14" y="8" width="5" height="5" rx="1.2" fill={t.w} />
        <rect x="22" y="9.2" width="11" height="2.6" rx="1.3" fill={t.b} />
        <rect x="14" y="15" width="5" height="5" rx="1.2" fill={t.w} />
        <rect x="22" y="16.2" width="9" height="2.6" rx="1.3" fill={t.b} />
        <path
          d="M15 10.6l1.4 1.4 2.6-3"
          stroke={t.a}
          strokeWidth="1.4"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M15 17.6l1.4 1.4 2.6-3"
          stroke={t.a}
          strokeWidth="1.4"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <polygon
          points="35.00,-1.00 36.94,3.33 41.66,3.84 38.14,7.02 39.11,11.66 35.00,9.30 30.89,11.66 31.86,7.02 28.34,3.84 33.06,3.33"
          fill={t.w}
          stroke={t.w}
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
        <polygon
          points="35.00,1.00 36.35,4.14 39.76,4.45 37.19,6.71 37.94,10.05 35.00,8.30 32.06,10.05 32.81,6.71 30.24,4.45 33.65,4.14"
          fill={t.b}
          stroke={t.b}
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
        <rect x="3" y="23" width="42" height="17" rx="6" fill={t.a} />
        <rect x="9" y="23" width="30" height="3" rx="1.5" fill={t.b} />
        <rect x="12" y="33" width="24" height="3" rx="1.5" fill={t.b} />
        <circle cx="39.5" cy="29.5" r="1.8" fill={t.w} />
        <circle cx="34.5" cy="29.5" r="1.8" fill={t.c} />
        <rect x="10" y="40" width="5" height="3" rx="1" fill={t.a} />
        <rect x="33" y="40" width="5" height="3" rx="1" fill={t.a} />
      </>
    ),
    sticker: (t) => (
      <>
        <rect x="9" y="5" width="24" height="39" rx="5" fill={t.a} />
        <rect x="12" y="9" width="18" height="30" rx="2" fill={t.c} />
        <rect x="18" y="6.5" width="6" height="1.4" rx=".7" fill={t.b} />
        <polygon
          points="33.00,2.00 36.06,8.79 43.46,9.60 37.95,14.61 39.47,21.90 33.00,18.20 26.53,21.90 28.05,14.61 22.54,9.60 29.94,8.79"
          fill={t.w}
          stroke={t.w}
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
        <polygon
          points="33.00,4.80 35.23,9.93 40.80,10.47 36.61,14.17 37.82,19.63 33.00,16.80 28.18,19.63 29.39,14.17 25.20,10.47 30.77,9.93"
          fill={t.b}
          stroke={t.b}
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
        <path
          transform="translate(12 30) scale(1.35)"
          d="M0 6C-4 3-7 0-7-3a3.5 3.5 0 0 1 7-1 3.5 3.5 0 0 1 7 1c0 3-3 6-7 9z"
          fill={t.w}
        />
        <path
          transform="translate(12 30.4) scale(1.0)"
          d="M0 6C-4 3-7 0-7-3a3.5 3.5 0 0 1 7-1 3.5 3.5 0 0 1 7 1c0 3-3 6-7 9z"
          fill={t.b}
        />
        <circle cx="34" cy="34" r="9" fill={t.w} />
        <circle cx="34" cy="34" r="6.8" fill={t.b} />
        <circle cx="31.6" cy="32" r="1.1" fill={t.a} />
        <circle cx="36.4" cy="32" r="1.1" fill={t.a} />
        <path
          d="M31 35.4c1.6 2 4.4 2 6 0"
          stroke={t.a}
          strokeWidth="1.4"
          fill="none"
          strokeLinecap="round"
        />
        <path d="M43 34a9 9 0 0 1-4 7.5L40 37z" fill={t.a} />
      </>
    ),
    palette: (t) => (
      <>
        <path
          d="M24 6C12 6 3 14 3 24s8 17 17 17c4 0 5-3 3-5-2-3 0-6 4-6h6c7 0 12-4 12-10C45 13 36 6 24 6z"
          fill={t.c}
        />
        <circle cx="14" cy="18" r="3.4" fill={t.a} />
        <circle cx="23" cy="13" r="3.4" fill={t.b} />
        <circle cx="33" cy="15" r="3.4" fill={t.w} />
        <circle cx="11" cy="28" r="3.4" fill={t.b} />
        <path
          d="M30 46 44 26"
          stroke={t.a}
          strokeWidth="3.4"
          strokeLinecap="round"
        />
        <path d="M43 27l3-6c1-2 3-1 2 1l-2 6z" fill={t.b} />
      </>
    ),
    board: (t) => (
      <>
        <path
          d="M12 38 7 47M36 38l5 9M24 38v8"
          stroke={t.a}
          strokeWidth="3"
          strokeLinecap="round"
        />
        <rect x="4" y="6" width="40" height="32" rx="4" fill={t.a} />
        <rect x="7" y="9" width="34" height="26" rx="2" fill={t.c} />
        <rect x="12" y="24" width="5" height="8" fill={t.b} />
        <rect x="20" y="19" width="5" height="13" fill={t.b} />
        <rect x="28" y="14" width="5" height="18" fill={t.a} />
        <path
          d="M11 18l7-4 6 3 9-6"
          stroke={t.w}
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
        <rect x="21" y="2" width="6" height="5" rx="1.5" fill={t.b} />
      </>
    ),
  };

/** Live shop front: awning in the tile color, open cyan door. */
export function LiveShopFrontArt({ awning }: { awning: string }) {
  return (
    <svg
      width="100"
      height="84"
      viewBox="0 0 100 84"
      style={{ display: "block" }}
      aria-hidden="true"
    >
      <rect width="100" height="84" fill="#e8f6fc" />
      <rect y="79" width="100" height="5" fill="#bde9fb" />
      <rect y="0" width="100" height="21" fill="#fff" />
      <rect x="0" width="10" height="21" fill={awning} />
      <rect x="20" width="10" height="21" fill={awning} />
      <rect x="40" width="10" height="21" fill={awning} />
      <rect x="60" width="10" height="21" fill={awning} />
      <rect x="80" width="10" height="21" fill={awning} />
      <circle cx="5" cy="21" r="5" fill={awning} />
      <circle cx="15" cy="21" r="5" fill="#fff" />
      <circle cx="25" cy="21" r="5" fill={awning} />
      <circle cx="35" cy="21" r="5" fill="#fff" />
      <circle cx="45" cy="21" r="5" fill={awning} />
      <circle cx="55" cy="21" r="5" fill="#fff" />
      <circle cx="65" cy="21" r="5" fill={awning} />
      <circle cx="75" cy="21" r="5" fill="#fff" />
      <circle cx="85" cy="21" r="5" fill={awning} />
      <circle cx="95" cy="21" r="5" fill="#fff" />
      <rect x="8" y="38" width="20" height="24" rx="3" fill="#bde9fb" />
      <rect x="8" y="62" width="20" height="3" fill="#0cc1e0" />
      <rect x="72" y="38" width="20" height="24" rx="3" fill="#bde9fb" />
      <rect x="72" y="62" width="20" height="3" fill="#0cc1e0" />
      <rect x="36" y="34" width="28" height="45" rx="4" fill="#0cc1e0" />
      <circle cx="58" cy="68" r="1.6" fill="#031f82" />
    </svg>
  );
}

/** Locked shop front: grey striped awning, blind pulled down. */
export function LockedShopFrontArt() {
  return (
    <svg
      width="100"
      height="84"
      viewBox="0 0 100 84"
      style={{ display: "block" }}
      aria-hidden="true"
    >
      <rect width="100" height="84" fill="#eef2f6" />
      <rect y="79" width="100" height="5" fill="#dfe6ee" />
      <rect y="0" width="100" height="21" fill="#f7f9fb" />
      <rect x="0" width="10" height="21" fill="#c3ceda" />
      <rect x="20" width="10" height="21" fill="#c3ceda" />
      <rect x="40" width="10" height="21" fill="#c3ceda" />
      <rect x="60" width="10" height="21" fill="#c3ceda" />
      <rect x="80" width="10" height="21" fill="#c3ceda" />
      <circle cx="5" cy="21" r="5" fill="#c3ceda" />
      <circle cx="15" cy="21" r="5" fill="#f7f9fb" />
      <circle cx="25" cy="21" r="5" fill="#c3ceda" />
      <circle cx="35" cy="21" r="5" fill="#f7f9fb" />
      <circle cx="45" cy="21" r="5" fill="#c3ceda" />
      <circle cx="55" cy="21" r="5" fill="#f7f9fb" />
      <circle cx="65" cy="21" r="5" fill="#c3ceda" />
      <circle cx="75" cy="21" r="5" fill="#f7f9fb" />
      <circle cx="85" cy="21" r="5" fill="#c3ceda" />
      <circle cx="95" cy="21" r="5" fill="#f7f9fb" />
      <rect x="8" y="38" width="20" height="24" rx="3" fill="#dfe6ee" />
      <rect x="8" y="62" width="20" height="3" fill="#c9d3de" />
      <rect x="72" y="38" width="20" height="24" rx="3" fill="#dfe6ee" />
      <rect x="72" y="62" width="20" height="3" fill="#c9d3de" />
      <rect x="36" y="34" width="28" height="45" rx="4" fill="#d5dde6" />
      <circle cx="58" cy="68" r="1.6" fill="#9fadbd" />
      <rect x="40" y="72" width="20" height="2" fill="#c3ceda" />
      <rect x="40" y="75" width="20" height="2" fill="#c3ceda" />
    </svg>
  );
}

export function LockBadgeArt() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" aria-hidden="true">
      <rect x="1.5" y="5" width="9" height="6.5" rx="1.5" fill="#8a9bb0" />
      <path
        d="M3.5 5V3.6a2.5 2.5 0 0 1 5 0V5"
        stroke="#8a9bb0"
        strokeWidth="1.6"
        fill="none"
      />
    </svg>
  );
}
