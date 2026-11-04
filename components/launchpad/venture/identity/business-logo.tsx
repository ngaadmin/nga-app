"use client";

import { useLayoutEffect, useRef, useState } from "react";
import {
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

const SHAPE_NAME: Record<LogoShapeId, string> = { round: "round sticker", "rounded-square": "rounded square sticker" };

/** Describes the mark for screen readers, e.g. "Logo: round sticker, paw icon". */
export function logoMarkLabel(a: Pick<BusinessIdentityAnswer, "shape" | "icon">): string {
  const parts = [a.shape ? SHAPE_NAME[a.shape] : "no shape yet", a.icon ? `${LOGO_ICON_NAME[a.icon]} icon` : null];
  return `Logo: ${parts.filter(Boolean).join(", ")}`;
}

/**
 * The sticker: a white rim with a thin edge, filled with the learner's color,
 * then the white icon layer on top. With no shape yet it is a dashed outline.
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
  const fill = color ?? VT.mist;
  const Icon = icon ? LOGO_ICON_ART[icon] : null;
  const a11y = label ? { role: "img", "aria-label": label } : { "aria-hidden": true as const };
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" {...a11y} data-logo-shape={shape ?? "none"} data-logo-color={color ?? ""}>
      {!shape && (
        <circle cx="50" cy="50" r="46" fill="#fff" stroke={VT.panel} strokeWidth="3" strokeDasharray="8 6" />
      )}
      {shape === "round" && (
        <>
          <circle cx="50" cy="50" r="48" fill="#fff" stroke={VT.panel} strokeWidth="2" />
          <circle cx="50" cy="50" r="42" fill={fill} />
        </>
      )}
      {shape === "rounded-square" && (
        <>
          <rect x="2" y="2" width="96" height="96" rx="24" fill="#fff" stroke={VT.panel} strokeWidth="2" />
          <rect x="8" y="8" width="84" height="84" rx="19" fill={fill} />
        </>
      )}
      {Icon && (
        <g data-logo-icon={icon} transform="translate(50 50) scale(1.15) translate(-50 -50)">
          <Icon />
        </g>
      )}
    </svg>
  );
}

/**
 * A white icon on a chip in the learner's color. Exported for use around the
 * app (not placed anywhere yet).
 */
export function IconChip({ icon, color, size = 44, label }: { icon: LogoIconId; color: string; size?: number; label?: string }) {
  const Icon = LOGO_ICON_ART[icon];
  const a11y = label ? { role: "img", "aria-label": label } : { "aria-hidden": true as const };
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" {...a11y} data-icon-chip={icon}>
      <circle cx="50" cy="50" r="50" fill={color} />
      <g transform="translate(50 50) scale(1.1) translate(-50 -50)">
        <Icon />
      </g>
    </svg>
  );
}

const SIZES = {
  lg: { mark: 132, width: 300, name: 32, longName: 26 },
  md: { mark: 92, width: 260, name: 26, longName: 22 },
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
