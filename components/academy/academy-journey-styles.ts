/**
 * Academy journey / learning map typography — aligned with
 * `lesson-shared-styles.ts` and `docs/academy-screen-types.md`.
 *
 * Floor: card labels 16–18px, secondary 14px (absolute px — rem must not collapse).
 */

/** Journey page title — above lesson prompt scale. */
export const academyJourneyHeadingClass =
  "text-center font-heading text-[20px] font-extrabold text-nga-primary sm:text-[24px]";

/** Module header title on the soft floating journey label. */
export const academyModuleTitleClass =
  "text-center font-heading text-[17px] font-extrabold leading-snug text-[#031F82]";

/** Module header sub-line on the soft floating journey label. */
export const academyModuleDescriptionClass =
  "text-center font-sans text-[14px] font-medium leading-snug text-[#1E3A5F]/80";

/** Supporting metadata (lesson count, stat labels) — eyebrow-adjacent, still mobile-readable. */
export const academyJourneyMetaClass =
  "font-heading text-[14px] font-bold uppercase tracking-wide";

/** Sticky HUD banner — current lesson / step label. */
export const academyContextBannerLabelClass =
  "text-center font-heading text-[18px] font-bold leading-snug text-white sm:text-[20px]";

/** Momentum card stat labels (streak, XP). */
export const academyMomentumLabelClass =
  "font-heading text-[16px] font-bold text-nga-slate sm:text-[17px]";

/** Momentum card primary values. */
export const academyMomentumValueClass =
  "font-heading text-[20px] font-extrabold leading-none text-nga-primary sm:text-[24px]";

/** Momentum card unit suffix (days, pts). */
export const academyMomentumUnitClass =
  "ml-1 text-[14px] font-bold text-nga-slate sm:text-[16px]";
