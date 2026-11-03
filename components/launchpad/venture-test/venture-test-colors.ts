/**
 * Colors for the TEST-ONLY venture flow.
 * Brand colors mirror the app/globals.css tokens (SVG fills cannot read
 * Tailwind classes). The illustration-only colors have no globals.css token,
 * so per the design handoff they stay inside these components.
 */
export const VT = {
  ink: "#031f82", // --color-nga-ink
  slate: "#1e3a5f", // --color-nga-slate
  secondary: "#0cc1e0", // --color-nga-secondary
  secondaryShadow: "#099fb8", // --color-nga-secondary-shadow
  cta: "#ffa503", // --color-nga-cta
  ctaShadow: "#c88202", // --color-nga-cta-shadow
  accent: "#dcb766", // --color-nga-accent (gold)
  panel: "#bde9fb", // --color-nga-panel
  mist: "#e8f6fc", // --color-nga-mist
  // Illustration-only (no token): building, lift and lock art.
  facade: "#d9f1fb",
  ledge: "#8fd3ee",
  windowOff: "#c9d8e6",
  step1: "#cfdbe6",
  step2: "#dfe8f0",
  lockIcon: "#8a9bb0",
  lockFill: "#eef2f6",
  lockDot: "#d3dce6",
  liftDoor: "#dde7ef",
  liftDoorEdge: "#c9d6e2",
  divider: "#e3eef5",
} as const;

/** SVG <text> can't use next/font class names, so it reads the font variable. */
export const SVG_HEADING_FONT = { fontFamily: "var(--font-heading)" } as const;
