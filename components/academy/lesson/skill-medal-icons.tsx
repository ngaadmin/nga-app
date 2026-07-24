import { useId, type ReactNode, type SVGProps } from "react";
import { resolveCanonicalSkillSlug } from "@/lib/skills/skills-registry";
import type { SkillTrophyTier } from "@/lib/dashboard/skill-trophies";
import { cn } from "@/lib/utils/cn";

type SkillMedalReliefIconProps = {
  skillSlug: string;
  tier: Extract<SkillTrophyTier, "unlocked" | "bronze">;
  className?: string;
};

type MedalPalette = {
  light: string;
  mid: string;
  dark: string;
  highlight: string;
  shadow: string;
};

const UNLOCKED_PALETTE: MedalPalette = {
  light: "rgb(214 234 245 / 0.98)",
  mid: "rgb(158 196 220 / 0.94)",
  dark: "rgb(106 154 182 / 0.9)",
  highlight: "rgb(255 255 255 / 0.65)",
  shadow: "rgb(3 31 130 / 0.24)",
};

const BRONZE_PALETTE: MedalPalette = {
  light: "#f5d088",
  mid: "#d97706",
  dark: "#92400e",
  highlight: "rgb(255 255 255 / 0.34)",
  shadow: "rgb(60 30 0 / 0.42)",
};

/** Clean vector glyphs — 48×48 viewBox, drawn for embossed medal relief. */
const SKILL_MEDAL_ICON_PATHS: Record<string, ReactNode> = {
  "stop-and-think": (
    <>
      <path d="M24 6 40 14v14L24 42 8 28V14Z" />
      <rect x="20.5" y="19" width="7" height="7" rx="1.2" />
    </>
  ),
  "put-needs-first": (
    <>
      <path d="M24 8v26" strokeWidth="2.4" strokeLinecap="round" fill="none" />
      <path d="M12 16h24" strokeWidth="2.4" strokeLinecap="round" fill="none" />
      <path d="M14 16 10 28h8l-4-12Z" />
      <path d="M34 16 30 28h8l-4-12Z" />
      <path d="M10 28h28v3H10z" />
    </>
  ),
  "smart-saving": (
    <>
      <path d="M24 8c-7 0-12 4-12 9 0 3 2 6 5 7.5V34h14v-9.5c3-1.5 5-4.5 5-7.5 0-5-5-9-12-9Z" />
      <circle cx="24" cy="17" r="3.5" />
      <rect x="21" y="30" width="6" height="2.5" rx="1" />
    </>
  ),
  "stop-the-leak": (
    <>
      <path d="M24 8c-8 10-12 15-12 20a12 12 0 1 0 24 0c0-5-4-10-12-20Z" />
      <path
        d="M20 28c1.5 2 4 3 6 2.5"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        opacity="0.55"
      />
    </>
  ),
  "knowing-debt": (
    <>
      <path d="M14 10h20a3 3 0 0 1 3 3v22a3 3 0 0 1-3 3H14a3 3 0 0 1-3-3V13a3 3 0 0 1 3-3Z" />
      <path d="M18 18h16M18 24h12M18 30h8" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      <path d="M30 28h4v6h-4z" />
    </>
  ),
  "safe-guarding": (
    <>
      <path d="M24 6 38 12v12c0 9-6 14-14 18-8-4-14-9-14-18V12Z" />
      <path
        d="M17 24l4.5 4.5L31 19"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </>
  ),
  "budgeting-basics": (
    <>
      <path d="M10 36V22h7v14zM20.5 36V14h7v22zM31 36V18h7v18z" />
      <path d="M8 38h32" strokeWidth="2.2" strokeLinecap="round" fill="none" />
    </>
  ),
  "compound-saving": (
    <>
      <path d="M8 36h32" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      <path
        d="M10 30 18 24 26 18 38 10"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path d="M32 10h6v6l-6-6Z" />
    </>
  ),
  "building-buffers": (
    <>
      <rect x="10" y="26" width="28" height="8" rx="1.5" />
      <rect x="12" y="18" width="24" height="8" rx="1.5" />
      <rect x="14" y="10" width="20" height="8" rx="1.5" />
    </>
  ),
  "build-value": (
    <>
      <path d="M24 8a10 10 0 0 0-8 16v2h16v-2a10 10 0 0 0-8-16Z" />
      <path d="M18 28h12v4H18z" />
      <path d="M20 32h8v3H20z" />
      <path d="M24 12v4M20 14h8" strokeWidth="2" strokeLinecap="round" fill="none" />
    </>
  ),
  "making-offers": (
    <>
      <path d="M12 18c0-4 4-6 8-6h8l6 6v8c0 4-4 6-8 6H16c-4 0-8-2-8-6v-8Z" />
      <path d="M28 12v6h6" fill="none" strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M18 24h12" strokeWidth="2.2" strokeLinecap="round" fill="none" />
    </>
  ),
  "closing-deals": (
    <>
      <path d="M10 26c0-6 5-10 10-10h8c5 0 10 4 10 10v4H10v-4Z" />
      <path
        d="M16 26c2 3 5 5 8 5s6-2 8-5"
        strokeWidth="2.4"
        strokeLinecap="round"
        fill="none"
      />
      <path d="M14 30h20v4H14z" />
    </>
  ),
  "knowing-assets": (
    <>
      <path d="M10 36h28v-4l-4-18H14l-4 18v4Z" />
      <path d="M18 14h12v6H18z" />
      <path d="M14 36h20" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      <path d="M16 22h4v8h-4zM22 18h4v12h-4zM28 22h4v8h-4z" />
    </>
  ),
  "risk-management": (
    <>
      <circle cx="24" cy="24" r="16" fill="none" strokeWidth="2.4" />
      <circle cx="24" cy="24" r="10" fill="none" strokeWidth="2.4" />
      <circle cx="24" cy="24" r="4" />
      <path d="M24 8v4M24 36v4M8 24h4M36 24h4" strokeWidth="2" strokeLinecap="round" fill="none" />
    </>
  ),
  "strategic-debt": (
    <path d="M26 6 14 26h9l-3 16 16-24h-10l3-12Z" />
  ),
  "income-optimization": (
    <>
      <rect x="10" y="12" width="28" height="18" rx="2.5" />
      <circle cx="24" cy="21" r="5.5" />
      <path
        d="M24 17.5v7M21.5 21h5"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />
      <path d="M14 34h20" strokeWidth="2" strokeLinecap="round" fill="none" />
    </>
  ),
  "strategic-storage": (
    <>
      <path d="M8 36h32V18L24 10 8 18v18Z" />
      <path d="M16 36V22h6v14M26 36V22h6v14" />
      <path d="M20 18h8v6h-8z" />
    </>
  ),
  "the-big-picture": (
    <>
      <circle cx="24" cy="24" r="16" fill="none" strokeWidth="2.4" />
      <ellipse cx="24" cy="24" rx="16" ry="6" fill="none" strokeWidth="2" />
      <path d="M24 8v32" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path
        d="M12 18c4 2 8 3 12 3s8-1 12-3M12 30c4-2 8-3 12-3s8 1 12 3"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
    </>
  ),
};

