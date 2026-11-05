"use client";

import { useId, useLayoutEffect, useRef, useState } from "react";
import {
  LOGO_PREVIEW_BASE,
  logoLayerHex,
  resolveNameColor,
  type BusinessIdentityAnswer,
  type LogoIconId,
  type LogoShapeId,
  type NameFontId,
} from "@/lib/launchpad/content/identity";
import { VT } from "@/components/launchpad/venture-test/venture-test-colors";
import { LOGO_ICON_ART, LOGO_ICON_NAME } from "@/components/launchpad/venture/identity/logo-icons";
import {
  NAME_FONT_CLASS,
  NAME_FONT_LINE_HEIGHT,
  NAME_FONT_MIN_PX,
} from "@/components/launchpad/venture/identity/identity-fonts";

const SHAPE_NAME: Record<LogoShapeId, string> = { circle: "circle", shield: "shield", hexagon: "hexagon" };

/** Describes the mark for screen readers, e.g. "Logo: circle, paw icon". */
export function logoMarkLabel(a: Pick<BusinessIdentityAnswer, "shape" | "icon">): string {
  const parts = [a.shape ? SHAPE_NAME[a.shape] : "no shape yet", a.icon ? `${LOGO_ICON_NAME[a.icon]} icon` : null];
  return `Logo: ${parts.filter(Boolean).join(", ")}`;
}

/** Container outlines in a 100-unit box (r8 logo system; the shield sits slightly inset for equal optical weight). */
export const LOGO_SHAPE_PATH: Record<LogoShapeId, string> = {
  circle: "M50 1A49 49 0 1 1 49.99 1Z",
  shield: "M50 2C62 7 76 10 87 11Q93 11.6 93 18V46C93 72 75 89 50 99C25 89 7 72 7 46V18Q7 11.6 13 11C24 10 38 7 50 2Z",
  hexagon:
    "M40.47 4.50 Q50.00 -1.00 59.53 4.50 L84.64 19.00 Q94.17 24.50 94.17 35.50 L94.17 64.50 Q94.17 75.50 84.64 81.00 L59.53 95.50 Q50.00 101.00 40.47 95.50 L15.36 81.00 Q5.83 75.50 5.83 64.50 L5.83 35.50 Q5.83 24.50 15.36 19.00 Z",
};

/** Glyph placement: 56 units, centered at y=50 (y=47 in the shield). */
const GLYPH_TRANSFORM: Record<LogoShapeId, string> = {
  circle: "translate(22 22) scale(0.56)",
  shield: "translate(22 19) scale(0.56)",
  hexagon: "translate(22 22) scale(0.56)",
};

/** Base color shown before a color is picked (the palette's navy, as in the builder's previews). */
const UNPICKED_BASE = LOGO_PREVIEW_BASE;

function useSvgUid(): string {
  return useId().replace(/[^a-zA-Z0-9_-]/g, "");
}

/**
 * The logo mark, Split style (the only style): the shape in the base color,
 * its lower-right half (the diagonal runs top-right to bottom-left) in the
 * layer tone, clipped to the shape, and the white glyph on top. With no
 * shape yet it is a dashed outline.
 */
export function LogoMark({
  shape,
  color,
  icon,
  size,
  label,
}: {
  shape?: LogoShapeId;
  color?: string;
  icon?: LogoIconId;
  size: number;
  /** Accessible name; omit when the mark is decorative (e.g. inside a labelled button). */
  label?: string;
}) {
  const uid = useSvgUid();
  const base = color ?? UNPICKED_BASE;
  const Icon = icon ? LOGO_ICON_ART[icon] : null;
  const a11y = label ? { role: "img", "aria-label": label } : { "aria-hidden": true as const };
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" {...a11y} data-logo-shape={shape ?? "none"} data-logo-color={color ?? ""}>
      {!shape && <circle cx="50" cy="50" r="46" fill="#fff" stroke={VT.panel} strokeWidth="3" strokeDasharray="8 6" />}
      {shape && (
        <>
          <defs>
            <clipPath id={`lc-${uid}`}>
              <path d={LOGO_SHAPE_PATH[shape]} />
            </clipPath>
          </defs>
          <path d={LOGO_SHAPE_PATH[shape]} fill={base} />
          <path d="M100 0V100H0Z" fill={logoLayerHex(base)} clipPath={`url(#lc-${uid})`} data-logo-layer={logoLayerHex(base)} />
        </>
      )}
      {Icon && (
        <g data-logo-icon={icon} transform={GLYPH_TRANSFORM[shape ?? "circle"]}>
          <Icon uid={uid} />
        </g>
      )}
    </svg>
  );
}

