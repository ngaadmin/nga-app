/**
 * "Build your identity" (Planning, L2 silver 2): the logo and business name
 * the learner builds with the picker task screens.
 *
 * Content (which shapes, swatches, icons, fonts and name colors are offered,
 * and the copy) comes from the venture payload. This file holds the fixed
 * vocabularies the art and fonts are drawn from, and the learner's answer
 * payload. The answer is plain JSON keyed by the screens' `answerKey`, so it
 * can move from the test route's localStorage to a per-learner DB row as is.
 */

/**
 * Container shapes the logo art can draw (r8 logo system). Every logo is built
 * one way, "Split": the shape in the base color, its lower-right half in the
 * layer tone, and a white glyph on top. There is no Solid or Inset style.
 */
export const LOGO_SHAPES = ["circle", "shield", "hexagon"] as const;
export type LogoShapeId = (typeof LOGO_SHAPES)[number];

/**
 * Glyph ids (r8 logo system, svg-r2 glyphs; dog face is glyph-dogface-r2).
 * components/launchpad/venture/identity/logo-icons.tsx draws each one.
 */
export const LOGO_ICON_IDS = ["paw", "bone", "dog-face", "bead-strand", "knot", "heart-loop"] as const;
export type LogoIconId = (typeof LOGO_ICON_IDS)[number];

/**
 * The r8 logo palette: base color to its fixed layer tone (the lower-right
 * half of the Split). White glyphs on all four. Low contrast of white on the
 * light blue, orange and olive is approved as designed.
 */
export const LOGO_LAYER_TONES: Readonly<Record<string, string>> = {
  "#1D3F9A": "#19347D",
  "#3FB7DA": "#39A5C4",
  "#FFA503": "#E89400",
  "#BAC593": "#A4B07A",
};

/** Base color the builder previews shapes and icons in before a color is picked (the palette's navy). */
export const LOGO_PREVIEW_BASE = "#1D3F9A";

/** The layer tone for a base color: its fixed palette tone, else the base mixed 12% toward black. */
export function logoLayerHex(base: string): string {
  const hex = base.toUpperCase();
  const known = LOGO_LAYER_TONES[hex];
  if (known) return known;
  if (!HEX_COLOR_RE.test(hex)) return hex;
  const mix = [1, 3, 5].map((i) => Math.round(parseInt(hex.slice(i, i + 2), 16) * 0.88));
  return `#${mix.map((c) => c.toString(16).padStart(2, "0")).join("").toUpperCase()}`;
}

/**
 * Picks saved before the r8 logo system (answer version 1) mapped onto the
 * current vocabularies. Anything not listed is dropped, so the learner sees
 * that pick as not chosen yet and nothing crashes.
 */
const LEGACY_SHAPES: Readonly<Record<string, LogoShapeId>> = { round: "circle", "rounded-square": "shield" };
const LEGACY_COLORS: Readonly<Record<string, string>> = {
  "#031F82": "#1D3F9A", // Navy
  "#0A8FA8": "#3FB7DA", // Teal to Light blue
  "#0CC1E0": "#3FB7DA", // r6 light blue
  "#E5484D": "#FFA503", // Coral red to Orange
  "#2E9E5B": "#BAC593", // Green to Pale olive
  "#7B4FD6": "#1D3F9A", // Purple to Navy
};
const LEGACY_ICONS: Readonly<Record<string, LogoIconId>> = {
  leash: "dog-face",
  bead: "bead-strand",
  heart: "heart-loop",
  braid: "knot",
};

/** Fonts the business name can be set in (loaded with next/font/google in identity-fonts.ts). */
export const NAME_FONTS = ["poppins-bold", "fredoka-semibold", "pacifico"] as const;
export type NameFontId = (typeof NAME_FONTS)[number];

/** Name color choices: the logo color from bronze 1, or dark ink. */
export const NAME_COLOR_IDS = ["logo", "ink"] as const;
export type NameColorId = (typeof NAME_COLOR_IDS)[number];
export const NAME_INK_HEX = "#111C3A";
/**
 * The two name colors are equal choices: neither is preselected. Until the
 * learner picks one, the name previews (and renders) in dark ink.
 */
export const UNPICKED_NAME_HEX = NAME_INK_HEX;

/** Business name cap (characters). The name wraps to at most 2 lines on render. */
export const BUSINESS_NAME_MAX = 24;
export const BUSINESS_NAME_MAX_LINES = 2;

export const HEX_COLOR_RE = /^#[0-9A-Fa-f]{6}$/;
export const ANSWER_KEY_RE = /^[a-z0-9][a-z0-9-]{0,63}$/;

/** The learner's saved picks for one identity (one answerKey). Every pick is optional until chosen. */
export const IDENTITY_ANSWER_VERSION = 2;

