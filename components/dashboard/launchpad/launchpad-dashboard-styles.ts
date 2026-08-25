/**
 * Launchpad hub typography — aligned with `lesson-shared-styles.ts` and
 * `academy-journey-styles.ts`.
 *
 * Floor: card labels 16–18px, secondary 14px (absolute px — rem must not collapse).
 */

/** Section titles (“In Progress Ventures”, journey map heading). */
export const launchpadSectionHeadingClass =
  "text-center font-heading text-[20px] font-extrabold text-nga-primary sm:text-[24px]";

/** Compact card / chip primary label — option-scale floor. */
export const launchpadCardTitleClass =
  "font-heading text-[17px] font-bold leading-snug text-[#031F82]";

/** Single-line idea chip label — compact carousel tiles. */
export const launchpadChipTitleClass =
  "truncate font-heading text-[13px] font-bold leading-tight text-[#031F82]";

/** Eyebrow labels (Active Journey, Discovery Brief, premium unlock). */
export const launchpadEyebrowClass =
  "font-heading text-[14px] font-bold uppercase tracking-wide";

/** Venture panel / modal primary title — prompt scale. */
export const launchpadPanelTitleClass =
  "font-heading text-[18px] font-extrabold text-[#031F82]";

/** Large modal headline. */
export const launchpadModalTitleClass =
  "font-heading text-[20px] font-extrabold text-[#031F82] sm:text-[24px]";

/** Body copy in drawers, modals, and placeholders. */
export const launchpadBodyClass =
  "font-sans text-[17px] font-medium leading-relaxed text-[#1E3A5F]";

/** Muted helper / empty-state secondary copy. */
export const launchpadBodyMutedClass =
  "font-sans text-[17px] font-medium leading-relaxed text-[#1E3A5F]/80";

/** Progress percentage and numeric meta on venture cards. */
export const launchpadProgressMetaClass =
  "font-heading text-[14px] font-bold tabular-nums text-[#0CC1E0]";

/** Overlay status badge (“In Progress”). */
export const launchpadStatusBadgeClass =
  "rounded-full bg-[#0CC1E0]/90 px-2 py-0.5 font-heading text-[14px] font-bold uppercase tracking-wide text-white";

/** Primary CTA label styling (pair with color/border utility classes). */
export const launchpadCtaLabelClass =
  "font-heading text-[16px] font-bold uppercase tracking-wide";

/** Secondary dismiss / text action. */
export const launchpadSecondaryActionClass =
  "font-heading text-[16px] font-bold text-[#0CC1E0]";

/** Empty-state panel title. */
export const launchpadEmptyTitleClass =
  "font-heading text-[18px] font-extrabold text-[#031F82]";

/** Eyebrow on gold / premium surfaces. */
export const launchpadPremiumEyebrowClass =
  "font-heading text-[14px] font-bold uppercase tracking-wide text-[#DCB766]";

/** Active-journey eyebrow tint. */
export const launchpadJourneyEyebrowClass =
  "font-heading text-[14px] font-bold uppercase tracking-wide text-[#0CC1E0]";

/** Empty carousel helper when no ventures are active. */
export const launchpadEmptyHelperClass =
  "font-sans text-[16px] font-medium text-[#1E3A5F]/70";
