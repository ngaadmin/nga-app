/**
 * Academy journey / learning map typography — aligned with
 * `lesson-shared-styles.ts` and `docs/academy-screen-types.md`.
 *
 * Floor: primary labels use `text-base`; supporting metadata uses `text-sm`.
 */

/** Journey page title — above lesson prompt scale. */
export const academyJourneyHeadingClass =
  "text-center font-heading text-xl font-extrabold text-nga-primary sm:text-2xl";

/** Module card title — matches lesson prompt (`text-lg`). */
export const academyModuleTitleClass =
  "text-center font-heading text-lg font-bold leading-snug text-[#031F82]";

/** Module description and primary map copy — option-scale minimum (`text-base`). */
export const academyModuleDescriptionClass =
  "text-center font-sans text-base font-medium leading-snug text-nga-slate";

/** Supporting metadata (lesson count, stat labels) — eyebrow-adjacent, still mobile-readable. */
export const academyJourneyMetaClass =
  "font-heading text-sm font-bold uppercase tracking-wide";

/** Sticky HUD banner — current lesson / step label. */
export const academyContextBannerLabelClass =
  "text-center font-heading text-lg font-bold leading-snug text-white sm:text-xl";

/** Momentum card stat labels (streak, XP). */
export const academyMomentumLabelClass =
  "font-heading text-sm font-bold text-nga-slate sm:text-base";

/** Momentum card primary values. */
export const academyMomentumValueClass =
  "font-heading text-xl font-extrabold leading-none text-nga-primary sm:text-2xl";

/** Momentum card unit suffix (days, pts). */
export const academyMomentumUnitClass =
  "ml-1 text-sm font-bold text-nga-slate sm:text-base";
