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

/** Sticker shapes the logo art can draw. */
export const LOGO_SHAPES = ["round", "rounded-square"] as const;
export type LogoShapeId = (typeof LOGO_SHAPES)[number];

/**
 * Icon art ids. PLACEHOLDER stand-in art pending Jasper's icons
 * (components/launchpad/venture/identity/logo-icons.tsx draws each one).
 */
export const LOGO_ICON_IDS = ["paw", "leash", "bone", "bead", "heart", "braid"] as const;
export type LogoIconId = (typeof LOGO_ICON_IDS)[number];

/** Fonts the business name can be set in (loaded with next/font/google in identity-fonts.ts). */
export const NAME_FONTS = ["poppins-bold", "fredoka-semibold", "pacifico"] as const;
export type NameFontId = (typeof NAME_FONTS)[number];

/** Name color choices: the logo color from bronze 1, or dark ink charcoal. */
export const NAME_COLOR_IDS = ["logo", "ink"] as const;
export type NameColorId = (typeof NAME_COLOR_IDS)[number];
export const NAME_INK_HEX = "#1F2937";
/** Default name color when none is picked yet: follow the logo color. */
export const DEFAULT_NAME_COLOR: NameColorId = "logo";

/** Business name cap (characters). The name wraps to at most 2 lines on render. */
export const BUSINESS_NAME_MAX = 24;
export const BUSINESS_NAME_MAX_LINES = 2;

export const HEX_COLOR_RE = /^#[0-9A-Fa-f]{6}$/;
export const ANSWER_KEY_RE = /^[a-z0-9][a-z0-9-]{0,63}$/;

/** The learner's saved picks for one identity (one answerKey). Every pick is optional until chosen. */
export type BusinessIdentityAnswer = {
  kind: "business-identity";
  version: 1;
  shape?: LogoShapeId;
  /** Logo color as a hex value (the swatch picked in bronze 1). */
  color?: string;
  icon?: LogoIconId;
  name?: string;
  font?: NameFontId;
  nameColor?: NameColorId;
  /** Set when the learner taps Finalize on the wrap-up. */
  finalized?: boolean;
};

/** Saved answers by answerKey (stored with progress on the test route). */
export type LaunchpadAnswers = Readonly<Record<string, BusinessIdentityAnswer>>;

export const EMPTY_IDENTITY: BusinessIdentityAnswer = { kind: "business-identity", version: 1 };

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
 * so a stale or hand-edited store still renders. Returns null for anything
 * that is not a business-identity answer.
 */
export function parseBusinessIdentityAnswer(value: unknown): BusinessIdentityAnswer | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const v = value as Record<string, unknown>;
  if (v.kind !== "business-identity" || v.version !== 1) return null;
  const out: BusinessIdentityAnswer = { kind: "business-identity", version: 1 };
  if (includes(LOGO_SHAPES, v.shape)) out.shape = v.shape;
  if (typeof v.color === "string" && HEX_COLOR_RE.test(v.color)) out.color = v.color.toUpperCase();
  if (includes(LOGO_ICON_IDS, v.icon)) out.icon = v.icon;
  if (typeof v.name === "string") {
    const name = clampBusinessName(v.name).trim();
    if (name) out.name = name;
  }
  if (includes(NAME_FONTS, v.font)) out.font = v.font;
  if (includes(NAME_COLOR_IDS, v.nameColor)) out.nameColor = v.nameColor;
  if (v.finalized === true) out.finalized = true;
  return out;
}

/** Reads the whole answers map; drops keys or values that do not parse. */
export function parseLaunchpadAnswers(value: unknown): LaunchpadAnswers {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const out: Record<string, BusinessIdentityAnswer> = {};
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    if (!ANSWER_KEY_RE.test(key)) continue;
    const parsed = parseBusinessIdentityAnswer(raw);
    if (parsed) out[key] = parsed;
  }
  return out;
}

/** The hex the business name is drawn in. Defaults to the logo color; ink when there is no logo color yet. */
export function resolveNameColor(answer: BusinessIdentityAnswer): string {
  const choice = answer.nameColor ?? DEFAULT_NAME_COLOR;
  if (choice === "ink" || !answer.color) return NAME_INK_HEX;
  return answer.color;
}

/** True once the given pick has a value (gates Next on a picker step). */
export function isIdentityFieldSet(answer: BusinessIdentityAnswer | undefined, field: IdentityField): boolean {
  // The name color has a default (the logo color), so that step is always answered.
  if (field === "nameColor") return true;
  if (!answer) return false;
  if (field === "name") return !!answer.name?.trim();
  return answer[field] !== undefined;
}

/** Sets one pick, returning a new answer (any edit un-finalizes nothing: Finalize stays). */
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