/**
 * A white glyph on a Split circle in the learner's color. Exported for use
 * around the app (not placed anywhere yet).
 */
export function IconChip({ icon, color, size = 44, label }: { icon: LogoIconId; color: string; size?: number; label?: string }) {
  return (
    <span data-icon-chip={icon} className="inline-flex">
      <LogoMark shape="circle" color={color} icon={icon} size={size} label={label} />
    </span>
  );
}

const SIZES = {
  lg: { mark: 132, width: 300, name: 32, longName: 26 },
  md: { mark: 92, width: 260, name: 26, longName: 22 },
  /**
   * Workbook cover, workbook identity page and the identity wrap-up: a
   * compact lockup so the longer vision fits (Cath, 5 Nov 8:15am). Was mark
   * 96, name 26, longName 22; now the name is 20% smaller. The logo was cut
   * 40% (58px) first, but screen three still scrolled 28px with the long test
   * vision, so per the same instruction the logo (not the vision) shrank again.
   */
  hb: { mark: 28, width: 246, name: 21, longName: 18 },
  /**
   * Workbook "Your identity" page and the cover: the logo is the hero at
   * 112px (about 30% of the card), centered above the name, and the name is a
   * smaller than hb (18px, 16px when long) so the logo clearly leads (Cath, 5 Nov 5:26pm).
   */
  hero: { mark: 112, width: 246, name: 18, longName: 16 },
  sm: { mark: 76, width: 230, name: 22, longName: 20 },
} as const;

/**
 * Business name text: large and bold, centered, wrapping onto at most two
 * lines with nothing cut off. It starts at the size for its length and steps
 * down (never below the font's minimum, see NAME_FONT_MIN_PX) until it fits.
 */
export function BusinessName({
  name,
  font,
  color,
  size = "lg",
  placeholder,
}: {
  name?: string;
  font: NameFontId;
  color: string;
  size?: keyof typeof SIZES;
  placeholder?: string;
}) {
  const s = SIZES[size];
  const text = name ?? placeholder ?? "";
  const start = Math.max(Array.from(text).length > 12 ? s.longName : s.name, NAME_FONT_MIN_PX[font]);
  const lineHeight = NAME_FONT_LINE_HEIGHT[font];
  const ref = useRef<HTMLParagraphElement>(null);
  const [px, setPx] = useState(start);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    let next = start;
    el.style.fontSize = `${next}px`;
    while (el.scrollHeight > next * lineHeight * 2 + 2 && next > NAME_FONT_MIN_PX[font]) {
      next -= 1;
      el.style.fontSize = `${next}px`;
    }
    setPx(next);
  }, [start, text, font, lineHeight]);

  if (!text) return null;
  return (
    <p
      ref={ref}
      data-business-name=""
      data-name-font={font}
      className={`${NAME_FONT_CLASS[font]} text-center ${name ? "" : "opacity-40"}`}
      style={{
        color: name ? color : VT.slate,
        fontSize: px,
        lineHeight,
        maxWidth: s.width,
        overflowWrap: "anywhere",
        wordBreak: "break-word",
      }}
    >
      {text}
    </p>
  );
}

/**
 * One shared logo, drawn only from the saved answer payload: the sticker
 * (shape, color, white icon) with the business name under it.
 */
export function BusinessLogo({
  answer,
  size = "lg",
  showName = true,
  namePlaceholder,
}: {
  answer: BusinessIdentityAnswer;
  size?: keyof typeof SIZES;
  showName?: boolean;
  namePlaceholder?: string;
}) {
  const s = SIZES[size];
  const font = answer.font ?? "poppins-bold";
  return (
    <div data-business-logo="" className="flex flex-col items-center gap-2">
      <LogoMark shape={answer.shape} color={answer.color} icon={answer.icon} size={s.mark} label={logoMarkLabel(answer)} />
      {showName && (
        <BusinessName
          name={answer.name}
          font={font}
          color={resolveNameColor(answer)}
          size={size}
          placeholder={namePlaceholder}
        />
      )}
    </div>
  );
}