export type BusinessIdentityAnswer = {
  kind: "business-identity";
  /** 2 since the r8 logo system (circle / shield / hexagon, 4-color palette). Version 1 answers are migrated on read. */
  version: typeof IDENTITY_ANSWER_VERSION;
  shape?: LogoShapeId;
  /** Logo color as a hex value (the swatch picked in bronze 1). */
  color?: string;
  icon?: LogoIconId;
  name?: string;
  font?: NameFontId;
  nameColor?: NameColorId;
  /** Set when the learner taps Confirm and continue on the wrap-up. */
  finalized?: boolean;
};

/** Saved answers by answerKey; every kind is defined in lib/launchpad/content/answers.ts. */
export type { LaunchpadAnswers } from "@/lib/launchpad/content/answers";

export const EMPTY_IDENTITY: BusinessIdentityAnswer = { kind: "business-identity", version: IDENTITY_ANSWER_VERSION };

export type IdentityField = "shape" | "color" | "icon" | "name" | "font" | "nameColor";

const includes = <T extends string>(list: readonly T[], v: unknown): v is T =>
  typeof v === "string" && (list as readonly string[]).includes(v);

/**
 * Folds line breaks, tabs and runs of spaces, drops leading spaces, and caps
 * at BUSINESS_NAME_MAX characters (a trailing space is kept while typing;
 * parseBusinessIdentityAnswer trims it when the answer is loaded).
 */
export function clampBusinessName(raw: string): string {
  const folded = raw.replace(/[\r\n\t]+/g, " ").replace(/ {2,}/g, " ").replace(/^ +/, "");
  return Array.from(folded).slice(0, BUSINESS_NAME_MAX).join("");
}

/**
 * Reads a stored answer. Unknown or bad fields are dropped (never thrown),
 * so a stale or hand-edited store still renders. Version 1 answers (saved
 * before the r8 logo system) are migrated: old shapes, colors and icons map
 * to their nearest new pick, anything else is dropped. Returns null for
 * anything that is not a business-identity answer.
 */
export function parseBusinessIdentityAnswer(value: unknown): BusinessIdentityAnswer | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const v = value as Record<string, unknown>;
  if (v.kind !== "business-identity" || (v.version !== 1 && v.version !== IDENTITY_ANSWER_VERSION)) return null;
  const legacy = v.version === 1;
  const out: BusinessIdentityAnswer = { kind: "business-identity", version: IDENTITY_ANSWER_VERSION };
  const shape = legacy && typeof v.shape === "string" ? (LEGACY_SHAPES[v.shape] ?? v.shape) : v.shape;
  if (includes(LOGO_SHAPES, shape)) out.shape = shape;
  if (typeof v.color === "string" && HEX_COLOR_RE.test(v.color)) {
    const hex = v.color.toUpperCase();
    const mapped = legacy ? LEGACY_COLORS[hex] : hex;
    if (mapped) out.color = mapped;
  }
  const icon = legacy && typeof v.icon === "string" ? (LEGACY_ICONS[v.icon] ?? v.icon) : v.icon;
  if (includes(LOGO_ICON_IDS, icon)) out.icon = icon;
  if (typeof v.name === "string") {
    const name = clampBusinessName(v.name).trim();
    if (name) out.name = name;
  }
  if (includes(NAME_FONTS, v.font)) out.font = v.font;
  if (includes(NAME_COLOR_IDS, v.nameColor)) out.nameColor = v.nameColor;
  if (v.finalized === true) out.finalized = true;
  return out;
}

/** The hex the business name is drawn in: the logo color only when picked (and set); dark ink otherwise, including unpicked. */
export function resolveNameColor(answer: BusinessIdentityAnswer): string {
  if (answer.nameColor === "logo" && answer.color) return answer.color;
  return answer.nameColor === "ink" ? NAME_INK_HEX : UNPICKED_NAME_HEX;
}

/** True once the given pick has a value (gates Next on a picker step). */
export function isIdentityFieldSet(answer: BusinessIdentityAnswer | undefined, field: IdentityField): boolean {
  if (!answer) return false;
  if (field === "name") return !!answer.name?.trim();
  return answer[field] !== undefined;
}

/** Sets one pick, returning a new answer (any edit un-finalizes nothing: the confirmation stays). */
export function setIdentityField<F extends IdentityField>(
  answer: BusinessIdentityAnswer | undefined,
  field: F,
  value: NonNullable<BusinessIdentityAnswer[F]>,
): BusinessIdentityAnswer {
  const base = answer ?? EMPTY_IDENTITY;
  if (field === "name") {
    const name = clampBusinessName(String(value));
    const next = { ...base };
    if (name.trim()) next.name = name;
    else delete next.name;
    return next;
  }
  return { ...base, [field]: value };
}

/** WCAG relative-luminance contrast ratio between two hex colors. */
export function contrastRatio(a: string, b: string): number {
  const lum = (hex: string) => {
    const [r, g, bl] = [1, 3, 5].map((i) => {
      const c = parseInt(hex.slice(i, i + 2), 16) / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    }) as [number, number, number];
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}