const DEFAULT_MEDAL_ICON = (
  <>
    <circle cx="24" cy="24" r="14" fill="none" strokeWidth="2.4" />
    <path
      d="M24 14v12l8 5"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </>
);

function MedalIconSvg({
  children,
  className,
  palette,
  gradientId,
  filterId,
}: {
  children: ReactNode;
  className?: string;
  palette: MedalPalette;
  gradientId: string;
  filterId: string;
}) {
  return (
    <svg
      viewBox="0 0 48 48"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className={className}
    >
      <defs>
        <linearGradient id={gradientId} x1="18%" y1="12%" x2="82%" y2="88%">
          <stop offset="0%" stopColor={palette.light} />
          <stop offset="48%" stopColor={palette.mid} />
          <stop offset="100%" stopColor={palette.dark} />
        </linearGradient>
        <filter
          id={filterId}
          x="-20%"
          y="-20%"
          width="140%"
          height="140%"
          colorInterpolationFilters="sRGB"
        >
          <feDropShadow
            dx="-0.9"
            dy="-0.9"
            stdDeviation="0"
            floodColor={palette.highlight}
            floodOpacity="1"
          />
          <feDropShadow
            dx="1"
            dy="1.25"
            stdDeviation="0.35"
            floodColor={palette.shadow}
            floodOpacity="1"
          />
        </filter>
      </defs>
      <g
        fill={`url(#${gradientId})`}
        stroke={`url(#${gradientId})`}
        filter={`url(#${filterId})`}
      >
        {children}
      </g>
    </svg>
  );
}

export function SkillMedalReliefIcon({
  skillSlug,
  tier,
  className,
}: SkillMedalReliefIconProps) {
  const baseId = useId().replace(/:/g, "");
  const gradientId = `${baseId}-fill`;
  const filterId = `${baseId}-emboss`;
  const canonicalSlug = resolveCanonicalSkillSlug(skillSlug);
  const iconPaths =
    SKILL_MEDAL_ICON_PATHS[canonicalSlug] ?? DEFAULT_MEDAL_ICON;
  const palette = tier === "bronze" ? BRONZE_PALETTE : UNLOCKED_PALETTE;

  return (
    <MedalIconSvg
      gradientId={gradientId}
      filterId={filterId}
      palette={palette}
      className={cn("lesson-skill-medal__icon", className)}
    >
      {iconPaths}
    </MedalIconSvg>
  );
}

export function SkillMedalIconPreview({
  skillSlug,
  className,
  ...props
}: { skillSlug: string } & SVGProps<SVGSVGElement>) {
  const canonicalSlug = resolveCanonicalSkillSlug(skillSlug);
  const iconPaths =
    SKILL_MEDAL_ICON_PATHS[canonicalSlug] ?? DEFAULT_MEDAL_ICON;

  return (
    <svg
      viewBox="0 0 48 48"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className={className}
      {...props}
    >
      <g fill="currentColor">{iconPaths}</g>
    </svg>
  );
}
